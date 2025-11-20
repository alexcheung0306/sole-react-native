export const validateField = (value: any, fieldname: string) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldname} is required`;
  }
  return null;
};

export const validateNumberField = (value: any, fieldname: string) => {
  if (!value || value === '' || value === null || value === undefined) {
    return `${fieldname} is required`;
  }
  if (isNaN(Number(value)) || Number(value) < 1) {
    return `${fieldname} must be a valid number greater than 0`;
  }
  return null;
};

/**
 * Validates if a field has a valid image
 * For React Native, we check if URI is valid
 */
export const validateImageField = (
  value: string | null | undefined,
  fieldname: string,
  options?: {
    required?: boolean;
  }
) => {
  const { required = true } = options || {};

  if (required) {
    if (!value) {
      return `${fieldname} is required`;
    }

    if (typeof value === 'string') {
      if (value.trim() === '') {
        return `${fieldname} is required`;
      }

      // Check if it's a default/empty image
      const isDefaultImage =
        value.includes('emptyphoto.jpeg') ||
        value.includes('default_image_url') ||
        value === '/images/emptyphoto.jpeg';

      if (isDefaultImage) {
        return `${fieldname} is required`;
      }
    }
  }

  return null;
};

export const getFieldError = (fieldname: string, value: any, isTouched: boolean | ((field: string) => boolean)) => {
  const isFieldTouched = typeof isTouched === 'function' ? isTouched(fieldname) : isTouched;
  if (!isFieldTouched) return null;
  return validateField(value, fieldname.split('.').pop() || fieldname);
};

