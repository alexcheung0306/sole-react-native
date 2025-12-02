/**
 * Parses a date-time string in the format used by the application.
 * Handles formats like: "2025-08-27 09:00:00.000 +0800"
 * @param dateTimeStr - The date-time string to parse
 * @returns A Date object or null if parsing fails
 */
export const parseDateTime = (dateTimeStr: string): Date | null => {
  if (!dateTimeStr) return null;
  try {
    // Handle the format: "2025-08-27 09:00:00.000 +0800"
    // Convert timezone offset from +0800 to +08:00 for better compatibility
    let normalizedStr = dateTimeStr.trim();
    
    // If the string has a timezone offset like +0800 or -0800, convert it to +08:00 or -08:00
    const timezoneMatch = normalizedStr.match(/([+-])(\d{4})$/);
    if (timezoneMatch) {
      const sign = timezoneMatch[1];
      const offset = timezoneMatch[2];
      const hours = offset.substring(0, 2);
      const minutes = offset.substring(2, 4);
      normalizedStr = normalizedStr.replace(/([+-])(\d{4})$/, `${sign}${hours}:${minutes}`);
    }
    
    // Try parsing with the normalized string
    let date = new Date(normalizedStr);
    
    // If that fails, try parsing as ISO format by replacing space with T
    if (isNaN(date.getTime())) {
      const isoStr = normalizedStr.replace(' ', 'T');
      date = new Date(isoStr);
    }
    
    // If still fails, try manual parsing for format: "YYYY-MM-DD HH:mm:ss.SSS +HHMM"
    if (isNaN(date.getTime())) {
      const match = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
      }
    }
    
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Formats a Date object to the application's standard date-time string format.
 * @param date - The Date object to format
 * @returns A formatted string in the format: "YYYY-MM-DD HH:mm:00.000 +0000"
 */
export const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:00.000 +0000`;
};

/**
 * Formats a date-time string for display purposes.
 * @param dateTimeStr - The date-time string to format
 * @param fallback - Optional fallback text if parsing fails (default: 'Select time')
 * @returns A formatted string in the format: "YYYY-MM-DD HH:mm" or the fallback text
 */
export const formatDisplayDateTime = (dateTimeStr: string, fallback: string = 'Select time'): string => {
  if (!dateTimeStr) return fallback;
  const date = parseDateTime(dateTimeStr);
  if (!date) return fallback;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Formats a date-time string for display with locale-aware formatting.
 * @param dateTimeStr - The date-time string to format
 * @param fallback - Optional fallback text if parsing fails (default: 'No time specified')
 * @returns A formatted string using locale formatting or the fallback text
 */
export const formatDateTimeLocale = (dateTimeStr: string, fallback: string = 'No time specified'): string => {
  if (!dateTimeStr) return fallback;
  const date = parseDateTime(dateTimeStr);
  if (!date) return fallback;
  try {
    return date.toLocaleString();
  } catch {
    return formatDisplayDateTime(dateTimeStr, fallback);
  }
};

