// apiService.ts
import { getApiBaseUrl } from '../config/environment'
import { ServerMaintenanceError, isServerMaintenanceError } from '~/lib/errors'

// Use centralized environment configuration
export const API_BASE_URL = getApiBaseUrl()

// Timeout duration in milliseconds (10 seconds)
const FETCH_TIMEOUT = 10000

// Helper function to create a fetch with timeout
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = FETCH_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    // If aborted due to timeout, throw a timeout error
    if (error.name === 'AbortError') {
      throw new ServerMaintenanceError('Request timed out. Please check your connection.')
    }
    throw error
  }
}

// Helper function to handle fetch errors and detect connection issues
const handleFetchError = (error: any) => {
  // Check if it's a network/connection error
  if (
    error instanceof ServerMaintenanceError ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('ERR_CONNECTION_REFUSED') ||
    error?.message?.includes('Network request failed') ||
    error?.message?.includes('timed out') ||
    error?.message?.includes('Request timed out') ||
    (error?.name === 'TypeError' && error?.message?.includes('fetch')) ||
    error?.name === 'AbortError'
  ) {
    throw new ServerMaintenanceError()
  }
  throw error
}

//soleUser
export const getSoleUsers = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/sole-users`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    handleFetchError(error) // Convert connection errors to ServerMaintenanceError
  }
}

export const getSoleUserByClerkId = async (clerkid: string): Promise<any> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sole-users/clerkId/${clerkid}`
    )

    console.log('response', response);

    if (response.status === 404) {
      return response.status;
    }

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    handleFetchError(error) // Convert connection errors to ServerMaintenanceError
  }
}

export const getSoleUserBySoleUserId = async (
  soleUserId: string
): Promise<any> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sole-users/sole-user-id/${soleUserId}`
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    handleFetchError(error) // Convert connection errors to ServerMaintenanceError
  }
}

export const getSoleUserByUserName = async (
  username: string,
  type: string // soleuser or soleuserid
): Promise<string | object> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sole-users/username/${username}?type=${type}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    if (type === "soleuserid") {
      const result = await response.text()
      return result // Return text for soleuserid
    } else if (type === "soleuser") {
      const result = await response.json()
      return result // Return JSON for soleuser
    } else {
      throw new Error("Invalid type parameter")
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    handleFetchError(error) // Convert connection errors to ServerMaintenanceError
  }
}

export const updateSoleUserByClerkId = async (clerkId: string, values: any) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sole-users/clerkId/${clerkId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    )
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log("Sole User updated successfully")
    return result
  } catch (error) {
    console.error("Error updating Sole User:", error)
    handleFetchError(error) // Convert connection errors to ServerMaintenanceError
  }
}

export const updateTalentLevelBySoleUserId = async (
  soleUserId: string,
  values: any
) => {
  try {
    console.log("api", soleUserId, values)
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sole-users/talent-level/${soleUserId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    )
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log("Success Update Talent Level")
    return result
  } catch (error) {
    console.error("Error Updating Talent Level", error)
    handleFetchError(error) // Convert connection errors to ServerMaintenanceError
  }
}
