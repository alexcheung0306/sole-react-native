// Custom error classes for better error handling

export class ServerMaintenanceError extends Error {
  constructor(
    message: string = "Server is currently under maintenance. Please try again later."
  ) {
    super(message)
    this.name = "ServerMaintenanceError"
  }
}

export class NetworkError extends Error {
  constructor(
    message: string = "Unable to connect to the server. Please check your internet connection."
  ) {
    super(message)
    this.name = "NetworkError"
  }
}

export function isServerMaintenanceError(error: any): boolean {
  return (
    error instanceof ServerMaintenanceError ||
    error?.name === "ServerMaintenanceError" ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("ERR_CONNECTION_REFUSED") ||
    error?.message?.includes("NetworkError") ||
    error?.message?.includes("Network request failed") ||
    (error?.name === "TypeError" && error?.message?.includes("fetch"))
  )
}

