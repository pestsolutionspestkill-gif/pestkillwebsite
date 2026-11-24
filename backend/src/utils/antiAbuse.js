// Content and identity checks used at sign-up and on public forms:
// - abusive words (English, Hindi/Hinglish in Latin script, Devanagari), including l33t/repeated-letter tricks
// - realistic person names and firm names
// - realistic Indian mobile numbers (no 9999999999 / 9876543210 style fakes)
// - email domains that cannot receive mail, disposable inboxes and common typos
// Matching is careful not to block real names that merely contain a short word (Gandhi, Shital, Hassan…).
import dns from 'dns';

// ---------- Abusive words ----------
// Short or ambiguous words: only blocked as a whole word.
const EXACT = new Set([
  // English
  'fuck', 'fucker', 'fucked', 'fucking', 'fck', 'fuk', 'shit', 'shitty', 'bitch', 'bitches', 'bastard', 'ass', 'asshole', 'arse',
  'dick', 'dickhead', 'cock', 'cunt', 'pussy', 'whore', 'slut', 'nigger', 'nigga', 'fag', 'faggot', 'retard', 'twat', 'wanker',
  'porn', 'porno', 'sex', 'sexy', 'xxx', 'nude', 'boobs', 'penis', 'vagina', 'rape', 'rapist', 'bollocks', 'bugger', 'prick',
  'motherfucker', 'wtf', 'stfu', 'bsdk', 'bkl', 'mkc', 'tmkc',
  // Hindi / Hinglish
  'gand', 'gaand', 'lund', 'loda', 'lauda', 'lavda', 'lawda', 'laude', 'randi', 'rundi', 'chut', 'choot', 'chod', 'chodu',
  'kutta', 'kutiya', 'kamina', 'kamine', 'kameena', 'kameene', 'harami', 'haramkhor', 'haraamkhor', 'bhadwa', 'bhadwe',
  'bhadva', 'bhadve', 'hijra', 'hijde', 'chakka', 'suar', 'suwar', 'jhaat', 'jhant', 'jhatu', 'chinal',
  'bhosda', 'bhosdi', 'betichod', 'chutad', 'gandu', 'chutiya', 'chutiye', 'chutia', 'lodu', 'lavde', 'lawde', 'cunt',
  // Devanagari
  'गांड', 'गाँड', 'लंड', 'लौड़ा', 'लौडा', 'लोडा', 'रंडी', 'चूत', 'चोद', 'कुत्ता', 'कुत्ते', 'कुतिया', 'कमीना', 'कमीने', 'हरामी', 'हरामखोर',
  'भड़वा', 'भडवा', 'हिजड़ा', 'हिजडा', 'छक्का', 'सुअर', 'झाट', 'झांट',
]);

// Long, unambiguous words: blocked even when joined to other text ("rahulmadarchod").
const ANYWHERE = [
  'madarchod', 'madarchot', 'maderchod', 'madharchod', 'motherchod', 'behenchod', 'bahenchod', 'behanchod', 'bhenchod', 'benchod',
  'bhenchot', 'bhosdike', 'bhosdika', 'bhosdiwale', 'bhosdi', 'chutiya', 'chutiye', 'chutia', 'chutiyapa', 'gandu',
  'gandmara', 'gandfat', 'lavdeka', 'laudeka', 'randibaaz', 'randibaz', 'haramzada', 'haramzade', 'haramkhor', 'kuttekibacche',
  'teribehen', 'terimaaki', 'terimaki', 'maakichut', 'chudai', 'chudwa', 'chodna', 'betichod',
  'fuck', 'motherfucker', 'bitch', 'asshole', 'bastard', 'slut', 'whore', 'nigger', 'faggot', 'dickhead', 'pornstar', 'bullshit',
  'मादरचोद', 'बहनचोद', 'बहनचोद', 'भेनचोद', 'भोसड़ी', 'भोसडी', 'भोसड़ीके', 'चूतिया', 'चुतिया', 'गांडू', 'गान्डू', 'हरामजादा', 'हरामज़ादा', 'चुदाई',
];

const LEET = { 0: 'o', 1: 'i', 2: 'z', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'i', '+': 't' };

// Lower-case, undo look-alike substitutions, drop accents, collapse repeated letters ("chuuutiya" → "chutiya").
const normalize = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '') // é → e (Latin accents only; Devanagari matras are kept)
  .replace(/[0-9@$!|+]/g, (c) => LEET[c] || c)
  .replace(/(\p{L})\1+/gu, '$1');

const EXACT_N = new Set([...EXACT].map(normalize));
const ANYWHERE_N = ANYWHERE.map(normalize);

