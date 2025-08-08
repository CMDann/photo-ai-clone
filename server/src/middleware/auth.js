import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'session';

export function setSessionCookie(res, payload) {
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const sameSite = secure ? 'none' : 'lax';
  const ttlDays = Number(process.env.SESSION_TTL_DAYS || 7);
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: `${ttlDays}d` });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/',
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function attachUser(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}
