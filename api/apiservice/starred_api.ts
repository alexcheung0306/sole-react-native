import { API_BASE_URL } from "../apiservice"

// Starred Category API functions
export const createStarredCategory = async (
  starredCategory: StarredCategory
): Promise<StarredCategory> => {
  const response = await fetch(`${API_BASE_URL}/starred-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(starredCategory),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Failed to create starred category")
  }

  const result = await response.json()
  return result
}

export const createCategoryAndAddTalent = async (
  request: CreateCategoryAndAddTalentRequest
): Promise<CreateCategoryAndAddTalentResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-categories/create-and-add-talent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(
      errorData.message || "Failed to create category and add talent"
    )
  }

  const result = await response.json()
  return result
}

export const getAllStarredCategoriesByUserId = async (
  soleUserId: string
): Promise<StarredCategory[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-categories/user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred categories.")
    return []
  }
  return result
}

export const getDefaultStarredCategoriesByUserId = async (
  soleUserId: string
): Promise<StarredCategory[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-categories/user/${soleUserId}/default`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No default starred categories returned.")
    return []
  }
  return result
}

export const getStarredCategoryById = async (
  id: number,
  soleUserId: string
): Promise<StarredCategory> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-categories/${id}/user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred category.")
    return null
  }
  return result
}

export const updateStarredCategory = async (
  id: number,
  soleUserId: string,
  starredCategory: StarredCategory
): Promise<StarredCategory> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/starred-categories/${id}/user/${soleUserId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(starredCategory),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to update starred category")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating starred category:", error)
    throw error
  }
}

export const deleteStarredCategory = async (
  id: number,
  soleUserId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/starred-categories/${id}/user/${soleUserId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to delete starred category")
    }

    console.log("Starred category deleted successfully")
  } catch (error) {
    console.error("Error deleting starred category:", error)
    throw error
  }
}

export const searchStarredCategoriesByCategory = async (
  soleUserId: string,
  category: string
): Promise<StarredCategory[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-categories/user/${soleUserId}/search?category=${encodeURIComponent(category)}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No search results returned for starred categories.")
    return []
  }
  return result
}

export const existsBySoleUserIdAndCategory = async (
  soleUserId: string,
  category: string
): Promise<boolean> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-categories/user/${soleUserId}/exists?category=${encodeURIComponent(category)}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  return result
}

// Starred Talent API functions
export const createStarredTalent = async (
  starredTalent: StarredTalent
): Promise<StarredTalent> => {
  try {
    const response = await fetch(`${API_BASE_URL}/starred-talents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(starredTalent),
    })

    if (!response.ok) {
      throw new Error("Failed to create starred talent")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating starred talent:", error)
    throw error
  }
}

export const getAllStarredTalentsByUserId = async (
  soleUserId: string
): Promise<StarredTalent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred talents.")
    return []
  }
  return result
}

export const getStarredTalentsByCategoryId = async (
  starredCategoryId: number
): Promise<StarredTalent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/category/${starredCategoryId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred talents by category.")
    return []
  }
  return result
}

export const getStarredTalentsByCategoryIdPaginated = async (
  starredCategoryId: number,
  pageNo: number = 0,
  pageSize: number = 10,
  orderBy: string = "createdAt",
  orderSeq: string = "desc"
): Promise<PaginatedStarredTalentsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/category/${starredCategoryId}/paginated?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log(
      "No content returned for paginated starred talents by category."
    )
    return {
      data: [],
      total: 0,
      page: 0,
      pageSize: pageSize,
    }
  }
  return result
}

export const getStarredTalentsByUserIdAndCategoryId = async (
  soleUserId: string,
  starredCategoryId: number
): Promise<StarredTalent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/category/${starredCategoryId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred talents by user and category.")
    return []
  }
  return result
}

export const getStarredTalentById = async (
  id: number,
  soleUserId: string
): Promise<StarredTalent> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/${id}/user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred talent.")
    return null
  }
  return result
}

export const updateStarredTalent = async (
  id: number,
  soleUserId: string,
  starredTalent: StarredTalent
): Promise<StarredTalent> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/starred-talents/${id}/user/${soleUserId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(starredTalent),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to update starred talent")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating starred talent:", error)
    throw error
  }
}

export const deleteStarredTalent = async (
  id: number,
  soleUserId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/starred-talents/${id}/user/${soleUserId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to delete starred talent")
    }

    console.log("Starred talent deleted successfully")
  } catch (error) {
    console.error("Error deleting starred talent:", error)
    throw error
  }
}

export const getFavoriteStarredTalentsByUserId = async (
  soleUserId: string
): Promise<StarredTalent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/favorites`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No favorite starred talents returned.")
    return []
  }
  return result
}

export const searchStarredTalentsByNotes = async (
  soleUserId: string,
  notes: string
): Promise<StarredTalent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/search?notes=${encodeURIComponent(notes)}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No search results returned for starred talents.")
    return []
  }
  return result
}

