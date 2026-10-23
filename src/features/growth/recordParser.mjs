export function validRecordDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function parseRecordDate(value, order = 'DMY') {
  const text = value.trim();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  let year, month, day;
  if (match) [, year, month, day] = match;
  else {
    match = text.match(/^(\d{1,2})[-/. ]([a-zA-Z]{3,9})[-/. ,]+(\d{4})$/);
    if (match) { day = match[1]; month = months.indexOf(match[2].toLowerCase().slice(0, 3)) + 1; year = match[3]; }
    else {
      match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (!match || !['DMY', 'MDY'].includes(order)) return '';
      year = match[3]; day = order === 'DMY' ? match[1] : match[2]; month = order === 'DMY' ? match[2] : match[1];
    }
  }
  const result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return validRecordDate(result) ? result : '';
}
const vaccine = /\b(rabies|anti[ -]?rabies|dhpp(?:i|l)?|dapp|dhp|fvrcp|felv|bordetella|lepto(?:spirosis)?|distemper|parvo(?:virus)?|hepatitis|canine influenza|tricat|nobivac|vanguard|megavac|eurican|biocan|canigen)\b/i;
const dates = /\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}[-/. ]+[a-zA-Z]{3,9}[-/. ,]+\d{4})\b/g;
export function extractVaccinations(text, order = 'DMY') {
  const results = [];
  for (const line of String(text).split(/\r?\n/)) {
    const name = line.match(vaccine)?.[0];
    if (!name) continue;
    const found = [...line.matchAll(dates)].map(match => parseRecordDate(match[0], order));
    results.push({ name, date: found[0] || '', nextDue: found[1] || '', sourceLine: line.trim().slice(0, 300), selected: false });
    if (results.length === 30) break;
  }
  return results;
}
