export function base64ToBlob(base64: string, type = "image/jpeg") {
  if (typeof base64 !== "string") {
    throw new TypeError("Expected a string for base64")
  }

  const parts = base64.split(",")
  if (parts.length !== 2) {
    throw new Error("Invalid base64 string")
  }

  const byteCharacters = atob(parts[1])
  const byteNumbers = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  return new Blob([byteNumbers], { type: type })
}
