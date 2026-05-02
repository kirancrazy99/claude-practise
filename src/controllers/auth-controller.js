const authService = require('../services/auth-service');

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const existing = await authService.findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await authService.hashPassword(password);
  const user = await authService.createUser(email, passwordHash);

  res.status(201).json({ id: user.id, email: user.email });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await authService.findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await authService.verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = authService.signAccessToken(user.id);
  const refreshToken = await authService.createRefreshToken(user.id);

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
  res.json({ accessToken });
};

const logout = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await authService.revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE);
  res.status(204).send();
};

const refresh = async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  if (!oldToken) return res.status(401).json({ error: 'No refresh token' });

  const newToken = await authService.rotateRefreshToken(oldToken);
  if (!newToken) return res.status(401).json({ error: 'Invalid or expired refresh token' });

  const accessToken = authService.signAccessToken(newToken.userId);
  res.cookie(REFRESH_COOKIE, newToken, COOKIE_OPTS);
  res.json({ accessToken });
};

module.exports = { register, login, logout, refresh };
