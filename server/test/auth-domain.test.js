import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCollegeEmail, getAllowedCollegeDomains } from '../src/lib/college-email.js';
import auth from '../src/lib/auth.js';

describe('College Email Domain Allowlist Unit Tests', () => {
  const allowed = ['college.edu', 'eng.college.edu'];

  it('1. Approves a verified email with an exact matching domain', () => {
    const result = validateCollegeEmail({
      email: 'student@college.edu',
      emailVerified: true,
      allowedDomains: allowed,
    });
    assert.equal(result.valid, true);
    assert.equal(result.normalizedEmail, 'student@college.edu');
    assert.equal(result.domain, 'college.edu');
  });

  it('2. Normalizes case and whitespace in email and domains', () => {
    const result = validateCollegeEmail({
      email: '  Student.Name@College.EDU  ',
      emailVerified: true,
      allowedDomains: allowed,
    });
    assert.equal(result.valid, true);
    assert.equal(result.normalizedEmail, 'student.name@college.edu');
    assert.equal(result.domain, 'college.edu');
  });

  it('3. Supports multiple comma-separated domains from environment', () => {
    const domains = getAllowedCollegeDomains('  college.edu , eng.college.edu , campus.ac.in  ');
    assert.deepEqual(domains, ['college.edu', 'eng.college.edu', 'campus.ac.in']);

    const result = validateCollegeEmail({
      email: 'prof@eng.college.edu',
      emailVerified: true,
      allowedDomains: domains,
    });
    assert.equal(result.valid, true);
    assert.equal(result.domain, 'eng.college.edu');
  });

  it('4. Rejects unapproved domains (e.g. personal email)', () => {
    const result = validateCollegeEmail({
      email: 'student@gmail.com',
      emailVerified: true,
      allowedDomains: allowed,
    });
    assert.equal(result.valid, false);
    assert.equal(result.error, 'domain_not_allowed');
  });

  it('5. Rejects unverified email addresses even if domain is valid', () => {
    const result = validateCollegeEmail({
      email: 'student@college.edu',
      emailVerified: false,
      allowedDomains: allowed,
    });
    assert.equal(result.valid, false);
    assert.equal(result.error, 'unverified_email');
  });

  it('6. Rejects domain lookalike and attacker suffix domains (NO substring matching)', () => {
    const attackerAttempts = [
      'student@college.edu.attacker.com',
      'student@fakecollege.edu',
      'student@evil-college.edu',
      'student@college.edu.co',
      'student@notcollege.edu',
    ];

    for (const email of attackerAttempts) {
      const result = validateCollegeEmail({
        email,
        emailVerified: true,
        allowedDomains: allowed,
      });
      assert.equal(result.valid, false, `Expected ${email} to be rejected`);
      assert.equal(result.error, 'domain_not_allowed');
    }
  });

  it('7. Rejects unauthorized subdomains when only apex domain is allowed', () => {
    const result = validateCollegeEmail({
      email: 'student@unapproved.college.edu',
      emailVerified: true,
      allowedDomains: ['college.edu'],
    });
    assert.equal(result.valid, false);
    assert.equal(result.error, 'domain_not_allowed');
  });

  it('8. Fails closed when allowlist is empty or missing', () => {
    const missingResult = validateCollegeEmail({
      email: 'student@college.edu',
      emailVerified: true,
      allowedDomains: [],
    });
    assert.equal(missingResult.valid, false);
    assert.equal(missingResult.error, 'college_domain_not_configured');

    const undefinedResult = validateCollegeEmail({
      email: 'student@college.edu',
      emailVerified: true,
      allowedDomains: null,
    });
    assert.equal(undefinedResult.valid, false);
    assert.equal(undefinedResult.error, 'college_domain_not_configured');
  });

  it('9. Rejects missing, empty, or non-string email inputs', () => {
    const inputs = [null, undefined, '', '   ', 12345];
    for (const input of inputs) {
      const result = validateCollegeEmail({
        email: input,
        emailVerified: true,
        allowedDomains: allowed,
      });
      assert.equal(result.valid, false);
      assert.equal(result.error, 'missing_email');
    }
  });

  it('10. Rejects malformed email structures', () => {
    const malformed = [
      'no-at-symbol',
      '@college.edu',
      'student@',
      'student@@college.edu',
      'student@col lege.edu',
      'student@.college.edu',
      'student@college.edu.',
    ];
    for (const email of malformed) {
      const result = validateCollegeEmail({
        email,
        emailVerified: true,
        allowedDomains: allowed,
      });
      assert.equal(result.valid, false, `Expected ${email} to be rejected as malformed`);
      assert.equal(result.error, 'malformed_email');
    }
  });
});

