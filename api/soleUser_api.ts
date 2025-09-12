import { API_BASE_URL } from "./apiservice"

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

interface CreateUser {
  username: string
  email: string
  clerkId: string
  image: string
}


export interface UserProfileData {
  comcard: ComCard | null
  talentInfo: TalentInfo | null
  userInfo: UserInfo | null
  talentLevel: string | null
}
export const getUserProfileByUsername = async (
  username: string
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
    } catch (parseError: any) {
      console.error("Invalid JSON response:", text)
      throw new Error(`Invalid JSON response: ${parseError.message as string}`)
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

export const createUser = async (user: CreateUser) => {
  try{
    console.log('Creating user with data:', user);
    const response = await fetch(`${API_BASE_URL}/sole-users`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    })
    
    console.log('Create user response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create user error response:', errorText);
      throw new Error(`Error: ${response.status} - ${errorText}`)
    }
    const result = await response.json()
    console.log('User created successfully:', result);
    return result
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}