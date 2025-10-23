import { API_BASE_URL } from '../apiservice';

export interface UserProfileData {
  comcard: any | null;
  talentInfo: any | null;
  userInfo: any | null;
  talentLevel: string | null;
}

export const getUserProfileByUsername = async (
  username: string
): Promise<UserProfileData> => {
  try {
    // Validate username
    if (!username || username === "Unknown User" || username.trim() === "") {
      console.warn(`Invalid or fallback username: ${username}`);
      return {
        comcard: null,
        talentInfo: null,
        userInfo: null,
        talentLevel: null,
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/sole-users/profile/username/${username}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`User profile not found for username: ${username}`);
        return {
          comcard: null,
          talentInfo: null,
          userInfo: null,
          talentLevel: null,
        };
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      throw new Error("Empty response from server");
    }

    const result = JSON.parse(text);
    return result;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};