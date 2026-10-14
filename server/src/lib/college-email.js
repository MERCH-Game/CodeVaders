/**
 * College Email Verification for CodeVaders Backend
 * Enforces server-side domain allowlist and verification checks for Google OAuth.
 */

/**
 * Parses and normalizes the configured college email domains from the environment variable.
 * Supports multiple comma-separated domains.
 *
 * @param {string} [envValue=process.env.COLLEGE_EMAIL_DOMAINS]
 * @returns {string[]} Array of normalized (lowercase, trimmed) allowed domains.
 */
export function getAllowedCollegeDomains(envValue = process.env.COLLEGE_EMAIL_DOMAINS) {
  if (!envValue || typeof envValue !== 'string') {
    return [];
  }

  return envValue
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => domain.length > 0);
}

/**
 * Validates an email address against the college domain allowlist and verification requirements.
 *
 * Validation rules:
 * 1. Normalize the email address and domain for comparison (lowercase, trimmed).
 * 2. Require an email address from the provider.
 * 3. Require the provider's trusted email_verified claim to be true.
 * 4. Extract the domain after the final '@' and compare against exact allowlist entries.
 * 5. Reject missing, malformed, unverified, or disallowed email addresses.
 * 6. Never use substring matching (e.g., 'college.edu.attacker.com' must not match 'college.edu').
 * 7. Fail closed if the allowlist is missing or empty.
 *
 * @param {Object} params
 * @param {string} params.email - The email address to validate.
 * @param {boolean} params.emailVerified - Whether the identity provider verified this email.
 * @param {string[]} [params.allowedDomains] - Optional list of allowed domains (defaults to process.env.COLLEGE_EMAIL_DOMAINS).
 * @returns {{ valid: boolean, error?: string, errorDescription?: string, normalizedEmail?: string, domain?: string }}
 */
export function validateCollegeEmail({
  email,
  emailVerified,
  allowedDomains = getAllowedCollegeDomains(),
}) {
  // Rule 7: Fail closed if allowlist is missing or empty
  if (!allowedDomains || allowedDomains.length === 0) {
    return {
      valid: false,
      error: 'college_domain_not_configured',
      errorDescription: 'No approved college email domains are currently configured on the server.',
    };
  }

  // Rule 2 & 5: Reject missing, empty, or non-string email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return {
      valid: false,
      error: 'missing_email',
      errorDescription: 'An email address is required from Google.',
    };
  }

  // Rule 1: Normalize email address
  const normalizedEmail = email.trim().toLowerCase();

  // Rule 3: Require Google's trusted email_verified claim to be true
  if (emailVerified !== true) {
    return {
      valid: false,
      error: 'unverified_email',
      errorDescription: 'Your Google account email address must be verified to sign in.',
    };
  }

  // Rule 4: Verify exactly one '@' separator and extract local/domain parts
  const atParts = normalizedEmail.split('@');
  if (atParts.length !== 2) {
    return {
      valid: false,
      error: 'malformed_email',
      errorDescription: 'The provided email address is malformed.',
    };
  }

  const [localPart, domain] = atParts;

  // Validate local and domain part structure
  if (
    !localPart ||
    !domain ||
    localPart.includes(' ') ||
    domain.includes(' ') ||
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    !domain.includes('.')
  ) {
    return {
      valid: false,
      error: 'malformed_email',
      errorDescription: 'The email address format is invalid.',
    };
  }

  // Rule 4 & 6: Exact equality comparison against allowlist entries (NO substring matching)
  const isApproved = allowedDomains.includes(domain);

  if (!isApproved) {
    return {
      valid: false,
      error: 'domain_not_allowed',
      errorDescription: 'Please sign in using your verified MNNIT Allahabad student email address (@mnnit.ac.in).',
    };
  }

  return {
    valid: true,
    normalizedEmail,
    domain,
  };
}
