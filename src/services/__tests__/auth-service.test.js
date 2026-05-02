process.env.JWT_SECRET = 'test-secret-key-for-jest';

const {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
} = require('../auth-service');

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
    await expect(verifyPassword('mypassword', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('mypassword');
    await expect(verifyPassword('wrongpassword', hash)).resolves.toBe(false);
  });
});

describe('signAccessToken / verifyAccessToken', () => {
  it('signs and verifies a token', () => {
    const token = signAccessToken('user-123');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('throws on a tampered token', () => {
    const token = signAccessToken('user-123');
    expect(() => verifyAccessToken(token + 'x')).toThrow();
  });
});
