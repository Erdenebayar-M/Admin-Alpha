import { scryptSync, randomBytes } from 'crypto'

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/gen-password.mjs <new-password>')
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const hash = scryptSync(password, salt, 64).toString('hex')
console.log(`\nPaste this into your .env file:\n`)
console.log(`ADMIN_PASSWORD_HASH="${salt}:${hash}"`)
