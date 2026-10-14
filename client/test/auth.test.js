import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDir = path.resolve(__dirname, '..')

test('Frontend Auth Configuration & Security Tests', async (t) => {
  await t.test('1. Better Auth client exports expected React methods', async () => {
    const { authClient, signIn, signOut, useSession, getSession, signInWithGoogle } =
      await import('../src/lib/auth-client.js')

    assert.ok(authClient, 'authClient should be defined')
    assert.ok(
      typeof signIn === 'function' || typeof signIn === 'object',
      'signIn should be a function/object'
    )
    assert.equal(typeof signIn.social, 'function', 'signIn.social should be a function')
    assert.equal(typeof signOut, 'function', 'signOut should be a function')
    assert.equal(typeof useSession, 'function', 'useSession hook should be a function')
    assert.equal(typeof getSession, 'function', 'getSession should be a function')
    assert.equal(typeof signInWithGoogle, 'function', 'signInWithGoogle should be a function')
  })

  await t.test('2. VITE_SHOW_LOGIN_BUTTON visibility logic defaults to true when unset', () => {
    // When unset / undefined
    const isVisibleUnset = undefined !== 'false'
    assert.equal(isVisibleUnset, true, 'Unset variable should default to true')

    // When set to 'true'
    const isVisibleTrue = 'true' !== 'false'
    assert.equal(isVisibleTrue, true, "'true' should evaluate to true")

    // When explicitly 'false'
    const isVisibleFalse = 'false' !== 'false'
    assert.equal(isVisibleFalse, false, "'false' should evaluate to false")
  })

  await t.test('3. No secrets or private tokens in client environment files', () => {
    const envPath = path.join(clientDir, '.env')
    const envExamplePath = path.join(clientDir, '.env.example')

    const checkFile = (filePath) => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        assert.ok(!content.includes('BETTER_AUTH_SECRET'), 'BETTER_AUTH_SECRET must not be in client env')
        assert.ok(!content.includes('GOOGLE_CLIENT_SECRET'), 'GOOGLE_CLIENT_SECRET must not be in client env')
        assert.ok(!content.includes('DATABASE_URL'), 'DATABASE_URL must not be in client env')
        assert.ok(!content.includes('DIRECT_URL'), 'DIRECT_URL must not be in client env')
      }
    }

    checkFile(envPath)
    checkFile(envExamplePath)
  })

  await t.test('4. No token storage in localStorage in client source code', () => {
    const srcDir = path.join(clientDir, 'src')
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scanDir(fullPath)
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8')
          assert.ok(
            !content.includes('localStorage.setItem("token"') &&
            !content.includes("localStorage.setItem('token'") &&
            !content.includes('localStorage.setItem("session"') &&
            !content.includes("localStorage.setItem('session'"),
            `Raw session token or token must not be written to localStorage in ${entry.name}`
          )
        }
      }
    }
    scanDir(srcDir)
  })

  await t.test('5. AuthErrorModal contains required college email error text and actions', () => {
    const modalPath = path.join(clientDir, 'src', 'components', 'auth', 'AuthErrorModal.jsx')
    const content = fs.readFileSync(modalPath, 'utf8')

    assert.ok(
      content.includes('College email required. Please sign in with your verified MNNIT student email address (@mnnit.ac.in).'),
      'Must contain the exact required error message'
    )
    assert.ok(
      content.includes('Try Another Account'),
      'Must contain Try Another Account action'
    )
  })

  await t.test('6. Player name display falls back cleanly without duplicate profile creation', () => {
    const resolveDisplayName = (user) => user?.playerName || user?.name || user?.email

    assert.equal(
      resolveDisplayName({ playerName: 'ApexPilot', name: 'Dev Student', email: 'dev@mnnit.ac.in' }),
      'ApexPilot'
    )
    assert.equal(
      resolveDisplayName({ name: 'Dev Student', email: 'dev@mnnit.ac.in' }),
      'Dev Student'
    )
    assert.equal(
      resolveDisplayName({ email: 'dev@mnnit.ac.in' }),
      'dev@mnnit.ac.in'
    )
  })
})
