import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:5173'],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      highestScore: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      playerName: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
});

export default auth;
