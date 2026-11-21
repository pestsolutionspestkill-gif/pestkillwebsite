import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

// Normalize legacy roles
const normalize = (role) => {
  if (role === 'admin') return 'owner';
  if (role === 'user') return 'client';
  return role;
};

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const decoded = jwt.verify(token, JWT_SECRET);
    decoded.role = normalize(decoded.role);
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};

export const ownerAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'owner') return res.status(403).json({ error: 'Owner access required' });
    next();
  });
};

export const managerOrOwnerAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!['owner', 'manager'].includes(req.user.role))
      return res.status(403).json({ error: 'Manager or Owner access required' });
    next();
  });
};

// Middleware factory: checks a specific permission for managers (owners bypass)
export const hasPermission = (permName) => (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role === 'owner') return next(); // owners bypass all checks
    if (req.user.role === 'manager') {
      const row = req.db
        .prepare('SELECT granted FROM manager_permissions WHERE manager_id = ? AND permission = ?')
        .get(req.user.id, permName);
      if (row && row.granted === 1) return next();
      return res.status(403).json({ error: `Permission '${permName}' required` });
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  });
};

export const auditLog = (action, targetType) => (req, res, next) => {
  const original = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && req.user) {
      try {
        req.db.prepare(
          `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          req.user.id,
          req.user.name || req.user.email || '',
          req.user.role,
          action,
          targetType,
          String(body?.id || req.params?.id || ''),
          JSON.stringify({ body: req.body, params: req.params }).substring(0, 500),
          req.ip
        );
      } catch { /* non-critical */ }
    }
    return original(body);
  };
  next();
};
