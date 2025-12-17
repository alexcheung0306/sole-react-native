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
  viewerUserId?: string // For calculating isLikedByUser without filtering posts
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
    if (params.viewerUserId !== undefined) queryParams.append("viewerUserId", params.viewerUserId)
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
 * GET /api/post-comments/post/{postId}/paginated?page=0&size=10&sortDirection=desc
 * 
 * Backend returns:
 * {
 *   content: [
 *     {
 *       id: number,
 *       postId: number,
 *       soleUserId: string,
 *       comment: string,  // Note: backend uses 'comment' not 'content'
 *       username: string,
 *       profilePic: string,
 *       createdAt: string,
 *       updatedAt: string,
 *     }
 *   ],
 *   totalElements: number,
 *   ...
 * }
 */
export const getPostComments = async (postId: number, page: number = 0, size: number = 50, sortDirection: string = 'desc'): Promise<any[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/post-comments/post/${postId}/paginated?page=${page}&size=${size}&sortDirection=${sortDirection}`
    )
    
    if (!response.ok) {
      // If 404, return empty array (no comments yet)
      if (response.status === 404) {
        return []
      }
      const errorText = await response.text()
      console.error(`Error fetching post comments: ${response.status} ${response.statusText}`, errorText)
      // Return empty array on error instead of throwing
      return []
    }
    
    const data = await response.json()
    // Backend returns paginated response with 'content' array
    const comments = data.content || data || []
    
    // Transform backend response to match Comment interface
    // Backend uses 'comment' field, but frontend expects 'content'
    // Backend has username/profilePic directly, but frontend expects soleUserInfo object
    return comments.map((comment: any) => ({
      id: comment.id?.toString() || '',
      postId: comment.postId?.toString() || '',
      soleUserId: comment.soleUserId || '',
      content: comment.comment || comment.content || '', // Backend uses 'comment', frontend expects 'content'
      createdAt: comment.createdAt || '',
      soleUserInfo: {
        soleUserId: comment.soleUserId || '',
        username: comment.username || '',
        name: comment.username || '', // Use username as name if name not available
        profilePic: comment.profilePic || null,
      },
    }))
  } catch (error) {
    console.error("Error fetching post comments:", error)
    // Return empty array on error instead of throwing
    return []
  }
}

/**
 * Create a new post with multiple media files
 * POST /api/post
 */
export interface PostMedia {
  file?: any | null
  uri?: string
  fileName?: string
  mimeType?: string
  cropData?: {
    x: number
    y: number
    width: number
    height: number
    zoom: number
    naturalWidth?: number
    naturalHeight?: number
  }
  isVideo: boolean
}

export interface CreatePostRequest {
  soleUserId: string
  postMedias: PostMedia[]
  content: string
}

export const createPost = async (postData: CreatePostRequest): Promise<PostWithDetailsResponse> => {
  try {
    const formData = new FormData()

    // 1. Add soleUserId
    if (postData.soleUserId) {
      formData.append("soleUserId", postData.soleUserId)
    }
    
    // 2. Add content (caption)
    formData.append("content", postData.content || "")

    // 3. Append postMedias with nested fields
    let mediaFileIndex = 0
    postData.postMedias?.forEach((media, index) => {
      
      // 3a. Append crop data with nested notation
      if (media.cropData) {
        formData.append(
          `postMedias[${index}].cropData.x`,
          media.cropData.x?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.y`,
          media.cropData.y?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.width`,
          media.cropData.width?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.height`,
          media.cropData.height?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.zoom`,
          media.cropData.zoom?.toString() || "1"
        )
        if (media.cropData.naturalWidth) {
          formData.append(
            `postMedias[${index}].cropData.naturalWidth`,
            media.cropData.naturalWidth.toString()
          )
        }
        if (media.cropData.naturalHeight) {
          formData.append(
            `postMedias[${index}].cropData.naturalHeight`,
            media.cropData.naturalHeight.toString()
          )
        }
      }

      // 3b. Append isVideo flag
      formData.append(
        `postMedias[${index}].isVideo`,
        media.isVideo?.toString() || "false"
      )

      // 3c. Append file (React Native format)
      if (media.uri) {
        const sanitizedUri = media.uri;
        const fallbackName = `post_${index}.${media.isVideo ? 'mp4' : 'jpg'}`;
        const fileName = media.fileName || fallbackName;
        const mimeType =
          media.mimeType || (media.isVideo ? 'video/mp4' : 'image/jpeg');

        formData.append(`postMedias[${index}].file`, {
          uri: sanitizedUri,
          name: fileName,
          type: mimeType,
        } as any);
        
        formData.append(
          `postMedias[${index}].fileIndex`,
          mediaFileIndex.toString()
        )
        mediaFileIndex++
      }
    })

    console.log(`Creating post with ${mediaFileIndex} media files`)

    // 4. Send to backend
    const response = await fetch(`${API_BASE_URL}/post`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create post error:', errorText)
      throw new Error(`Failed to create post: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Post created successfully:', result)
    return result
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

/**
 * Delete a post
 * DELETE /api/post/{id}
 */
export const deletePost = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error deleting post:", error)
    throw error
  }
}

/**
 * Create a comment on a post
 * POST /api/post-comments
 * 
 * Backend expects:
 * {
 *   "postId": number,
 *   "soleUserId": string,
 *   "comment": string  // Note: backend uses 'comment' not 'content'
 * }
 */
export const createPostComment = async (commentData: {
  postId: number
  soleUserId: string
  content: string
}): Promise<any> => {
  try {
    // Transform frontend format to backend format
    const backendData = {
      postId: commentData.postId,
      soleUserId: commentData.soleUserId,
      comment: commentData.content, // Backend expects 'comment' field
    }
    
    const response = await fetch(`${API_BASE_URL}/post-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error creating post comment: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Error: ${response.statusText || 'Failed to create comment'}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error creating post comment:", error)
    throw error
  }
}
