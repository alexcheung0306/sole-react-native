import { API_BASE_URL } from "./apiservice"

export const getAllFollowRecords = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/follow`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for the follows.")
    return null // Or handle as needed, like returning an empty object
  }
  return result
}

export const getFollowingListByUsername = async (
  username: String
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/follow/following/${username}`)
  if (!response.ok) {
    throw new Error("Following Response Not Ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No Following Content Return")
    return null // Or handle as needed, like returning an empty object
  }
  return result
}

export const getFollowerListByUsername = async (
  username: String
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/follow/follower/${username}`)
  if (!response.ok) {
    throw new Error("Follower Response Not Ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No Follower Content Return")
    return null // Or handle as needed, like returning an empty object
  }
  return result
}

export const getSingleFollowRecordByFollowerAndFollowingId = async (
  soleUserId: String,
  username: String
) => {
  const response = await fetch(
    `${API_BASE_URL}/follow/single-record/${soleUserId}/${username}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for the follows.")
    return null // Or handle as needed, like returning an empty object
  }
  return result
}

export const createFollowRecord = async (
  soleUserId: String,
  targetUsername: String,
  formData: FollowRecord
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/follow/${soleUserId}/${targetUsername}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Add this line
        },
        body: JSON.stringify(formData),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to create follow record")
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating follow record:", error)
    throw error
  }
}

export const updateFollowRecord = async (
  recordId: number,
  formData: FollowRecord
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/follow/update/${recordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", // Add this line
      },
      body: JSON.stringify(formData),
    })
    if (!response.ok) {
      throw new Error("Failed to update follow record")
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating follow record:", error)
    throw error
  }
}
export interface FollowRecord {
  status: string // Add other statuses as needed
  collaborated: boolean // Change to boolean type
  exclusiveContent: boolean // Change to boolean type
  lastUpdate: Date | null // Use Date type or null
}
