/**
 * Date format helpers for DD-MM-YYYY enforcement
 */

import { DateTime } from 'luxon';

export const DATE_FORMAT_DDMMYYYY = 'dd-MM-yyyy';

export const isValidDDMMYYYY = (value) => {
  if (!value || typeof value !== 'string') return false;
  return DateTime.fromFormat(value.trim(), DATE_FORMAT_DDMMYYYY, { zone: 'utc' }).isValid;
};

export const parseDDMMYYYY = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const fromFormat = DateTime.fromFormat(trimmed, DATE_FORMAT_DDMMYYYY, { zone: 'utc' });
  if (fromFormat.isValid) return fromFormat.toJSDate();

  const fromIso = DateTime.fromISO(trimmed, { zone: 'utc' });
  if (fromIso.isValid) return fromIso.toJSDate();

  return null;
};

export const formatDDMMYYYY = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    return DateTime.fromJSDate(value, { zone: 'utc' }).toFormat(DATE_FORMAT_DDMMYYYY);
  }

  const asString = String(value).trim();
  if (!asString) return '';

  const fromFormat = DateTime.fromFormat(asString, DATE_FORMAT_DDMMYYYY, { zone: 'utc' });
  if (fromFormat.isValid) return fromFormat.toFormat(DATE_FORMAT_DDMMYYYY);

  const fromIso = DateTime.fromISO(asString, { zone: 'utc' });
  if (fromIso.isValid) return fromIso.toFormat(DATE_FORMAT_DDMMYYYY);

  return '';
};