export const existsBySoleUserIdAndTalentIdAndStarredCategoryId = async (
  soleUserId: string,
  talentId: string,
  starredCategoryId: number
): Promise<boolean> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/exists?talentId=${encodeURIComponent(talentId)}&starredCategoryId=${starredCategoryId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  return result
}

export const getStarredTalentsByCategoryIdAndTalentId = async (
  starredCategoryId: number,
  talentId: string
): Promise<StarredTalent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/category/${starredCategoryId}/talent/${talentId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log(
      "No content returned for starred talents by category and talent."
    )
    return []
  }
  return result
}

export const getStarredTalentsByUserIdAndTalentId = async (
  soleUserId: string,
  talentId: string
): Promise<StarredTalent[]> => {
  console.log("API Debug - soleUserId:", soleUserId, "talentId:", talentId)
  const url = `${API_BASE_URL}/starred-talents/user/${soleUserId}/talent/${talentId}`
  console.log("API Debug - URL:", url)

  const response = await fetch(url)
  console.log("API Debug - Response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.log("API Debug - Error response:", errorText)
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  console.log("API Debug - Result:", result)

  if (!result) {
    console.log("No content returned for starred talents by user and talent.")
    return []
  }
  return result
}

export const getStarredTalentByUserIdAndTalentIdAndCategoryId = async (
  soleUserId: string,
  talentId: string,
  starredCategoryId: number
): Promise<StarredTalent> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/talent/${talentId}/category/${starredCategoryId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred talent.")
    return null
  }
  return result
}

export const countStarredTalentsByUserId = async (
  soleUserId: string
): Promise<number> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/count`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  return result
}

export const countStarredTalentsByCategoryId = async (
  starredCategoryId: number
): Promise<number> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/category/${starredCategoryId}/count`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  return result
}

export const getStarredCategoriesWithTalentsByUserId = async (
  soleUserId: string
): Promise<StarredCategoryWithTalentsResponse[]> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/categories-with-talents`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for starred categories with talents.")
    return []
  }
  return result
}

export const getAllStarredTalentsWithPhotosByUserId = async (
  soleUserId: string
): Promise<AllStarredTalentsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/all-with-talents`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for all starred talents with photos.")
    return {
      latestTalents: [],
      totalCount: 0,
    }
  }
  return result
}

export const getUniqueStarredTalentsWithPhotosByUserId = async (
  soleUserId: string
): Promise<AllStarredTalentsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/unique-with-talents`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for unique starred talents with photos.")
    return {
      latestTalents: [],
      totalCount: 0,
    }
  }
  return result
}

export const getAllStarredTalentsByUserIdPaginated = async (
  soleUserId: string,
  pageNo: number = 0,
  pageSize: number = 10,
  orderBy: string = "createdAt",
  orderSeq: string = "desc"
): Promise<PaginatedStarredTalentsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/starred-talents/user/${soleUserId}/paginated?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const result = await response.json()
  if (!result) {
    console.log("No content returned for paginated starred talents by user.")
    return {
      data: [],
      total: 0,
      page: 0,
      pageSize: pageSize,
    }
  }
  return result
}

// TypeScript interfaces
export interface StarredCategory {
  id?: number
  soleUserId: string
  category: string
  description?: string
  color?: string
  icon?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateCategoryAndAddTalentRequest {
  soleUserId: string
  category: string
  description?: string
  color?: string
  icon?: string
  talentId: string
}

export interface CreateCategoryAndAddTalentResponse {
  starredCategory: StarredCategory
  starredTalent: StarredTalent
}

export interface PaginatedStarredTalentsResponse {
  data: StarredTalent[]
  total: number
  page: number
  pageSize: number
}

export interface StarredTalent {
  id?: number
  starredCategoryId: number
  soleUserId: string
  talentId: string
  createdAt?: string
  updatedAt?: string
}

export interface StarredCategoryWithTalentsResponse {
  category: StarredCategory
  latestTalents: TalentPreview[]
  totalCount: number
}

// New interface for "all" starred talents
export interface AllStarredTalentsResponse {
  latestTalents: TalentPreview[]
  totalCount: number
}

export interface TalentPreview {
  talentId: string
  talentName: string
  username: string
  firstPhotoUrl: string
  comcardId: number
}
