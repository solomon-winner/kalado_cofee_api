/**
 * app-user controller
 */

import { factories } from '@strapi/strapi'
import bcrypt from 'bcryptjs';

export default factories.createCoreController('api::app-user.app-user', ({ strapi }) => ({
  
  // ✅ Custom Register
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

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await strapi.entityService.create('api::app-user.app-user', {
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
      },
    });

    // Optional: create a token or session here

    return ctx.created({ user: newUser });
  },

  // ✅ Custom Login
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

    // ⚠️ Compare hashed passwords here
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return ctx.unauthorized('Invalid credentials');
    }

    // Optional: create JWT or session
    return ctx.send({ user });
  }
}));
