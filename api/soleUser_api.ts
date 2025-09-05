import { API_BASE_URL } from "../apiservice"

interface ComCard {
  id: number
  configId: number
  photoConfig: string[]
  isActive: boolean
  soleUserId: string
  pdf: string
  png: string
  bucket: string | null
  comcardImageName: string | null
}

interface TalentInfo {
  id: number
  talentName: string
  gender: string
  eyeColor: string
  hairColor: string
  age: number
  height: number
  chest: number
  waist: number
  hip: number
  shoes: number
  ethnic: string
  region: string
  experience: string
  snapshotHalfBody: string
  snapshotFullBody: string
  bucket: string | null
  soleUserId: string
  comcardId: string | null
}

interface UserInfo {
  id: number
  profilePic: string
  name: string
  bio: string
  category: string
  soleUserId: string
  bucket: string | null
  profilePicName: string | null
}

export interface UserProfileData {
  comcard: ComCard | null
  talentInfo: TalentInfo | null
  userInfo: UserInfo | null
  talentLevel: string | null
}
export const getUserProfileByUsername = async (
  username
): Promise<UserProfileData> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-users/profile/username/${username}`
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    // Check if response has content before parsing JSON
    const text = await response.text()
    if (!text || text.trim() === "") {
      throw new Error("Empty response from server")
    }

    try {
      const result = JSON.parse(text)
      return result // Return the fetched result
    } catch (parseError) {
      console.error("Invalid JSON response:", text)
      throw new Error(`Invalid JSON response: ${parseError.message}`)
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}
