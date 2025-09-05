import { API_BASE_URL, getSoleUserByUserName } from "./apiservice"

//user info
export const getUserInfoByUsername = async (
  username: string
): Promise<any[] | null> => {
  console.log("username", username)
  const soleUserId: any = await getSoleUserByUserName(username, "soleuserid")

  const response = await fetch(
    `${API_BASE_URL}/sole-user-info/sole-user/${soleUserId}`
  )
  console.log("response", response)

  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const text = await response.text()
  if (!text) {
    console.log("No content returned for the requested soleuser ID.")
    return null // Or handle as needed, like returning an empty object
  }
  try {
    const data = JSON.parse(text)
    return data
  } catch (error) {
    throw new Error("Failed to parse JSON response: " + (error as Error).message)
  }
}

export const getUserInfoBySoleUserId = async (
  soleUserId: string
): Promise<any[] | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-user-info/sole-user/${soleUserId}`
    )
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }
    
    const text = await response.text()
    if (!text) {
      console.log("No content returned for the requested soleuser ID.")
      return null
    }
    
    try {
      const data = JSON.parse(text)
      return data
    } catch (parseError) {
      throw new Error("Failed to parse JSON response: " + (parseError as Error).message)
    }
  } catch (error) {
    console.error("Error fetching user info:", error)
    throw error
  }
}

export const updateUserInfoBySoleUserId = async (
  soleUserId: string,
  values: any
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-user-info/sole-user/${soleUserId}`,
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
    console.log("User Info updated successfully")
    return result
  } catch (error) {
    console.error("Error updating User Info:", error)
    throw error
  }
}
