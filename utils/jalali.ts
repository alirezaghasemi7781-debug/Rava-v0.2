/**
 * Lightweight Jalali (Solar Hijri) helpers.
 * Prefers Intl with calendar: 'persian' — no heavy dependency.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function asDate(input: Date | string | number): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const raw = String(input).trim();
  if (!raw) return null;
  // Already a Persian-formatted display string — not parseable as Gregorian
  if (/[۰-۹]/.test(raw) || /[٠-٩]/.test(raw)) return null;
  const d = new Date(raw.includes('T') || raw.includes('-') ? raw : raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const jalaliFormatter = (() => {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
})();

const jalaliShortFormatter = (() => {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
})();

/** Full Jalali date, e.g. ۱۵ فروردین ۱۴۰۴ */
export function formatJalali(
  input: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = asDate(input);
  if (!d) {
    // Preserve already-localized stamp strings
    if (typeof input === 'string' && input.trim()) return input;
    return '—';
  }
  if (options) {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', options).format(d);
    } catch {
      return new Intl.DateTimeFormat('fa-IR', options).format(d);
    }
  }
  return jalaliFormatter.format(d);
}

/** Compact Jalali, e.g. ۱۴۰۴/۰۱/۱۵ */
export function formatJalaliShort(input: Date | string | number): string {
  const d = asDate(input);
  if (!d) {
    if (typeof input === 'string' && input.trim()) return input;
    return '—';
  }
  return jalaliShortFormatter.format(d);
}

/** Display helper for trip / stamp / recap dates in UI */
export function displayJalaliDate(raw: string | Date | number | null | undefined): string {
  if (raw == null || raw === '') return '—';
  if (typeof raw === 'string' && (/[۰-۹]/.test(raw) || /[٠-٩]/.test(raw))) {
    return raw;
  }
  return formatJalaliShort(raw);
}

/** Value then unit for Persian order: «۵ کیلومتر» */
export function formatPersianUnit(value: number | string, unit: string): string {
  return `${toPersianDigits(value)}\u00A0${unit}`;
}

export function todayJalaliShort(d = new Date()): string {
  return formatJalaliShort(d);
}
