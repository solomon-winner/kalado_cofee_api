/**
 * app-user controller
 */

import { factories } from '@strapi/strapi'
import bcrypt from 'bcryptjs';
import { appUserDTO } from '../../../utils/dto/app-user.dto';
import { verifyToken } from '../../../utils/dto/verify-token';
import { generateToken } from '../../../utils/dto/generate-token';
import crypto from 'crypto';
import sendEmailService from '../../my-service/controllers/email-service';

export default factories.createCoreController('api::app-user.app-user', ({ strapi }) => ({

  async register(ctx) {
    const { email, password, name, phone,type } = ctx.request.body;

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }

    // Check if email already exists
    const existingUsers = await strapi.entityService.findMany('api::app-user.app-user', {
      filters: { email },
    });

    if (existingUsers.length > 0) {
      return ctx.conflict('Email already in use');
    }

    // Create new user
    const newUser = await strapi.entityService.create('api::app-user.app-user', {
      data: {
        email,
        phone,
        password,
        name,
        type
      },
    });

    return ctx.created({ user: appUserDTO(newUser)});
  },
  
  async login(ctx) {
    const { email, password } = ctx.request.body;
    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }
    const users = await strapi.entityService.findMany('api::app-user.app-user', {
      filters: { email, deletedAt: null },
    });

    const user = users[0];
    if (!user) {
      return ctx.unauthorized('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return ctx.unauthorized('Invalid credentials');
    }

    const token = generateToken(user);
    return ctx.send({ user: appUserDTO(user), accessToken: token });
  },

async getUser(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const user = await strapi.db.query('api::app-user.app-user').findOne({
      where: { id: decoded.id, deletedAt: null},
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    return ctx.send({ user: appUserDTO(user) });
  } catch (err) {
    strapi.log.error('Get user error:', err);
    return ctx.unauthorized(err.message || 'Unauthorized');
  }
},

async updateme(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const { phone, name } = ctx.request.body;
    if (!phone || !name) {
      throw new Error('Both name and phone are required');
    }

    const updatedUser = await strapi.entityService.update('api::app-user.app-user', userId, {
      data: { phone, name }, 
    });

    return ctx.send({ user: appUserDTO(updatedUser) });
  } catch (err) {
    strapi.log.error('Update error:', err);
    return ctx.unauthorized(err.message || 'Unauthorized');
  }
},

async deleteme(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    // Check if user exists
    const existingUser = await strapi.db.query('api::app-user.app-user').findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!existingUser) {
      return ctx.notFound('User not found or already deleted');
    }

    // Soft delete by updating deletedAt
    const deletedUser = await strapi.entityService.update('api::app-user.app-user', userId, {
      data: {
        deletedAt: new Date(),
      },
    });

    return ctx.send({ message: 'User deleted successfully', user: appUserDTO(deletedUser) });
  } catch (err) {
    strapi.log.error('Soft delete user error:', err);
    return ctx.unauthorized(err.message || 'Unauthorized');
  }
},
async changePassword(ctx) {
  try {
    const decoded = verifyToken(ctx); // Extract user ID from token
    const userId = decoded.id;

    const { currentPassword, newPassword } = ctx.request.body;

    if (!currentPassword || !newPassword) {
      return ctx.badRequest('Both current and new password are required');
    }

    // Fetch the user from DB
    const user = await strapi.db.query('api::app-user.app-user').findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return ctx.unauthorized('Current password is incorrect');
    }

    // Optional: Prevent reuse of the same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return ctx.badRequest('New password must be different from the old one');
    }


    // Save new password
    await strapi.entityService.update('api::app-user.app-user', userId, {
      data: {
        password: newPassword,
      },
    });

    return ctx.send({ message: 'Password changed successfully' });
  } catch (err) {
    strapi.log.error('Change password error:', err);
    return ctx.unauthorized(err.message || 'Unauthorized');
  }
},

async forgotPassword(ctx) {
  const { email } = ctx.request.body;

  if (!email) {
    return ctx.badRequest('Email is required');
  }

  const users = await strapi.db.query('api::app-user.app-user').findMany({
    where: { email, deletedAt: null },
  });

  const user = users[0];
  if (!user) {
    // intended to not reveal that user doesn't exist
    return ctx.send({ message: 'If your email is registered, you will receive a reset link.' });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes expiry

  await strapi.entityService.update('api::app-user.app-user', user.id, {
    data: {
      resetPasswordToken: resetToken,
      resetTokenExpiry: expiry,
    },
  });

  // Send email (using your provider)
  const resetLink = `https://kalado-coffee.vercel.app/reset-password?token=${resetToken}`;
    await sendEmailService.sendEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Click the following link to reset your password: ${resetLink}`,
  });


  return ctx.send({ message: 'If your email is registered, you will receive a reset link.' });
},

async resetPassword(ctx) {
  const { token, newPassword } = ctx.request.body;

  if (!token || !newPassword) {
    return ctx.badRequest('Token and new password are required');
  }

  const users = await strapi.db.query('api::app-user.app-user').findMany({
    where: {
      resetPasswordToken: token,
      resetTokenExpiry: { $gt: new Date() },
      deletedAt: null,
    },
  });

  const user = users[0];

  if (!user) {
    return ctx.badRequest('Invalid or expired token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await strapi.entityService.update('api::app-user.app-user', user.id, {
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetTokenExpiry: null,
    },
  });

  return ctx.send({ message: 'Password reset successful' });
},

async getRetailerOrders(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const status = ctx.query.status || ''; // Default to empty string

    const filters = {
      retailer: userId,
      ...(status && { status }), // Only filter by status if it's provided
    };

    const orders = await strapi.entityService.findMany("api::order.order", {
      filters,
      populate: {
        order_items: {
          populate: ['product'],
        },
      },
    });

    return ctx.send({
      message: 'Retailer orders retrieved successfully',
      orders,
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch retailer orders");
  }
}


}));
