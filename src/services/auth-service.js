const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SALT_ROUNDS = 12;

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return token;
};

const rotateRefreshToken = async (oldToken) => {
  const oldHash = hashToken(oldToken);
  const row = await db.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()',
    [oldHash]
  );

  if (!row.rows.length) return null;

  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [oldHash]);

  return createRefreshToken(row.rows[0].user_id);
};

const revokeRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
};

const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const createUser = async (email, passwordHash) => {
  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return result.rows[0];
};

module.exports = {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  findUserByEmail,
  createUser,
};
