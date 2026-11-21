import express from 'express';
import bcrypt from 'bcryptjs';
import db, { PERMISSIONS, GRANTABLE, DEFAULT_MANAGER_PERMISSIONS, ROLES, permissionsFor, audit } from '../db.js';
import { ownerOnly, staffOnly, requirePermission, can } from '../middleware/rbac.js';
import { str, email, password, phone, oneOf, intId, ValidationError } from '../utils/validate.js';
import { LEAD_STATUSES } from './leadRoutes.js';

const router = express.Router();

const USER_COLUMNS = 'id, name, email, phone, role, is_active, city, created_at, last_login';

// Managers may only act on client accounts; owners may act on anyone but themselves for destructive changes.
const assertCanActOn = (actor, target) => {
  if (!target) { const e = new Error('User not found.'); e.status = 404; throw e; }
  if (actor.role === 'manager' && target.role !== 'client') {
    const e = new Error('Managers can only manage client accounts.'); e.status = 403; throw e;
  }
};

/* ---------- Staff directory (for assigning bookings) ---------- */
router.get('/staff', staffOnly, (_req, res) => {
  res.json(db.prepare("SELECT id, name, role FROM users WHERE role IN ('owner','manager') AND is_active = 1 ORDER BY role DESC, name").all());
});

/* ---------- Users ---------- */
router.get('/users', requirePermission('users.view'), (req, res, next) => {
  try {
    const where = [];
    const params = [];
    if (req.user.role === 'manager') where.push("role = 'client'");
    if (req.query.role) { where.push('role = ?'); params.push(oneOf(req.query.role, ROLES, 'role')); }
    if (req.query.q) {
      where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const q = `%${String(req.query.q).slice(0, 60)}%`;
      params.push(q, q, q);
    }
    res.json(db.prepare(`SELECT ${USER_COLUMNS} FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 500`).all(...params));
  } catch (e) { next(e); }
});

router.post('/users', requirePermission('users.create', 'users.assign_roles'), async (req, res, next) => {
  try {
    const role = oneOf(req.body.role || 'client', ROLES, 'role');
    if (role !== 'client' && !can(req.user, 'users.assign_roles')) throw Object.assign(new Error('Only the owner can create staff accounts.'), { status: 403 });
    if (role === 'client' && !can(req.user, 'users.create')) throw Object.assign(new Error('You cannot create client accounts.'), { status: 403 });

    const name = str(req.body.name, { field: 'Name', min: 2, max: 80, required: true });
    const mail = email(req.body.email, { required: true });
    const mobile = phone(req.body.phone);
    const pass = password(req.body.password);
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(mail)) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(pass, 12);
    const create = db.transaction(() => {
      const { lastInsertRowid } = db.prepare('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)').run(name, mail, mobile, hash, role);
      if (role === 'manager') {
        const grant = db.prepare('INSERT INTO manager_permissions (user_id, permission, granted_by) VALUES (?, ?, ?)');
        DEFAULT_MANAGER_PERMISSIONS.forEach((p) => grant.run(lastInsertRowid, p, req.user.id));
      }
      return lastInsertRowid;
    });
    const id = create();
    audit(req, 'user.create', 'user', id, { role, email: mail });
    res.status(201).json(db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(id));
  } catch (e) { next(e); }
});

router.patch('/users/:id', requirePermission('users.edit', 'users.assign_roles'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    assertCanActOn(req.user, target);
    if (target.role === 'owner' && target.id !== req.user.id) throw Object.assign(new Error('Owner accounts cannot be edited by others.'), { status: 403 });

    const changes = {};
    if (req.body.name !== undefined) changes.name = str(req.body.name, { field: 'Name', min: 2, max: 80, required: true });
    if (req.body.phone !== undefined) changes.phone = phone(req.body.phone);
    if (req.body.isActive !== undefined) {
      if (id === req.user.id) throw new ValidationError('You cannot suspend your own account.');
      changes.is_active = req.body.isActive ? 1 : 0;
    }
    if (req.body.role !== undefined) {
      if (req.user.role !== 'owner') throw Object.assign(new Error('Only the owner can change roles.'), { status: 403 });
      if (id === req.user.id) throw new ValidationError('You cannot change your own role.');
      changes.role = oneOf(req.body.role, ROLES, 'role');
    }
    if (!Object.keys(changes).length) return res.status(400).json({ error: 'Nothing to update.' });

    db.transaction(() => {
      const sets = Object.keys(changes).map((k) => `${k} = @${k}`).join(', ');
      db.prepare(`UPDATE users SET ${sets} WHERE id = @id`).run({ ...changes, id });
      if (changes.role && changes.role !== 'manager') db.prepare('DELETE FROM manager_permissions WHERE user_id = ?').run(id);
      if (changes.role === 'manager' && target.role !== 'manager') {
        const grant = db.prepare('INSERT OR IGNORE INTO manager_permissions (user_id, permission, granted_by) VALUES (?, ?, ?)');
        DEFAULT_MANAGER_PERMISSIONS.forEach((p) => grant.run(id, p, req.user.id));
      }
    })();
    audit(req, changes.role ? 'user.role_change' : 'user.update', 'user', id, changes);
    res.json(db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(id));
  } catch (e) { next(e); }
});

