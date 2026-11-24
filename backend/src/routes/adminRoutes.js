import express from 'express';
import bcrypt from 'bcryptjs';
import db, { PERMISSIONS, GRANTABLE, DEFAULT_MANAGER_PERMISSIONS, ROLES, permissionsFor, audit, NOW, IST_DATE } from '../db.js';
import { ownerOnly, staffOnly, requirePermission, can, ah } from '../middleware/rbac.js';
import { str, email, password, phone, oneOf, intId, ValidationError } from '../utils/validate.js';
import { checkPersonName } from '../utils/antiAbuse.js';
import { LEAD_STATUSES } from './leadRoutes.js';

const router = express.Router();

const USER_COLUMNS = 'id, name, email, phone, role, is_active, city, created_at, last_login';
const forbidden = (msg) => Object.assign(new Error(msg), { status: 403 });

// Indian calendar date (YYYY-MM-DD) for a JS timestamp — reports follow the business's day, not UTC.
const istDay = (ms = Date.now()) => new Date(ms + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// Managers may only act on client accounts; owners may act on anyone but themselves for destructive changes.
const assertCanActOn = (actor, target) => {
  if (!target) throw Object.assign(new Error('User not found.'), { status: 404 });
  if (actor.role === 'manager' && target.role !== 'client') throw forbidden('Managers can only manage client accounts.');
};

/* ---------- Staff directory (for assigning bookings) ---------- */
router.get('/staff', staffOnly, ah(async (_req, res) => {
  res.json(await db.all("SELECT id, name, role FROM users WHERE role IN ('owner','manager','technician') AND is_active = 1 ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END, name"));
}));

/* ---------- Users ---------- */
router.get('/users', requirePermission('users.view'), ah(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role === 'manager') where.push("role = 'client'");
  if (req.query.role) { where.push('role = ?'); params.push(oneOf(req.query.role, ROLES, 'role')); }
  if (req.query.q) {
    where.push('(name ILIKE ? OR email ILIKE ? OR phone ILIKE ?)');
    const q = `%${String(req.query.q).slice(0, 60)}%`;
    params.push(q, q, q);
  }
  res.json(await db.all(`SELECT ${USER_COLUMNS} FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 500`, ...params));
}));

router.post('/users', requirePermission('users.create', 'users.assign_roles'), ah(async (req, res) => {
  const role = oneOf(req.body.role || 'client', ROLES, 'role');
  if (role !== 'client' && !can(req.user, 'users.assign_roles')) throw forbidden('Only the owner can create staff accounts.');
  if (role === 'client' && !can(req.user, 'users.create')) throw forbidden('You cannot create client accounts.');

  const name = checkPersonName(req.body.name, 'Name');
  const mail = email(req.body.email, { required: true });
  const mobile = phone(req.body.phone);
  const pass = password(req.body.password);
  if (await db.get('SELECT 1 FROM users WHERE email = ?', mail)) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hash = await bcrypt.hash(pass, 12);
  const id = await db.tx(async (t) => {
    const u = await t.get('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?) RETURNING id', name, mail, mobile, hash, role);
    if (role === 'manager') {
      for (const p of DEFAULT_MANAGER_PERMISSIONS) {
        await t.run('INSERT INTO manager_permissions (user_id, permission, granted_by) VALUES (?, ?, ?)', u.id, p, req.user.id);
      }
    }
    return u.id;
  });
  audit(req, 'user.create', 'user', id, { role, email: mail });
  res.status(201).json(await db.get(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, id));
}));

router.patch('/users/:id', requirePermission('users.edit', 'users.assign_roles'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const target = await db.get('SELECT * FROM users WHERE id = ?', id);
  assertCanActOn(req.user, target);
  if (target.role === 'owner' && target.id !== req.user.id) throw forbidden('Owner accounts cannot be edited by others.');

  const changes = {};
  if (req.body.name !== undefined) changes.name = checkPersonName(req.body.name, 'Name');
  if (req.body.phone !== undefined) changes.phone = phone(req.body.phone);
  if (req.body.isActive !== undefined) {
    if (id === req.user.id) throw new ValidationError('You cannot suspend your own account.');
    changes.is_active = req.body.isActive ? 1 : 0;
  }
  if (req.body.role !== undefined) {
    if (req.user.role !== 'owner') throw forbidden('Only the owner can change roles.');
    if (id === req.user.id) throw new ValidationError('You cannot change your own role.');
    changes.role = oneOf(req.body.role, ROLES, 'role');
  }
  const keys = Object.keys(changes);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update.' });

  await db.tx(async (t) => {
    await t.run(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...keys.map((k) => changes[k]), id);
    if (changes.role && changes.role !== 'manager') await t.run('DELETE FROM manager_permissions WHERE user_id = ?', id);
    if (changes.role === 'manager' && target.role !== 'manager') {
      for (const p of DEFAULT_MANAGER_PERMISSIONS) {
        await t.run('INSERT INTO manager_permissions (user_id, permission, granted_by) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', id, p, req.user.id);
      }
    }
  });
  audit(req, changes.role ? 'user.role_change' : 'user.update', 'user', id, changes);
  res.json(await db.get(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, id));
}));

