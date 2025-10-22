import { API_BASE_URL } from "../apiservice"

// Type definitions based on backend response
export interface PostMediaResponse {
  id: number
  postId: number
  mediaUrl: string
  displayOrder: number
  fileName?: string
  fileSize?: number
  mediaType?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface SoleUserInfoDTO {
  soleUserId: string
  username: string
  name: string
  profilePic: string | null
  talentLevel?: string
  clientLevel?: string
}

export interface PostWithDetailsResponse {
  id: number
  soleUserId: string
  content: string
  createdAt: string
  updatedAt?: string
  media: PostMediaResponse[]
  likeCount: number
  commentCount: number
  mediaCount: number
  dimensionType?: string
  calculatedRatio?: string
  soleUserInfo: SoleUserInfoDTO
  isLikedByUser?: boolean // Added for frontend state management
}

export interface PageResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface SearchPostsParams {
  soleUserId?: string
  content?: string
  postId?: number
  orderBy?: string
  orderSeq?: string
  pageNo?: number
  pageSize?: number
}

/**
 * Search posts with filters and pagination
 * GET /api/post/search?soleUserId=&pageNo=0&pageSize=10&orderBy=createdAt&orderSeq=desc
 */
export const searchPosts = async (
  params: SearchPostsParams = {}
): Promise<PageResponse<PostWithDetailsResponse>> => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.soleUserId !== undefined) queryParams.append("soleUserId", params.soleUserId)
    if (params.content) queryParams.append("content", params.content)
    if (params.postId !== undefined) queryParams.append("postId", params.postId.toString())
    if (params.orderBy) queryParams.append("orderBy", params.orderBy)
    if (params.orderSeq) queryParams.append("orderSeq", params.orderSeq)
    if (params.pageNo !== undefined) queryParams.append("pageNo", params.pageNo.toString())
    if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString())
    
    const url = `${API_BASE_URL}/post/search${queryParams.toString() ? `?${queryParams}` : ""}`
    
    console.log('Fetching posts from:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error searching posts:", error)
    throw error
  }
}

/**
 * Get single post by ID with full details
 * GET /api/post/{id}/details
 */
export const getPostWithDetailsById = async (id: number): Promise<PostWithDetailsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}/details`)
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error fetching post details:", error)
    throw error
  }
}

/**
 * Toggle post like
 * POST /api/post-likes/toggle/{postId}/{soleUserId}
 */
export const togglePostLike = async (postId: number, soleUserId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post-likes/toggle/${postId}/${soleUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error toggling post like:", error)
    throw error
  }
}

/**
 * Get comments for a post
 * GET /api/post-comments/{postId}
 */
export const getPostComments = async (postId: number): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post-comments/${postId}`)
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error fetching post comments:", error)
    throw error
  }
}

/**
 * Create a comment on a post
 * POST /api/post-comments
 */
export const createPostComment = async (commentData: {
  postId: number
  soleUserId: string
  content: string
}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    })
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error creating post comment:", error)
    throw error
  }
}