router.delete('/users/:id', requirePermission('users.delete', 'users.assign_roles'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    assertCanActOn(req.user, target);
    if (id === req.user.id) throw new ValidationError('You cannot delete your own account.');
    if (target.role === 'owner') throw Object.assign(new Error('Owner accounts cannot be deleted.'), { status: 403 });
    if (target.role === 'manager' && req.user.role !== 'owner') throw Object.assign(new Error('Only the owner can delete managers.'), { status: 403 });
    if (target.role === 'client' && !can(req.user, 'users.delete')) throw Object.assign(new Error('You cannot delete clients.'), { status: 403 });

    db.transaction(() => {
      db.prepare('UPDATE leads SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('UPDATE leads SET user_id = NULL WHERE user_id = ?').run(id);
      db.prepare('UPDATE orders SET user_id = NULL WHERE user_id = ?').run(id);
      db.prepare('UPDATE complaints SET user_id = NULL WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();
    audit(req, 'user.delete', 'user', id, { email: target.email, role: target.role });
    res.json({ message: 'User deleted.' });
  } catch (e) { next(e); }
});

/* ---------- Permissions (owner only) ---------- */
router.get('/permissions', ownerOnly, (_req, res) => res.json(PERMISSIONS));

router.get('/managers/:id/permissions', ownerOnly, (req, res, next) => {
  try {
    const manager = db.prepare("SELECT id, role FROM users WHERE id = ? AND role = 'manager'").get(intId(req.params.id));
    if (!manager) return res.status(404).json({ error: 'Manager not found.' });
    res.json(permissionsFor(manager));
  } catch (e) { next(e); }
});

router.put('/managers/:id/permissions', ownerOnly, (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const manager = db.prepare("SELECT id, role FROM users WHERE id = ? AND role = 'manager'").get(id);
    if (!manager) return res.status(404).json({ error: 'Manager not found.' });
    if (!Array.isArray(req.body.permissions)) throw new ValidationError('permissions must be a list.');
    const requested = [...new Set(req.body.permissions)];
    const invalid = requested.filter((p) => !GRANTABLE.includes(p));
    if (invalid.length) throw new ValidationError(`These permissions cannot be granted to managers: ${invalid.join(', ')}`);

    const before = permissionsFor(manager);
    db.transaction(() => {
      db.prepare('DELETE FROM manager_permissions WHERE user_id = ?').run(id);
      const grant = db.prepare('INSERT INTO manager_permissions (user_id, permission, granted_by) VALUES (?, ?, ?)');
      requested.forEach((p) => grant.run(id, p, req.user.id));
    })();
    audit(req, 'permissions.update', 'user', id, {
      granted: requested.filter((p) => !before.includes(p)),
      revoked: before.filter((p) => !requested.includes(p)),
    });
    res.json(permissionsFor(manager));
  } catch (e) { next(e); }
});

/* ---------- Stats ---------- */
router.get('/stats', requirePermission('reports.view'), (req, res) => {
  const scoped = !can(req.user, 'services.assign');
  const leadWhere = scoped ? 'WHERE assigned_to = ?' : '';
  const leadParams = scoped ? [req.user.id] : [];
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  db.prepare(`SELECT status, COUNT(*) c FROM leads ${leadWhere} GROUP BY status`).all(...leadParams).forEach((r) => { byStatus[r.status] = r.c; });

  const stats = {
    leads: {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      today: db.prepare(`SELECT COUNT(*) c FROM leads ${leadWhere ? `${leadWhere} AND` : 'WHERE'} date(created_at) = date('now')`).get(...leadParams).c,
      last7: db.prepare(`SELECT COUNT(*) c FROM leads ${leadWhere ? `${leadWhere} AND` : 'WHERE'} created_at >= datetime('now', '-7 days')`).get(...leadParams).c,
      byStatus,
      unassigned: scoped ? null : db.prepare("SELECT COUNT(*) c FROM leads WHERE assigned_to IS NULL AND status NOT IN ('completed','cancelled')").get().c,
    },
    recent: db.prepare(`SELECT id, ref, type, service, name, city, status, created_at FROM leads ${leadWhere} ORDER BY created_at DESC LIMIT 6`).all(...leadParams),
    complaintsOpen: can(req.user, 'complaints.manage') ? db.prepare("SELECT COUNT(*) c FROM complaints WHERE status NOT IN ('resolved','closed')").get().c : null,
    applicationsNew: can(req.user, 'careers.manage') ? db.prepare("SELECT COUNT(*) c FROM job_applications WHERE status = 'new'").get().c : null,
    clients: can(req.user, 'users.view') ? db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'client'").get().c : null,
  };
  if (can(req.user, 'reports.financial')) {
    stats.revenue = db.prepare("SELECT COALESCE(SUM(total),0) total, COUNT(*) orders FROM orders WHERE status != 'cancelled'").get();
  }
  res.json(stats);
});

/* ---------- Audit log (owner only) ---------- */
router.get('/audit', ownerOnly, (_req, res) => {
  res.json(db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 300').all());
});

export default router;
