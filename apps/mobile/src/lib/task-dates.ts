import { isISODateString } from '@keystone/core';
export function localDateOf(value: unknown): string {
  if (!isISODateString(value)) return '';
  if (value.length === 10) return value;
  const date=new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function deadlineForDate(original: unknown, date: string): string | undefined {
  if (!date) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isISODateString(date)) throw Error('Use a valid YYYY-MM-DD date.');
  if (date === localDateOf(original) && isISODateString(original)) return original;
  return new Date(`${date}T18:00:00`).toISOString();
}
