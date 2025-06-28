export const appUserDTO = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    type: user.type,
    business_name: user.business_name || null,
    createdAt: user.createdAt,
    // Include any other necessary public fields
  };
};
