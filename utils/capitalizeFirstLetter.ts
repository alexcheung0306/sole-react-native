export const capitalizeFirstLetter = (string) => {
  if (!string) return string // Check for empty string
  return string.charAt(0).toUpperCase() + string.slice(1)
}
