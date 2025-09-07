import { API_BASE_URL, getSoleUserByUserName } from "./apiservice"


//talent info
export const getTalentInfoById = async (id: number): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/talent-info/${id}`)
  console.log("Response for talent by ID:", response)

  if (!response.ok) {
    throw new Error("Network response was not ok")
  }

  // Read response as text to check if it's empty
  const text = await response.text()

  // Check if the response is empty
  if (!text) {
    console.log("No content returned for the requested talent ID.")
    return [] // Or handle as needed, like returning an empty object
  }

  // Parse the non-empty response as JSON
  try {
    const data = JSON.parse(text)
    return data
  } catch (error) {
    throw new Error("Failed to parse JSON response: " + (error as Error).message)
  }
}

export const getTalentInfoByUsername = async (
  username: string
): Promise<any[]> => {
  const soleUserId = await getSoleUserByUserName(username, "soleuserid")
  const response = await fetch(
    `${API_BASE_URL}/talent-info/sole-user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const text = await response.text()
  if (!text) {
    console.log("No content returned for the requested talent ID.")
    return [] // Or handle as needed, like returning an empty object
  }
  try {
    const data = JSON.parse(text)
    return data
  } catch (error) {
    throw new Error("Failed to parse JSON response: " + (error as Error).message)
  }
}

export const getTalentInfoBySoleUserId = async (
  soleUserId: string
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/talent-info/sole-user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for the requested talent ID.")
    return null // Or handle as needed, like returning an empty object
  }
  return result
}

export const createTalentInfoWithComcard = async (
  soleUserId: string,
  talentData: any,
  comcardData: any
) => {
  try {
    const formData = new FormData()
    // Append talentInfo
    formData.append("talentInfo.talentName", talentData.talentName)
    formData.append("talentInfo.gender", talentData.gender)
    formData.append("talentInfo.eyeColor", talentData.eyeColor)
    formData.append("talentInfo.hairColor", talentData.hairColor)
    formData.append("talentInfo.age", talentData.age)
    formData.append("talentInfo.height", talentData.height)
    formData.append("talentInfo.chest", talentData.chest)
    formData.append("talentInfo.waist", talentData.waist)
    formData.append("talentInfo.hip", talentData.hip)
    formData.append("talentInfo.shoes", talentData.shoes)
    formData.append("talentInfo.ethnic", talentData.ethnic)
    formData.append("talentInfo.region", talentData.region)
    formData.append("talentInfo.experience", talentData.experience)
    formData.append("talentInfo.bucket", talentData.bucket)
    formData.append("talentInfo.soleUserId", soleUserId) // Use soleUserId directly
    if (talentData.snapshotHalfBody) {
      formData.append(
        "talentInfo.snapshotHalfBodyImage",
        talentData.snapshotHalfBody
      )
    }
    if (talentData.snapshotFullBody) {
      formData.append(
        "talentInfo.snapshotFullBodyImage",
        talentData.snapshotFullBody
      )
    }
    // Append comcardInfo
    formData.append("comcard.configId", "1")
    comcardData.photoConfig?.forEach((blob: any, index: number) => {
      if (blob instanceof File) {
        formData.append("comcard.comcardImages", blob)
      } else {
        formData.append("comcard.comcardImages", comcardData.photoConfig[index])
      }
    })
    formData.append("comcard.isActive", "true")
    formData.append("comcard.soleUserId", soleUserId || "")

    formData.append("comcard.pdf", comcardData.pdf || "")
    formData.append("comcard.bucket", "comcards")
    formData.append("comcard.comcardImageName", soleUserId || "")
    console.log("formData", formData)
    const response = await fetch(`${API_BASE_URL}/talent-info/with-comcard`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error("Failed to create TalentInfo")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating TalentInfo:", error)
    throw error
  }
}

export const updateTalentInfoWithComcardBySoleUserId = async ({
  soleUserId,
  talentData,
  comcardData,
}: any): Promise<any> => {
  // Input validation
  try {
    const formData = new FormData()
    // Append talentInfo
    formData.append("talentInfo.talentName", talentData.talentName)
    formData.append("talentInfo.gender", talentData.gender)
    formData.append("talentInfo.eyeColor", talentData.eyeColor)
    formData.append("talentInfo.hairColor", talentData.hairColor)
    formData.append("talentInfo.age", talentData.age)
    formData.append("talentInfo.height", talentData.height)
    formData.append("talentInfo.chest", talentData.chest)
    formData.append("talentInfo.waist", talentData.waist)
    formData.append("talentInfo.hip", talentData.hip)
    formData.append("talentInfo.shoes", talentData.shoes)
    formData.append("talentInfo.ethnic", talentData.ethnic)
    formData.append("talentInfo.region", talentData.region)
    formData.append("talentInfo.experience", talentData.experience)
    formData.append("talentInfo.bucket", talentData.bucket)
    formData.append("talentInfo.soleUserId", soleUserId) // Use soleUserId directly
    if (talentData.snapshotHalfBody) {
      formData.append(
        "talentInfo.snapshotHalfBodyImage",
        talentData.snapshotHalfBody
      )
    }
    if (talentData.snapshotFullBody) {
      formData.append(
        "talentInfo.snapshotFullBodyImage",
        talentData.snapshotFullBody
      )
    }
    // Append comcardInfo
    formData.append("comcard.configId", "1")
    comcardData.photoConfig?.forEach((blob: any, index: number) => {
      if (blob instanceof File) {
        formData.append("comcard.comcardImages", blob)
      } else {
        formData.append("comcard.comcardImages", comcardData.photoConfig[index])
      }
    })
    formData.append("comcard.isActive", "true")
    formData.append("comcard.soleUserId", soleUserId || "")
    formData.append("comcard.pdf", comcardData.pdf || "")
    formData.append("comcard.bucket", "comcards")
    formData.append("comcard.comcardImageName", soleUserId || "")
    console.log("EditformData", formData)

    const response = await fetch(
      `${API_BASE_URL}/talent-info/with-comcard/sole-user/${soleUserId}`,
      {
        method: "PUT",
        body: formData,
      }
    )
    if (!response.ok) {
      throw new Error("Failed to create TalentInfo")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating TalentInfo:", error)
    throw error
  }
}

export const deleteTalentInfoBySoleUserId = async (
  soleUserId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/talent-info/soleUserId/${soleUserId}`,
      {
        method: "DELETE",
      }
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`)
    }

    console.log(
      `Successfully deleted talent info for soleUserId: ${soleUserId}`
    )
  } catch (error) {
    console.error(
      `Error deleting talent info for soleUserId ${soleUserId}:`,
      error
    )
    throw error // Optionally rethrow the error for further handling
  }
}
