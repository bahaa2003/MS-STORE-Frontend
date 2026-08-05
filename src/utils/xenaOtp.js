export const normalizeXenaOtpDigits = (value) => String(value || '')
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[^0-9]/g, '');

export const splitXenaOtpDigits = (value, maxLength = 4) => (
  Array.from(normalizeXenaOtpDigits(value)).slice(0, Math.max(0, Number(maxLength) || 0))
);
