// Creates (or promotes) the Owner account.
// Usage: npm run create-owner -- --name "Your Name" --email you@example.com --phone 9876543210
// The password is asked for interactively so it never ends up in shell history.
import '../env.js';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { email as validEmail, phone as validPhone, password as validPassword, str } from '../utils/validate.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
  return acc;
}, []));

const ask = (q) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // Strip a BOM and the trailing \r that Windows terminals can add to input.
  rl.question(q, (a) => { rl.close(); resolve(a.replace(/^﻿/, '').replace(/\r$/, '')); });
});

try {
  const name = str(args.name || await ask('Owner name: '), { field: 'Name', min: 2, max: 80, required: true });
  const mail = validEmail(args.email || await ask('Owner email: '), { required: true });
  const mobile = validPhone(args.phone || await ask('Mobile number: '));
  const pass = validPassword(await ask('Password (min 8 characters): '));
  const hash = await bcrypt.hash(pass, 12);

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(mail);
  if (existing) {
    db.prepare("UPDATE users SET name = ?, phone = ?, password = ?, role = 'owner', is_active = 1 WHERE id = ?").run(name, mobile, hash, existing.id);
    db.prepare('DELETE FROM manager_permissions WHERE user_id = ?').run(existing.id);
    console.log(`Updated ${mail} and set role to Owner.`);
  } else {
    db.prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'owner')").run(name, mail, mobile, hash);
    console.log(`Owner account created for ${mail}.`);
  }
  process.exit(0);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
