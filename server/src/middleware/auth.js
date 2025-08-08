import { supabaseAnon } from '../supabase.js';

function setAuthCookies(res, session) {
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const sameSite = secure ? 'none' : 'lax';
  res.cookie('sb-access-token', session.access_token, {
    httpOnly: true, secure, sameSite, domain, path: '/', maxAge: 60 * 60 * 24 * 7 * 1000,
  });
  res.cookie('sb-refresh-token', session.refresh_token, {
    httpOnly: true, secure, sameSite, domain, path: '/', maxAge: 60 * 60 * 24 * 30 * 1000,
  });
}

export async function attachUser(req, res, next) {
  const access = req.cookies['sb-access-token'];
  const refresh = req.cookies['sb-refresh-token'];
  if (!access) {
    req.user = null;
    return next();
  }
  let { data, error } = await supabaseAnon.auth.getUser(access);
  if (error && refresh) {
    const { data: refreshed, error: refreshError } = await supabaseAnon.auth.refreshSession({ refresh_token: refresh });
    if (!refreshError && refreshed?.session) {
      setAuthCookies(res, refreshed.session);
      const { data: userData } = await supabaseAnon.auth.getUser(refreshed.session.access_token);
      data = userData;
      error = null;
      req.accessToken = refreshed.session.access_token;
    }
  } else {
    req.accessToken = access;
  }

  if (error) {
    req.user = null;
  } else {
    req.user = data.user;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export { setAuthCookies };

