export function truncate(text, maxLength = 80) {
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function formatEventDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function toDatetimeLocalValue(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}
