const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('./db');

const DEFAULT_INSECURE_SECRET = 'fastderash_admin_secret_2024_change_in_production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_INSECURE_SECRET;
const JWT_EXPIRES_IN = '24h';

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || JWT_SECRET === DEFAULT_INSECURE_SECRET || JWT_SECRET.length < 32)
) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be set to a strong random string (>= 32 chars) in production.');
}

async function hashPassword(pw) {
  return await bcrypt.hash(pw, 10);
}

async function verifyPassword(pw, hash) {
  if (!hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return await bcrypt.compare(pw, hash);
  }
  const sha = crypto.createHash('sha256').update(pw).digest('hex');
  return sha === hash;
}

function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, role: admin.role, email: admin.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyToken(token);
    if (!decoded.id || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  try {
    const adminRes = await db.query('SELECT role, is_active FROM users WHERE id = $1', [decoded.id]);
    if (adminRes.rows.length === 0 || adminRes.rows[0].role !== 'admin' || adminRes.rows[0].is_active === false) {
      return res.status(403).json({ error: 'Admin access revoked or inactive' });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
}

module.exports = { hashPassword, verifyPassword, generateToken, verifyToken, adminMiddleware };