router.delete('/users/:id', requirePermission('users.delete', 'users.assign_roles'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const target = await db.get('SELECT * FROM users WHERE id = ?', id);
  assertCanActOn(req.user, target);
  if (id === req.user.id) throw new ValidationError('You cannot delete your own account.');
  if (target.role === 'owner') throw forbidden('Owner accounts cannot be deleted.');
  if (target.role !== 'client' && req.user.role !== 'owner') throw forbidden('Only the owner can delete staff accounts.');
  if (target.role === 'client' && !can(req.user, 'users.delete')) throw forbidden('You cannot delete clients.');

  await db.tx(async (t) => {
    await t.run('UPDATE leads SET assigned_to = NULL WHERE assigned_to = ?', id);
    await t.run('UPDATE leads SET technician_id = NULL WHERE technician_id = ?', id);
    await t.run('UPDATE leads SET user_id = NULL WHERE user_id = ?', id);
    await t.run('UPDATE orders SET user_id = NULL WHERE user_id = ?', id);
    await t.run('UPDATE complaints SET user_id = NULL WHERE user_id = ?', id);
    await t.run('DELETE FROM users WHERE id = ?', id);
  });
  audit(req, 'user.delete', 'user', id, { email: target.email, role: target.role });
  res.json({ message: 'User deleted.' });
}));

/* ---------- Permissions (owner only) ---------- */
router.get('/permissions', ownerOnly, (_req, res) => res.json(PERMISSIONS));

router.get('/managers/:id/permissions', ownerOnly, ah(async (req, res) => {
  const manager = await db.get("SELECT id, role FROM users WHERE id = ? AND role = 'manager'", intId(req.params.id));
  if (!manager) return res.status(404).json({ error: 'Manager not found.' });
  res.json(await permissionsFor(manager));
}));

router.put('/managers/:id/permissions', ownerOnly, ah(async (req, res) => {
  const id = intId(req.params.id);
  const manager = await db.get("SELECT id, role FROM users WHERE id = ? AND role = 'manager'", id);
  if (!manager) return res.status(404).json({ error: 'Manager not found.' });
  if (!Array.isArray(req.body.permissions)) throw new ValidationError('permissions must be a list.');
  const requested = [...new Set(req.body.permissions)];
  const invalid = requested.filter((p) => !GRANTABLE.includes(p));
  if (invalid.length) throw new ValidationError(`These permissions cannot be granted to managers: ${invalid.join(', ')}`);

  const before = await permissionsFor(manager);
  await db.tx(async (t) => {
    await t.run('DELETE FROM manager_permissions WHERE user_id = ?', id);
    for (const p of requested) await t.run('INSERT INTO manager_permissions (user_id, permission, granted_by) VALUES (?, ?, ?)', id, p, req.user.id);
  });
  audit(req, 'permissions.update', 'user', id, {
    granted: requested.filter((p) => !before.includes(p)),
    revoked: before.filter((p) => !requested.includes(p)),
  });
  res.json(await permissionsFor(manager));
}));

/* ---------- Stats ---------- */
router.get('/stats', requirePermission('reports.view'), ah(async (req, res) => {
  const scoped = !can(req.user, 'services.assign');
  const scope = scoped ? 'AND assigned_to = ?' : '';
  const sp = scoped ? [req.user.id] : [];
  const count = async (sql, ...p) => (await db.get(sql, ...p)).c;

  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  (await db.all(`SELECT status, COUNT(*)::int c FROM leads WHERE TRUE ${scope} GROUP BY status`, ...sp)).forEach((r) => { byStatus[r.status] = r.c; });

  const stats = {
    leads: {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      today: await count(`SELECT COUNT(*)::int c FROM leads WHERE ${IST_DATE('created_at')} = ?::date ${scope}`, istDay(), ...sp),
      last7: await count(`SELECT COUNT(*)::int c FROM leads WHERE created_at >= ${NOW} - interval '7 days' ${scope}`, ...sp),
      byStatus,
      unassigned: scoped ? null : await count("SELECT COUNT(*)::int c FROM leads WHERE assigned_to IS NULL AND status NOT IN ('completed','cancelled')"),
    },
    recent: await db.all(`SELECT id, ref, type, service, name, city, status, created_at FROM leads WHERE TRUE ${scope} ORDER BY created_at DESC LIMIT 6`, ...sp),
    complaintsOpen: can(req.user, 'complaints.manage') ? await count("SELECT COUNT(*)::int c FROM complaints WHERE status NOT IN ('resolved','closed')") : null,
    applicationsNew: can(req.user, 'careers.manage') ? await count("SELECT COUNT(*)::int c FROM job_applications WHERE status = 'new'") : null,
    clients: can(req.user, 'users.view') ? await count("SELECT COUNT(*)::int c FROM users WHERE role = 'client'") : null,
  };
  if (can(req.user, 'reports.financial')) {
    stats.revenue = await db.get("SELECT COALESCE(SUM(total), 0) total, COUNT(*)::int orders FROM orders WHERE status != 'cancelled'");
  }
  res.json(stats);
}));

