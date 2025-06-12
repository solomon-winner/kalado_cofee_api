/**
 * app-user controller
 */

import { factories } from '@strapi/strapi'
import bcrypt from 'bcryptjs';
import { appUserDTO } from '../../../utils/dto/app-user.dto';

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
    if (!isValid) {
      return ctx.unauthorized('Invalid credentials');
    }

    const token = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });
    return ctx.send({ user: appUserDTO(user), accessToken: token });
  },

  async getUser(ctx) {
  try {
    ctx.body = "Ok"
  } catch (error) {
    ctx.body = "Error"
  }
  },

}));
