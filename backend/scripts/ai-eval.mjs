// Runs the PestKill AI evaluation set against a running, configured server.
//   node scripts/ai-eval.mjs [baseUrl]      (default http://localhost:5000)
// Every case makes one paid model call. Results are printed; nothing is stored except the
// normal conversation records the server keeps.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');
const { cases } = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/ai/evals.json'), 'utf8'));

const status = await (await fetch(`${base}/api/ai/status`)).json();
if (!status.configured) {
  console.error('PestKill AI is not configured on this server (no ANTHROPIC_API_KEY). Nothing was run.');
  process.exit(2);
}
let failed = 0;
for (const c of cases) {
  const r = await fetch(`${base}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: c.message, lang: c.lang || 'en' }) });
  const j = await r.json();
  const text = j.message?.content || '';
  const problems = [];
  if (!r.ok) problems.push(`HTTP ${r.status}: ${j.error}`);
  for (const p of c.mustMatch || []) if (!new RegExp(p, 'i').test(text)) problems.push(`missing /${p}/`);
  for (const p of c.mustNotMatch || []) if (new RegExp(p, 'i').test(text)) problems.push(`contains /${p}/`);
  if (problems.length) failed += 1;
  console.log(`${problems.length ? 'FAIL' : 'pass'}  ${c.id}${problems.length ? `  ${problems.join('; ')}` : ''}`);
  if (problems.length) console.log(`      answer: ${text.slice(0, 300).replace(/\s+/g, ' ')}`);
}
console.log(`\n${cases.length - failed}/${cases.length} cases passed.`);
process.exit(failed ? 1 : 0);
