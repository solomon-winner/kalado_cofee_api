import jwt, { JwtPayload } from 'jsonwebtoken';

export const verifyToken = (ctx): JwtPayload => {
  const authHeader = ctx.request.header.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded;
};
