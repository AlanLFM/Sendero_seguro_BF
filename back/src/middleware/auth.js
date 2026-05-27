import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[AUTH] Error de autenticacion:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Token invalido' });
  }
};

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, boleta: user.boleta, correo: user.correo, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

export const hashRefreshToken = async (token) => {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(token, 10);
};

export const verifyRefreshToken = async (storedHash, token) => {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(token, storedHash);
};