/* ---------- Analytics ---------- */
router.get('/analytics', requirePermission('reports.view'), ah(async (req, res) => {
  const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 30));
  const first = istDay(Date.now() - (days - 1) * 86400000);
  const scoped = !can(req.user, 'services.assign');
  const scope = scoped ? 'AND assigned_to = ?' : '';
  const sp = scoped ? [req.user.id] : [];
  const inRange = `${IST_DATE('created_at')} >= ?::date ${scope}`;

  const daily = await db.all(`SELECT ${IST_DATE('created_at')} d, COUNT(*)::int n, COUNT(*) FILTER (WHERE status = 'completed')::int done
    FROM leads WHERE ${inRange} GROUP BY 1`, first, ...sp);
  const map = Object.fromEntries(daily.map((r) => [r.d, r]));
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = istDay(Date.now() - i * 86400000);
    series.push({ date: d, leads: map[d]?.n || 0, completed: map[d]?.done || 0 });
  }

  const group = (col) => db.all(`SELECT COALESCE(NULLIF(TRIM(${col}), ''), 'Not specified') label, COUNT(*)::int n
    FROM leads WHERE ${inRange} GROUP BY 1 ORDER BY n DESC LIMIT 8`, first, ...sp);

  const totals = await db.get(`SELECT COUNT(*)::int total,
    COUNT(*) FILTER (WHERE status = 'completed')::int completed,
    COUNT(*) FILTER (WHERE status = 'cancelled')::int cancelled,
    COUNT(*) FILTER (WHERE status IN ('new','contacted'))::int pending,
    COUNT(*) FILTER (WHERE type = 'booking')::int bookings
    FROM leads WHERE ${inRange}`, first, ...sp);

  const result = {
    days,
    scoped,
    totals: { ...totals, conversion: totals.total ? Math.round((totals.completed / totals.total) * 100) : 0 },
    series,
    byService: await group('service'),
    byCity: await group('city'),
    bySource: await group('source'),
    byType: await group('type'),
  };

  if (!scoped) {
    result.workload = await db.all(`SELECT u.id, u.name, u.role,
      (SELECT COUNT(*)::int FROM leads WHERE (assigned_to = u.id OR technician_id = u.id) AND status NOT IN ('completed','cancelled')) "open",
      (SELECT COUNT(*)::int FROM leads WHERE (assigned_to = u.id OR technician_id = u.id) AND status = 'completed' AND ${IST_DATE('completed_at')} >= ?::date) done
      FROM users u WHERE u.role IN ('owner','manager','technician') AND u.is_active = 1 ORDER BY 4 DESC, 5 DESC`, first);
  }

  if (can(req.user, 'reports.financial')) {
    const fin = await db.get(`SELECT COALESCE(SUM(total) FILTER (WHERE status != 'void'), 0) invoiced,
      COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) collected,
      COALESCE(SUM(total) FILTER (WHERE status = 'unpaid'), 0) outstanding, COUNT(*)::int invoices
      FROM invoices WHERE ${IST_DATE('issued_at')} >= ?::date`, first);
    const rev = Object.fromEntries((await db.all(`SELECT ${IST_DATE('issued_at')} d, SUM(total) v FROM invoices
      WHERE status != 'void' AND ${IST_DATE('issued_at')} >= ?::date GROUP BY 1`, first)).map((r) => [r.d, r.v]));
    result.finance = { ...fin, series: series.map((s) => ({ date: s.date, value: Math.round(rev[s.date] || 0) })) };
  }
  res.json(result);
}));

/* ---------- Schedule (calendar) ---------- */
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

router.get('/schedule', requirePermission('services.view', 'services.assign'), ah(async (req, res) => {
  const from = isDay(req.query.from) ? req.query.from : istDay();
  const to = isDay(req.query.to) ? req.query.to : istDay(Date.now() + 7 * 86400000);
  const toNext = new Date(Date.parse(to) + 86400000).toISOString().slice(0, 10);
  const scoped = !can(req.user, 'services.assign');
  res.json(await db.all(`SELECT l.id, l.ref, l.service, l.name, l.phone, l.city, l.address, l.status, l.scheduled_at, l.preferred_date, l.preferred_slot,
      l.technician_id, t.name technician_name
    FROM leads l LEFT JOIN users t ON t.id = l.technician_id
    WHERE l.status != 'cancelled' AND (
      (l.scheduled_at >= ? AND l.scheduled_at < ?) OR
      (l.scheduled_at IS NULL AND l.preferred_date >= ? AND l.preferred_date <= ?)
    ) ${scoped ? 'AND (l.assigned_to = ? OR l.technician_id = ?)' : ''}
    ORDER BY COALESCE(l.scheduled_at, l.preferred_date)`, from, toNext, from, to, ...(scoped ? [req.user.id, req.user.id] : [])));
}));

/* ---------- Audit log (owner only) ---------- */
router.get('/audit', ownerOnly, ah(async (_req, res) => {
  res.json(await db.all('SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 300'));
}));

export default router;
