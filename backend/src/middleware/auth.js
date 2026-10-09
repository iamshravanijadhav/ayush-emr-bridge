import { adminAuth, db } from '../firebase.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new AppError(401, 'UNAUTHORIZED', 'A Firebase ID token is required.');
    const decoded = await adminAuth.verifyIdToken(match[1], true);
    let role = decoded.role || null;
    if (!role) {
      const userDoc = await db.collection('users').doc(decoded.uid).get();
      role = userDoc.exists ? userDoc.data().role : null;
    }
    if (!['admin', 'clinician', 'viewer'].includes(role)) {
      throw new AppError(403, 'ROLE_REQUIRED', 'Your account has no authorized application role. Ask an administrator.');
    }
    req.user = { uid: decoded.uid, email: decoded.email || null, role };
    next();
    } catch (err) {
      console.error('Firebase token verification error:', err.code || err.name, err.message);
      if (err instanceof AppError) return next(err);
      return next(new AppError(401, 'INVALID_TOKEN', 'The Firebase ID token is invalid or expired.'));
    }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Your role is not allowed to perform this action.'));
    }
    next();
  };
}
