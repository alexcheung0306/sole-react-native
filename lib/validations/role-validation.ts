export function validateRoleTitle(entry: string) {
  if (!entry) {
    return 'Role Title Required';
  } else if (entry.trim() === '') {
    return 'Field cannot be empty';
  }
  return null;
}

export function validateRoleDescription(entry: string) {
  if (!entry) {
    return 'Role Description Required';
  } else if (entry.trim() === '') {
    return 'Field cannot be empty';
  }
  return null;
}

export function validatePaymentBasis(entry: string) {
  if (!entry) {
    return 'Payment Type Required';
  } else if (entry.trim() === '') {
    return 'Field cannot be empty';
  }
  return null;
}

export function validateShowBudgetTo(entry: string) {
  if (!entry) {
    return 'User who can see budget Required';
  } else if (entry.trim() === '') {
    return 'Field cannot be empty';
  }
  return null;
}

export function validateActivityTitle(entry: string) {
  if (!entry) {
    return 'Title Required';
  } else if (entry.trim() === '') {
    return 'Field cannot be empty';
  }
  return null;
}

export function validateActivityType(entry: string) {
  if (!entry) {
    return 'Type Required';
  } else if (entry.trim() === '') {
    return 'Field cannot be empty';
  }
  return null;
}

export interface ScheduleObject {
  id?: number | string;
  location?: string;
  fromTime?: string;
  toTime?: string;
  date?: string;
}

export function validateScheduleList(entry: ScheduleObject) {
  const { location, fromTime, toTime } = entry;
  const filledInputs = [location, fromTime, toTime].filter(Boolean).length;
  if (filledInputs !== 3) {
    let fieldsToFill = '';
    if (!location) {
      fieldsToFill += 'Location ';
    }
    if (!fromTime) {
      fieldsToFill += '*Starting-Time ';
    }
    if (!toTime) {
      fieldsToFill += '*Ending-Time ';
    }
    return `${fieldsToFill}required`;
  }
  return null;
}

// Helper function to parse date strings in the format used by the form
const parseDateTime = (dateTimeStr: string): Date | null => {
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

export const validateTimeSlot = (schedule: ScheduleObject) => {
  if (!schedule.fromTime || !schedule.toTime) {
    return 'Both start and end times are required';
  }
  
  // Parse both dates and compare
  const fromDate = parseDateTime(schedule.fromTime);
  const toDate = parseDateTime(schedule.toTime);
  
  // Check if dates are valid
  if (!fromDate || !toDate) {
    // If parsing failed, don't show error here - let the required field validation handle it
    return null;
  }
  
  // Check if start time is after or equal to end time
  if (fromDate >= toDate) {
    return 'Start time must be before end time';
  }
  
  return null;
};

