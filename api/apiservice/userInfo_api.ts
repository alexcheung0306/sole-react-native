import { API_BASE_URL, getSoleUserByUserName } from "../apiservice"

//user info
export const getUserInfoByUsername = async (
  username: string
): Promise<any[]> => {
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
    throw new Error("Failed to parse JSON response: " + error.message)
  }
}

export const getUserInfoBySoleUserId = async (
  soleUserId: string
): Promise<any[]> => {
  const response = await fetch(
    `${API_BASE_URL}/sole-user-info/sole-user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const text = await response.json()
  return text
  // if (!text) {
  //   console.log("No content returned for the requested soleuser ID.")
  //   return null // Or handle as needed, like returning an empty object
  // }
  // try {
  //   const data = JSON.parse(text)
  //   return data
  // } catch (error) {
  //   throw new Error("Failed to parse JSON response: " + error.message)
  // }
}

export const getUserInfoWithUsernameBySoleUserId = async (
  soleUserId: string
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/sole-user-info/sole-user-with-username/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data = await response.json()
  return data
}

export const updateUserInfoBySoleUserId = async (
  soleUserId: string,
  values: any
) => {
  try {
    const formData = new FormData()

    // Add all the user info fields to form data
    Object.keys(values).forEach((key) => {
      if (key === "profilePic" && values[key]) {
        // Handle profile picture for React Native
        if (typeof values[key] === "string" && 
            (values[key].startsWith("file://") || 
             values[key].startsWith("content://") || 
             values[key].startsWith("ph://"))) {
          // React Native URI format (file://, content://, or ph://)
          const uriParts = values[key].split('.');
          const fileType = uriParts[uriParts.length - 1] || 'jpg';
          
          formData.append("profilePic", {
            uri: values[key],
            name: `profile-pic.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        } else if (
          typeof values[key] === "string" &&
          values[key].startsWith("data:")
        ) {
          // Convert base64 to blob (web)
          const base64Data = values[key].split(",")[1]
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: "image/jpeg" })
          formData.append("profilePic", blob, "profile-pic.jpg")
        } else if (values[key] instanceof File) {
          // Web File object
          formData.append("profilePic", values[key])
        }
      } else if (key !== "profilePic") {
        // Add other fields as strings
        formData.append(key, values[key] || "")
      }
    })

    // Add bucket name for MinIO storage
    formData.append("bucket", "user-info")

    const response = await fetch(
      `${API_BASE_URL}/sole-user-info/sole-user/${soleUserId}`,
      {
        method: "PUT",
        body: formData, // Don't set Content-Type header, let browser set it with boundary
      }
    )

    if (response.ok) {
      const result = await response.json()
      console.log("User Info updated successfully")
      return result
    } else {
      const errorText = await response.text()
      console.error("Error updating User Info:", errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
  } catch (error) {
    console.error("Error updating User Info:", error)
    throw error
  }
}
