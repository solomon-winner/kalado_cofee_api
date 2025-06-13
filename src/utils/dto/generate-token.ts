import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id }, // <- use `id` not `user_id` for consistency
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};
