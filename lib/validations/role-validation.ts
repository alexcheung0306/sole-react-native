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

export const validateTimeSlot = (schedule: ScheduleObject) => {
  if (!schedule.fromTime || !schedule.toTime) {
    return 'Both start and end times are required';
  }
  return null;
};

