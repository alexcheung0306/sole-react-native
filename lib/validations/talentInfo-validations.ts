export function validateTalentName(entry: string) {
  if (!entry) {
    return 'Talent Name Required';
  } else if (entry.trim() === '') {
    return 'Talent Name cannot be empty';
  }
  return undefined;
}

export function validateGender(entry: string) {
  if (!entry) {
    return 'Gender Required';
  } else if (entry.trim() === '') {
    return 'Gender cannot be empty';
  }
  return undefined;
}

export function validateEyeColor(entry: string) {
  if (!entry) {
    return 'Eye Color Required';
  } else if (entry.trim() === '') {
    return 'Eye Color cannot be empty';
  }
  return undefined;
}

export function validateHairColor(entry: string) {
  if (!entry) {
    return 'Hair Color Required';
  } else if (entry.trim() === '') {
    return 'Hair Color cannot be empty';
  }
  return undefined;
}

export function validateAge(entry: string) {
  if (!entry) {
    return 'Age Required';
  } else if (isNaN(Number(entry))) {
    return 'Age must be a number';
  } else if (Number(entry) < 16 || Number(entry) > 100) {
    return 'Age must be between 16 and 100';
  }
  return undefined;
}

export function validateHeight(entry: string) {
  if (!entry) {
    return 'Height Required';
  } else if (isNaN(Number(entry))) {
    return 'Height must be a number';
  } else if (Number(entry) < 100 || Number(entry) > 250) {
    return 'Height must be between 100 and 250 cm';
  }
  return undefined;
}

export function validateChest(entry: string) {
  if (!entry) {
    return 'Chest Required';
  } else if (isNaN(Number(entry))) {
    return 'Chest must be a number';
  } else if (Number(entry) < 60 || Number(entry) > 150) {
    return 'Chest must be between 60 and 150 cm';
  }
  return undefined;
}

export function validateWaist(entry: string) {
  if (!entry) {
    return 'Waist Required';
  } else if (isNaN(Number(entry))) {
    return 'Waist must be a number';
  } else if (Number(entry) < 50 || Number(entry) > 150) {
    return 'Waist must be between 50 and 150 cm';
  }
  return undefined;
}

export function validateHip(entry: string) {
  if (!entry) {
    return 'Hip Required';
  } else if (isNaN(Number(entry))) {
    return 'Hip must be a number';
  } else if (Number(entry) < 60 || Number(entry) > 150) {
    return 'Hip must be between 60 and 150 cm';
  }
  return undefined;
}

export function validateShoes(entry: string) {
  if (!entry) {
    return 'Shoe Size Required';
  } else if (isNaN(Number(entry))) {
    return 'Shoe Size must be a number';
  } else if (Number(entry) < 30 || Number(entry) > 50) {
    return 'Shoe size must be between 30 and 50';
  }
  return undefined;
}

export function validateEthnic(entry: string) {
  if (!entry) {
    return 'Ethnicity Required';
  } else if (entry.trim() === '') {
    return 'Ethnicity cannot be empty';
  }
  return undefined;
}

export function validateRegion(entry: string) {
  if (!entry) {
    return 'Region Required';
  } else if (entry.trim() === '') {
    return 'Region cannot be empty';
  }
  return undefined;
}