describe('Better Auth Google Provider & validateUserInfo Integration', () => {
  const validateUserInfo = auth.options.user?.validateUserInfo;

  it('1. validateUserInfo is properly configured on Better Auth instance', () => {
    assert.equal(typeof validateUserInfo, 'function');
  });

  it('2. Google social provider is configured with correct callback URL format', async () => {
    // Generate auth URL using a temporary configured instance to verify redirect URI
    const authUrlResponse = await auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL: 'http://localhost:5173',
      },
    });
    assert.ok(authUrlResponse?.url, 'Expected OAuth URL from signInSocial');
    const url = new URL(authUrlResponse.url);
    assert.equal(url.hostname, 'accounts.google.com');
    assert.equal(
      url.searchParams.get('redirect_uri'),
      'http://localhost:5000/api/auth/callback/google',
      'Expected redirect_uri to match the standard Google callback endpoint'
    );
  });

  it('3. validateUserInfo rejects unapproved domain on user creation (action: create-user)', async () => {
    const hookResult = await validateUserInfo({
      user: {
        email: 'attacker@evil.com',
        emailVerified: true,
        name: 'Evil User',
      },
      source: {
        action: 'create-user',
        method: 'oauth',
        oauth: {
          providerId: 'google',
          profile: {
            email: 'attacker@evil.com',
            email_verified: true,
          },
        },
      },
    });

    assert.ok(hookResult?.error, 'Expected hook to reject unapproved domain');
    assert.ok(
      hookResult.error === 'domain_not_allowed' || hookResult.error === 'college_domain_not_configured',
      `Expected domain error, got ${hookResult.error}`
    );
  });

  it('4. validateUserInfo rejects returning user with unapproved domain on sign-in (action: sign-in)', async () => {
    const hookResult = await validateUserInfo({
      user: {
        email: 'formerstudent@personal.com',
        emailVerified: true,
        name: 'Former Student',
      },
      source: {
        action: 'sign-in',
        method: 'oauth',
        oauth: {
          providerId: 'google',
          profile: {
            email: 'formerstudent@personal.com',
            email_verified: true,
          },
        },
      },
    });

    assert.ok(hookResult?.error, 'Expected hook to reject returning user with unapproved domain');
    assert.ok(
      hookResult.error === 'domain_not_allowed' || hookResult.error === 'college_domain_not_configured',
      `Expected domain error on sign-in, got ${hookResult.error}`
    );
  });

  it('5. validateUserInfo rejects unverified Google account on sign-in', async () => {
    // Override env temporarily
    const original = process.env.COLLEGE_EMAIL_DOMAINS;
    process.env.COLLEGE_EMAIL_DOMAINS = 'college.edu';

    try {
      const hookResult = await validateUserInfo({
        user: {
          email: 'student@college.edu',
          emailVerified: false,
          name: 'Unverified Student',
        },
        source: {
          action: 'create-user',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: 'student@college.edu',
              email_verified: false,
            },
          },
        },
      });

      assert.ok(hookResult?.error, 'Expected hook to reject unverified email');
      assert.equal(hookResult.error, 'unverified_email');
    } finally {
      process.env.COLLEGE_EMAIL_DOMAINS = original;
    }
  });

  it('6. validateUserInfo approves verified Google account with valid college domain', async () => {
    const original = process.env.COLLEGE_EMAIL_DOMAINS;
    process.env.COLLEGE_EMAIL_DOMAINS = 'college.edu';

    try {
      const hookResult = await validateUserInfo({
        user: {
          email: 'student@college.edu',
          emailVerified: true,
          name: 'Verified Student',
        },
        source: {
          action: 'create-user',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: 'student@college.edu',
              email_verified: true,
            },
          },
        },
      });

      assert.equal(hookResult, undefined, 'Expected hook to allow verified college student');
    } finally {
      process.env.COLLEGE_EMAIL_DOMAINS = original;
    }
  });

  it('7. validateUserInfo specifically approves @mnnit.ac.in and rejects personal @gmail.com', async () => {
    const original = process.env.COLLEGE_EMAIL_DOMAINS;
    process.env.COLLEGE_EMAIL_DOMAINS = 'mnnit.ac.in';

    try {
      // Approved MNNIT email
      const approvedResult = await validateUserInfo({
        user: {
          email: '2023cs01@mnnit.ac.in',
          emailVerified: true,
          name: 'MNNIT Student',
        },
        source: {
          action: 'create-user',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: '2023cs01@mnnit.ac.in',
              email_verified: true,
            },
          },
        },
      });
      assert.equal(approvedResult, undefined);

      // Rejected personal Gmail
      const rejectedResult = await validateUserInfo({
        user: {
          email: 'student@gmail.com',
          emailVerified: true,
          name: 'Personal Account',
        },
        source: {
          action: 'create-user',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: 'student@gmail.com',
              email_verified: true,
            },
          },
        },
      });
      assert.ok(rejectedResult?.error);
      assert.equal(rejectedResult.error, 'domain_not_allowed');
      assert.equal(
        rejectedResult.errorDescription,
        'Please sign in using your verified MNNIT Allahabad student email address (@mnnit.ac.in).'
      );
    } finally {
      process.env.COLLEGE_EMAIL_DOMAINS = original;
    }
  });

  it('8. validateUserInfo rejects lookalike domain (e.g. mnnit.ac.in.attacker.com)', async () => {
    const original = process.env.COLLEGE_EMAIL_DOMAINS;
    process.env.COLLEGE_EMAIL_DOMAINS = 'mnnit.ac.in';

    try {
      const rejectedResult = await validateUserInfo({
        user: {
          email: 'student@mnnit.ac.in.attacker.com',
          emailVerified: true,
          name: 'Attacker Account',
        },
        source: {
          action: 'create-user',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: 'student@mnnit.ac.in.attacker.com',
              email_verified: true,
            },
          },
        },
      });
      assert.ok(rejectedResult?.error);
      assert.equal(rejectedResult.error, 'domain_not_allowed');
    } finally {
      process.env.COLLEGE_EMAIL_DOMAINS = original;
    }
  });

  it('9. validateUserInfo rejects returning user with personal Gmail on sign-in (action: sign-in)', async () => {
    const original = process.env.COLLEGE_EMAIL_DOMAINS;
    process.env.COLLEGE_EMAIL_DOMAINS = 'mnnit.ac.in';

    try {
      const rejectedResult = await validateUserInfo({
        user: {
          email: 'personal@gmail.com',
          emailVerified: true,
          name: 'Returning Gmail User',
        },
        source: {
          action: 'sign-in',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: 'personal@gmail.com',
              email_verified: true,
            },
          },
        },
      });
      assert.ok(rejectedResult?.error);
      assert.equal(rejectedResult.error, 'domain_not_allowed');
    } finally {
      process.env.COLLEGE_EMAIL_DOMAINS = original;
    }
  });

  it('10. validateUserInfo approves returning user with verified MNNIT email on sign-in (action: sign-in)', async () => {
    const original = process.env.COLLEGE_EMAIL_DOMAINS;
    process.env.COLLEGE_EMAIL_DOMAINS = 'mnnit.ac.in';

    try {
      const approvedResult = await validateUserInfo({
        user: {
          email: 'dev.2024ca034@mnnit.ac.in',
          emailVerified: true,
          name: 'Returning MNNIT Student',
        },
        source: {
          action: 'sign-in',
          method: 'oauth',
          oauth: {
            providerId: 'google',
            profile: {
              email: 'dev.2024ca034@mnnit.ac.in',
              email_verified: true,
            },
          },
        },
      });
      assert.equal(approvedResult, undefined);
    } finally {
      process.env.COLLEGE_EMAIL_DOMAINS = original;
    }
  });
});
