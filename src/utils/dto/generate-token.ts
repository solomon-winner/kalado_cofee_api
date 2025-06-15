import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      type: user.type, // Include type if needed
      // Add any other fields you want to include in the token
     }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};
