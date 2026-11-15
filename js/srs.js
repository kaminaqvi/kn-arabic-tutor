// 5-box Leitner scheduling, dates, pacing.
export const INTERVALS = [1, 2, 4, 7, 14]; // days until next review for boxes 1..5

export function today(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function daysBetween(a, b) {
  const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 864e5);
}

export function newProgress(id, date) {
  return { id, box: 1, due: addDays(date, 1), seen: 1, right: 0, wrong: 0, learned: date, last: null, speech: null, note: null };
}

// Apply an answer. goalDate (optional) caps the gap at 4 days in the last 10 days.
export function grade(p, correct, date, goalDate) {
  const q = { ...p, seen: (p.seen || 0) + 1, last: correct ? 'right' : 'wrong' };
  if (correct) { q.right = (p.right || 0) + 1; q.box = Math.min(5, (p.box || 1) + 1); }
  else { q.wrong = (p.wrong || 0) + 1; q.box = 1; }
  let gap = INTERVALS[q.box - 1];
  if (goalDate && daysBetween(date, goalDate) <= 10) gap = Math.min(gap, 4);
  if (!correct) gap = 1;
  q.due = addDays(date, gap);
  return q;
}

export const MINUTE_CAP = { 10: 6, 20: 10, 30: 14 };

// New items per day: spread remaining items over the days left, keeping 5 days for rehearsal.
export function newPerDay(profile, remaining, date) {
  const cap = MINUTE_CAP[profile.minutes] || 10;
  if (!profile.goalDate) return Math.min(cap, remaining);
  const daysLeft = daysBetween(date, profile.goalDate) - 5;
  if (daysLeft <= 0) return 0;
  return Math.min(remaining, Math.max(6, Math.min(cap + 4, Math.ceil(remaining / daysLeft))));
}
