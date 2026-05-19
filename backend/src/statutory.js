// Dates when the flag must be at half-staff by federal law (4 U.S.C. § 7)
// Returns the active statutory order for a given Date, or null if none.

function lastMonday(year, month /* 0-indexed */) {
  // Last Monday of the given month
  const lastDay = new Date(year, month + 1, 0);
  const dow = lastDay.getDay(); // 0=Sun, 1=Mon ...
  const offset = (dow >= 1) ? dow - 1 : 6;
  return new Date(year, month, lastDay.getDate() - offset);
}

export function getStatutoryStatus(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();

  // May 15 — Peace Officers Memorial Day
  if (m === 4 && d === 15) {
    return {
      status: 'half',
      reason: 'Peace Officers Memorial Day',
      source: '4 U.S.C. § 7',
    };
  }

  // Last Monday of May — Memorial Day (half-staff sunrise to noon only;
  // we show half-staff all day as a conservative default)
  const memorialDay = lastMonday(y, 4);
  if (m === 4 && d === memorialDay.getDate()) {
    return {
      status: 'half',
      reason: 'Memorial Day',
      source: '4 U.S.C. § 7',
      note: 'Half-staff until noon; full-staff noon to sunset per federal law.',
    };
  }

  // September 11 — Patriot Day
  if (m === 8 && d === 11) {
    return {
      status: 'half',
      reason: 'Patriot Day (September 11)',
      source: '4 U.S.C. § 7',
    };
  }

  // December 7 — Pearl Harbor Remembrance Day
  if (m === 11 && d === 7) {
    return {
      status: 'half',
      reason: 'Pearl Harbor Remembrance Day',
      source: '4 U.S.C. § 7',
    };
  }

  return null;
}
