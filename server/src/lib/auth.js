import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma.js';
import { validateCollegeEmail } from './college-email.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:5173'],
  onAPIError: {
    errorURL: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      prompt: 'select_account',
    },
  },
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
    /**
     * Enforce the college email allowlist policy.
     * Better Auth executes this gate for:
     * - "create-user": Brand new account creation
     * - "link-account": Linking Google identity to an existing account
     * - "sign-in": Every returning Google sign-in
     */
    validateUserInfo: async ({ user, source }) => {
      if (source.oauth?.providerId === 'google') {
        const email = user.email || source.oauth.profile?.email;
        const emailVerified =
          user.emailVerified === true ||
          source.oauth.profile?.email_verified === true;

        const validation = validateCollegeEmail({
          email,
          emailVerified,
        });

        if (!validation.valid) {
          return {
            error: validation.error,
            errorDescription: validation.errorDescription,
          };
        }
      }
    },
  },
});

export default auth;
