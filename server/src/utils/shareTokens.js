import jwt from 'jsonwebtoken';

const DEFAULT_TTL_SECONDS = Number(process.env.SHARE_LINK_TTL_SECONDS || 3600);

const getShareSecret = (() => {
  let cachedSecret = null;
  return () => {
    if (cachedSecret) {
      return cachedSecret;
    }

    const secret = (process.env.SHARE_LINK_SECRET || process.env.JWT_SECRET || '').trim();
    if (!secret) {
      throw new Error(
        'Share link secret is not configured. Set SHARE_LINK_SECRET or reuse JWT_SECRET.'
      );
    }

    cachedSecret = secret;
    return cachedSecret;
  };
})();

export const createShareToken = (payload, options = {}) => {
  const secret = getShareSecret();
  const ttl = Number(options.expiresIn || DEFAULT_TTL_SECONDS);
  const expiresIn = Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_SECONDS;

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyShareToken = (token) => {
  if (!token) {
    throw new Error('Missing share token');
  }

  const secret = getShareSecret();
  return jwt.verify(token, secret);
};

