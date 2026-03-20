import { FastifyInstance } from 'fastify';
import { registerUserHandler, verifyUserHandler, loginUserHandler, refreshAccessTokenHandler, logoutUserHandler } from '../controllers/auth.controller';
import { registerUserSchema, verifyUserSchema, loginUserSchema, refreshTokenSchema } from '../schemas/auth.schema';

export default async function authRoutes(server: FastifyInstance) {
  server.post(
    '/register',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    registerUserHandler
  );

  server.post(
    '/verify',
    {},
    verifyUserHandler
  );

  server.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    loginUserHandler
  );

  server.post(
    '/refresh',
    {},
    refreshAccessTokenHandler
  );

  server.post(
    '/logout',
    {},
    logoutUserHandler
  );
}
