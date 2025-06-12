/**
 * app-user controller
 */

import { factories } from '@strapi/strapi'
import bcrypt from 'bcryptjs';
// import { sanitize } from '@strapi/utils';

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

    // Optional: create a token or session here

    return ctx.created({ user: newUser });
  },
  
  async login(ctx) {
    const { email, password } = ctx.request.body;
    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }
    const users = await strapi.entityService.findMany('api::app-user.app-user', {
      filters: { email },
    });

    const user = users[0];

    if (!user) {
      return ctx.unauthorized('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('isValid%%%%%%%%%%%%%%%%%%%%%%%%%%%%->',  user.password);
    if (!isValid) {
      return ctx.unauthorized('Invalid credentials');
    }

  // Optional: create JWT or session
    return ctx.send({ user });
  },

  async getUser(ctx) {
  try {
    ctx.body = "Ok"
  } catch (error) {
    ctx.body = "Error"
  }
  },

}));
