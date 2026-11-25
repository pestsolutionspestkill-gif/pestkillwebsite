// Service-area check for bookings. All service teams are dispatched from the Jaipur office, so the
// result only says how a visit is planned; an appointment is confirmed by our team on a call, never
// by the website.
export const STATES = [
  'Rajasthan', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry',
];

export const validPin = (pin) => /^[1-9][0-9]{5}$/.test(String(pin || '').trim());

/** How a visit to this location is planned. Never a promise of a date. */
export const assessArea = ({ state, city, pincode }) => {
  const c = String(city || '').trim().toLowerCase();
  if (!state || !c) return null;
  // Jaipur PIN codes start with 302 / 303.
  if (state === 'Rajasthan' && (c === 'jaipur' || /^30[23]/.test(String(pincode || '')))) {
    return { tier: 'local', title: 'Jaipur: served directly from our office',
      note: 'Visits in and around Jaipur are the easiest to schedule. We confirm the earliest available slot when we call you.' };
  }
  if (state === 'Rajasthan') {
    return { tier: 'state', title: `${city.trim()}: scheduled from Jaipur`,
      note: 'Our team travels from Jaipur. The visit date depends on distance and the team’s schedule, and is confirmed when we call you.' };
  }
  return { tier: 'outstation', title: `${city.trim()}, ${state}: outstation visit, subject to confirmation`,
    note: 'We serve locations across India with teams dispatched from Jaipur. We first check whether we can take up the job and plan travel by distance, job size and team availability. Nothing is booked until we confirm this with you on a call.' };
};