/** Returns true if the text contains an abusive word. */
export const hasAbuse = (text) => {
  const n = normalize(text);
  const words = n.split(/[^\p{L}\p{M}]+/u).filter(Boolean);
  if (words.some((w) => EXACT_N.has(w))) return true;
  // Also catch letters separated by dots, stars, spaces or dashes: "f.u.c.k", "c h u t i y a".
  const joined = n.replace(/[^\p{L}\p{M}]+/gu, '');
  const spaced = n.split(/[\s._*\-]+/).filter(Boolean);
  if (spaced.length >= 3 && spaced.every((w) => w.length === 1) && EXACT_N.has(normalize(spaced.join('')))) return true;
  return ANYWHERE_N.some((w) => joined.includes(w));
};

// ---------- Names ----------
const RESERVED_WORDS = new Set(['admin', 'administrator', 'moderator', 'pestkill', 'superuser', 'sysadmin'].map(normalize));
const JUNK_NAMES = new Set(['test', 'testing', 'tester', 'user', 'owner', 'support', 'staff', 'system', 'root', 'null', 'undefined',
  'none', 'na', 'nil', 'fake', 'dummy', 'asdf', 'asdfg', 'asdfgh', 'qwerty', 'qwert', 'abc', 'abcd', 'abcde', 'xyz', 'aaa', 'xxx', 'name',
  'myname', 'noname', 'unknown', 'anonymous', 'guest', 'hello', 'hi', 'ok', 'demo', 'sample'].map(normalize));

export class AbuseError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

