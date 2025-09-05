// apiService.ts

import { env } from '../env.mjs';

// Construct API base URL properly for React Native
export const API_BASE_URL = env.EXPO_PUBLIC_API_URL 
  ? `${env.EXPO_PUBLIC_API_URL}/api`
  : 'http://localhost:3000/api'; // fallback for development

//soleUser
export const getSoleUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/sole-users`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

export const getSoleUserByClerkId = async (clerkid: string): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-users/clerkId/${clerkid}`
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

export const getSoleUserBySoleUserId = async (
  soleUserId: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-users/sole-user-id/${soleUserId}`
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

export const getSoleUserByUserName = async (
  username: string,
  type: string // soleuser or soleuserid
): Promise<string | object> => {
  try {
    const response = await fetch(
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
    throw error
  }
}

export const updateSoleUserByClerkId = async (clerkId: string, values: any) => {
  try {
    const response = await fetch(
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
    throw error
  }
}

export const updateTalentLevelBySoleUserId = async (
  soleUserId: string,
  values: any
) => {
  try {
    console.log("api", soleUserId, values)
    const response = await fetch(
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
    throw error
  }
}
