/**
 * app-user controller
 */

import { factories } from '@strapi/strapi'
import bcrypt from 'bcryptjs';
import { appUserDTO } from '../../../utils/dto/app-user.dto';
import { verifyToken } from '../../../utils/dto/verify-token';
import { generateToken } from '../../../utils/dto/generate-token';
const { sanitize } = require('@strapi/utils');
const { ValidationError, ApplicationError, ForbiddenError } = require('@strapi/utils').errors;

export default factories.createCoreController('api::app-user.app-user', ({ strapi }) => ({

  async register(ctx) {
    const { email, password, name, phone } = ctx.request.body;

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
      },
    });

    return ctx.created({ user: appUserDTO(newUser)});
  },
  
  async login(ctx) {
    const { email, password } = ctx.request.body;
    console.log("Login request body:", ctx.request.body);
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

    // Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

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
}


}));