/** Validates a person's name and returns it tidied ("  rahul   sharma " → "Rahul Sharma"). */
export const checkPersonName = (value, field = 'Name') => {
  const v = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (v.length < 2) throw new AbuseError(`${field} is too short.`);
  if (v.length > 60) throw new AbuseError(`${field} is too long.`);
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(v)) throw new AbuseError(`${field} can contain only letters, spaces, dots and hyphens — no numbers or symbols.`);
  const letters = v.replace(/[^\p{L}]/gu, '');
  if (letters.length < 2) throw new AbuseError(`Please enter a real ${field.toLowerCase()}.`);
  if (/(\p{L})\1\1/iu.test(v)) throw new AbuseError(`Please enter a real ${field.toLowerCase()}.`);
  if (/[a-z]/i.test(v) && !/[aeiouy]/i.test(letters) && letters.length > 3) throw new AbuseError(`Please enter a real ${field.toLowerCase()}.`);
  const n = normalize(v).replace(/[^\p{L}\p{M} ]/gu, ' ').trim();
  if (JUNK_NAMES.has(n.replace(/\s+/g, '')) || n.split(/\s+/).every((w) => JUNK_NAMES.has(w))) throw new AbuseError(`Please enter your real ${field.toLowerCase()}.`);
  if (n.split(/\s+/).some((w) => RESERVED_WORDS.has(w)) || RESERVED_WORDS.has(n.replace(/\s+/g, ''))) throw new AbuseError(`This ${field.toLowerCase()} is not allowed.`);
  if (hasAbuse(v)) throw new AbuseError(`This ${field.toLowerCase()} contains words that are not allowed.`);
  // Title-case Latin words typed all in lower or upper case; leave mixed case (e.g. "McDonald") as typed.
  return v.split(' ').map((w) => (/^[a-z]+$/.test(w) || /^[A-Z]{3,}$/.test(w) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
};

/** Firm / company names: letters, digits and common business punctuation, no abuse. */
export const checkFirmName = (value, field = 'Firm name') => {
  const v = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (v.length < 2 || v.length > 120) throw new AbuseError(`${field} must be 2–120 characters.`);
  if (!/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,&'()/-]*$/u.test(v)) throw new AbuseError(`${field} has characters that are not allowed.`);
  if ((v.match(/\p{L}/gu) || []).length < 2) throw new AbuseError(`Please enter a real ${field.toLowerCase()}.`);
  const n = normalize(v).replace(/[^\p{L}\p{M} ]/gu, ' ').trim().split(/\s+/);
  if (n.some((w) => RESERVED_WORDS.has(w))) throw new AbuseError(`This ${field.toLowerCase()} is not allowed.`);
  if (hasAbuse(v)) throw new AbuseError(`This ${field.toLowerCase()} contains words that are not allowed.`);
  return v;
};

/** Free text (messages, complaints): only blocks abuse, keeps the text as typed. */
export const checkCleanText = (value, field = 'Text') => {
  if (value && hasAbuse(value)) throw new AbuseError(`${field} contains words that are not allowed.`);
  return value;
};

// ---------- Mobile numbers ----------
const SEQ = '01234567890123456789';
const SEQ_DOWN = '98765432109876543210';

/**
 * Indian mobile number: exactly 10 digits (an optional +91 / 91 / 0 prefix is removed), starting 6–9,
 * and not an obvious fake (all one digit, a straight run like 9876543210, only two different digits,
 * or one 5-digit block repeated).
 */
export const checkMobile = (value) => {
  let d = String(value ?? '').replace(/[\s()-]/g, '');
  if (/^\+91/.test(d)) d = d.slice(3);
  else if (/^0091/.test(d)) d = d.slice(4);
  else if (/^91\d{10}$/.test(d)) d = d.slice(2);
  else if (/^0\d{10}$/.test(d)) d = d.slice(1);
  if (!/^\d{10}$/.test(d)) throw new AbuseError('Please enter a valid 10-digit mobile number.');
  if (!/^[6-9]/.test(d)) throw new AbuseError('Indian mobile numbers start with 6, 7, 8 or 9.');
  const distinct = new Set(d).size;
  if (distinct <= 2 || SEQ.includes(d) || SEQ_DOWN.includes(d) || d.slice(0, 5) === d.slice(5) || /(\d)\1{6}/.test(d)) {
    throw new AbuseError('This mobile number does not look real. Please enter your own number.');
  }
  return d;
};

// ---------- Email ----------
// Throw-away inbox services (subset of the most used ones).
const DISPOSABLE = new Set(`mailinator.com mailinator.net mailinator2.com 10minutemail.com 10minutemail.net 10minemail.com 20minutemail.com
guerrillamail.com guerrillamail.net guerrillamail.org guerrillamail.biz guerrillamailblock.com sharklasers.com grr.la pokemail.net spam4.me
yopmail.com yopmail.net yopmail.fr cool.fr.nf jetable.fr.nf temp-mail.org temp-mail.io tempmail.com tempmail.net tempmail.dev tempmailo.com
tempail.com tempr.email tmpmail.org tmpmail.net tmpeml.com throwawaymail.com trashmail.com trashmail.de trashmail.net trash-mail.com
getnada.com nada.email dispostable.com maildrop.cc mailnesia.com mintemail.com mohmal.com mytemp.email fakeinbox.com fakemail.net
emailondeck.com moakt.com moakt.cc spamgourmet.com mailcatch.com mailpoof.com inboxkitten.com burnermail.io 33mail.com anonaddy.me
emailfake.com fakemailgenerator.com tempinbox.com discard.email discardmail.com spambox.us spamex.com mail.tm mailto.plus
dropmail.me 1secmail.com 1secmail.org 1secmail.net linshiyouxiang.net mailsac.com tempmailaddress.com harakirimail.com
mvrht.net crazymailing.com emailtemporanea.net wegwerfmail.de einrot.com mail-temp.com tempmails.net luxusmail.org byom.de
owlymail.com mailbox92.biz vomoto.com zetmail.com cuvox.de armyspy.com dayrep.com einrot.com fleckens.hu gustr.com jourrapide.com
rhyta.com superrito.com teleworm.us`.split(/\s+/));

// Frequent misspellings of big providers → the intended domain.
const TYPOS = {
  'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.in': 'gmail.com', 'gmali.com': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yhoo.com': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com',
  'rediffmail.co': 'rediffmail.com', 'redifmail.com': 'rediffmail.com', 'icloud.co': 'icloud.com',
};

const mxCache = new Map();
const domainReceivesMail = async (domain) => {
  if (mxCache.has(domain)) return mxCache.get(domain);
  const lookup = dns.promises.resolveMx(domain).then((mx) => mx.length > 0).catch((e) => !['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'EBADNAME'].includes(e.code));
  // Treat a slow DNS answer as "ok" rather than blocking a real customer.
  const ok = await Promise.race([lookup, new Promise((r) => setTimeout(() => r(true), 3000))]);
  mxCache.set(domain, ok);
  return ok;
};

/** Rejects disposable / misspelt / non-existent email domains. `checkMx` does a DNS lookup. */
export const checkEmailDomain = async (email, { checkMx = true } = {}) => {
  const domain = String(email).split('@')[1]?.toLowerCase() || '';
  if (TYPOS[domain]) throw new AbuseError(`Did you mean ${email.split('@')[0]}@${TYPOS[domain]}? Please check the email spelling.`);
  if (DISPOSABLE.has(domain) || [...DISPOSABLE].some((d) => domain.endsWith(`.${d}`))) throw new AbuseError('Temporary email addresses are not allowed. Please use your regular email.');
  if (hasAbuse(email.split('@')[0])) throw new AbuseError('This email address is not allowed.');
  if (checkMx && !await domainReceivesMail(domain)) throw new AbuseError(`Emails cannot be delivered to "${domain}". Please check the address.`);
  return email;
};
