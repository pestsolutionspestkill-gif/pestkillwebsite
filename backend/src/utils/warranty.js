// Warranty helpers. Warranty is entered as text on the booking ("90 days", "3 months", "5 years", "10-year").

const UNIT_DAYS = { day: 1, week: 7, month: 30, year: 365 };

/** Number of days in a warranty text, or null when it has no clear duration. */
export const warrantyDays = (text) => {
  const m = /(\d+(?:\.\d+)?)\s*-?\s*(day|week|month|year|yr)s?/i.exec(String(text || ''));
  if (!m) return null;
  const unit = m[2].toLowerCase() === 'yr' ? 'year' : m[2].toLowerCase();
  return Math.round(Number(m[1]) * UNIT_DAYS[unit]);
};

const toDate = (s) => (s ? new Date(String(s).includes('T') ? s : `${String(s).replace(' ', 'T')}Z`) : null);
const istDay = (d) => new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

/** { until: 'YYYY-MM-DD', days_left, active } for a completed job, or null. */
export const warrantyStatus = (lead) => {
  const days = warrantyDays(lead.warranty);
  const done = toDate(lead.completed_at);
  if (!days || !done || Number.isNaN(done.getTime())) return null;
  const until = new Date(done.getTime() + days * 86400000);
  const today = istDay(new Date());
  const untilDay = istDay(until);
  const daysLeft = Math.ceil((Date.parse(untilDay) - Date.parse(today)) / 86400000);
  return { until: untilDay, total_days: days, days_left: Math.max(0, daysLeft), active: untilDay >= today };
};
