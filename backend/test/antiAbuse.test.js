import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPersonName, checkFirmName, checkMobile, checkEmailDomain, hasAbuse } from '../src/utils/antiAbuse.js';

const passes = (fn, v) => { try { fn(v); return true; } catch { return false; } };

test('real names are accepted, including ones containing short bad substrings', () => {
  for (const n of ['Prerit Mudgal', 'Rahul Gandhi', 'Shital Patil', 'Sheetal Jain', 'Mohammed Hassan', 'Ravi Chodankar', 'Sunil Bhosale',
    'Kamini Rao', 'Kutty Krishnan', 'Randhir Singh', 'Pandurang Kute', 'Anil Lodha', "D'Souza", 'Mary-Ann Thomas', 'A. K. Verma',
    'Lakshmi Iyyer', 'राहुल शर्मा', 'प्रेरित मुदगल', 'Dickson Paul', 'Prasad K', 'Vikas', 'Om', 'Jo Tate', 'Ayn Rand']) {
    assert.ok(passes(checkPersonName, n), n);
  }
});

test('abusive, fake and reserved names are rejected', () => {
  for (const n of ['Chutiya', 'ch00tiya', 'CHUUUTIYA', 'Rahul Madarchod', 'rahulmadarchod', 'bhenchod', 'B h o s d i k e', 'f.u.c.k',
    'Fuck You', 'f*ck', 'Bitch', 'Gandu Raja', 'gaaandu', 'Randi', 'Harami Kumar', 'Kamina', 'मादरचोद', 'चूतिया', 'भोसड़ीके', 'Behen Chod',
    'Test', 'asdf', 'Admin', 'PestKill Support', 'Rahul123', 'R@hul', 'aaaa', 'Qwerty', 'x', 'Bsdk', 'Mother Fucker', 'Bkl']) {
    assert.ok(!passes(checkPersonName, n), n);
  }
  assert.equal(checkPersonName('  rahul   sharma '), 'Rahul Sharma');
});

test('firm names', () => {
  for (const f of ['Ravi Pest Control', 'Shital Pest & Hygiene (P) Ltd.', 'A-1 Pest Solutions', 'Gandhi Nagar Pest Care']) assert.ok(passes(checkFirmName, f), f);
  for (const f of ['Chutiya Pest Control', 'PestKill Official', 'xyz123 bitch']) assert.ok(!passes(checkFirmName, f), f);
});

test('mobile numbers: exactly 10 real-looking digits', () => {
  for (const p of ['9829012345', '+91 98290 12345', '09829012345', '919829012345', '7014523698', '6375338302']) assert.ok(passes(checkMobile, p), p);
  for (const p of ['9999999999', '9876543210', '6789012345', '9898989898', '9876598765', '1234567890', '5829012345', '98290123',
    '98290123456', '12345982901234', '9000000001']) assert.ok(!passes(checkMobile, p), p);
  assert.equal(checkMobile('+91 98290-12345'), '9829012345');
});

test('email domains: disposable, typos and abuse are rejected', async () => {
  const ok = async (e) => { try { await checkEmailDomain(e, { checkMx: false }); return true; } catch { return false; } };
  for (const e of ['ravi@gmail.com', 'info@pestkill.in', 'a.b@rediffmail.com']) assert.ok(await ok(e), e);
  for (const e of ['x@mailinator.com', 'x@yopmail.com', 'x@10minutemail.com', 'ravi@gmial.com', 'chutiya@gmail.com']) assert.ok(!(await ok(e)), e);
});

test('free text abuse detection', () => {
  assert.ok(hasAbuse('you are a chut1ya'));
  assert.ok(hasAbuse('maaadarchod'));
  assert.ok(!hasAbuse('Please treat the kitchen; cockroaches since Monday. Shital, Gandhi Nagar.'));
});
