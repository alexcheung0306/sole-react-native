export function validateUsername(entry: string) {
  const pattern = /^[a-zA-Z0-9_]+$/; // Allowed characters: letters, numbers, underscores
  const maxLength = 30;
  let error: string;
  
  if (!entry) {
    return (error = 'Username Required');
  } else if (entry.trim() === '') {
    return (error = 'Field cannot be empty');
  } else if (!pattern.test(entry)) {
    return (error = 'Username can only contain letters, numbers, and underscores.');
  } else if (entry.length > maxLength) {
    return (error = `Username cannot exceed ${maxLength} characters.`);
  } else if (entry.length < 3) {
    return (error = 'Username must be at least 3 characters.');
  }
  return undefined;
}

export function validateName(entry: string) {
  const pattern = /^[a-zA-Z0-9_ ]+$/; // Allowed characters: letters, space, numbers, underscores
  const maxLength = 100;
  let error: string;
  
  if (!entry) {
    return (error = 'Name Required');
  } else if (entry.trim() === '') {
    return (error = 'Field cannot be empty');
  } else if (!pattern.test(entry)) {
    return (error = 'Name can only contain letters, numbers, and underscores.');
  } else if (entry.length > maxLength) {
    return (error = `Name cannot exceed ${maxLength} characters.`);
  } else if (entry.length < 2) {
    return (error = 'Name must be at least 2 characters.');
  }
  return undefined;
}

export function validateBio(entry: string) {
  const maxLength = 500;
  
  if (entry && entry.length > maxLength) {
    return `Bio cannot exceed ${maxLength} characters.`;
  }
  return undefined;
}

export function validateCategory(categories: string[]) {
  const maxCategories = 5;
  
  if (categories && categories.length > maxCategories) {
    return `Maximum ${maxCategories} categories allowed.`;
  }
  return undefined;
}

