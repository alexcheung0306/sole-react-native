import { API_BASE_URL } from "../apiservice"

// Types
export interface PostMedia {
  file?: File | null
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
  soleUserId?: string
  postMedias: PostMedia[]
  content: string
}

export interface Post {
  id: number
  soleUserId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface PostWithDetailsResponse extends Post {
  media: PostMediaResponse[]
  comments: PostCommentResponse[]
  likes: PostLikeResponse[]
  likeCount: number
  commentCount: number
  mediaCount: number
}

export interface PostMediaResponse {
  id: number
  postId: number
  mediaUrl: string
  displayOrder: number
  fileName: string
  fileSize: number
  mediaType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PostCommentResponse {
  id: number
  postId: number
  soleUserId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface PostLikeResponse {
  id: number
  postId: number
  soleUserId: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
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
  orderSeq?: "asc" | "desc"
  pageNo?: number
  pageSize?: number
}

// API Functions

/**
 * Create a new post with multipart form data (TalentInfo pattern)
 */
export const createPost = async (
  postData: CreatePostRequest
): Promise<Post> => {
  try {
    console.log("Creating post with data:", postData)

    const formData = new FormData()

    // Add the soleUserId as form field
    if (postData.soleUserId) {
      formData.append("soleUserId", postData.soleUserId)
    }
    // Add the content as form field
    formData.append("content", postData.content || "")

    // Append postMedias with nested fields using bracket notation (like TalentInfo)
    let mediaFileIndex = 0
    postData.postMedias?.forEach((media, index) => {
      // Append crop data fields with nested notation
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

      // Append isVideo flag
      formData.append(
        `postMedias[${index}].isVideo`,
        media.isVideo?.toString() || "false"
      )

      // Append file if it exists (File objects go directly into FormData)
      if (media.file instanceof File) {
        console.log(
          `[createPost] Appending file ${mediaFileIndex} for media ${index}:`,
          {
            fileName: media.file.name,
            fileSize: media.file.size,
            fileType: media.file.type,
            isVideo: media.isVideo,
          }
        )
        formData.append(`postMedias[${index}].file`, media.file)
        formData.append(
          `postMedias[${index}].fileIndex`,
          mediaFileIndex.toString()
        )
        mediaFileIndex++
      } else {
        console.warn(`[createPost] No file for media ${index}:`, {
          mediaFile: media.file,
          mediaFileType: typeof media.file,
          isVideo: media.isVideo,
        })
      }
    })

    console.log(`Total media files being sent: ${mediaFileIndex}`)

    const response = await fetch(`${API_BASE_URL}/post`, {
      method: "POST",
      body: formData, // No Content-Type header - browser sets it automatically
    })

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

/**
 * Create a new post with media files (alias for createPost)
 * Note: Files should be included in postData.postMedias[].file
 */
export const createPostWithMedia = async (
  postData: CreatePostRequest,
  mediaFiles: File[]
): Promise<Post> => {
  // Add mediaFiles to postMedias if not already present
  if (mediaFiles && mediaFiles.length > 0) {
    postData.postMedias = postData.postMedias || []
    mediaFiles.forEach((file, index) => {
      if (postData.postMedias && postData.postMedias[index]) {
        postData.postMedias[index].file = file
      } else {
        postData.postMedias?.push({
          file: file,
          cropData: {
            x: 0,
            y: 0,
            width: file.name ? 1920 : 0, // Default dimensions
            height: file.name ? 1080 : 0,
            zoom: 1,
          },
          isVideo: file.type.startsWith("video/"),
        })
      }
    })
  }

  return createPost(postData)
}

/**
 * Get all posts
 */
export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

/**
 * Get all posts with pagination
 */
export const getAllPostsPaginated = async (
  page: number = 0,
  size: number = 10,
  sort: string = "createdAt,desc"
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sort,
    })

    const response = await fetch(`${API_BASE_URL}/post/paginated?${params}`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching paginated posts:", error)
    throw error
  }
}

/**
 * Get a post by ID
 */
export const getPostById = async (id: number): Promise<Post> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching post:", error)
    throw error
  }
}

/**
 * Get a post with all details by ID
 */
export const getPostWithDetailsById = async (
  id: number
): Promise<PostWithDetailsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}/details`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching post details:", error)
    throw error
  }
}

/**
 * Update a post
 */
export const updatePost = async (
  id: number,
  postData: Partial<Post>
): Promise<Post> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating post:", error)
    throw error
  }
}

/**
 * Delete a post
 */
export const deletePost = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}`, {
      method: "DELETE",
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
 * Get posts by sole user ID
 */
export const getPostsBySoleUserId = async (
  soleUserId: string
): Promise<Post[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/user/${soleUserId}`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching user posts:", error)
    throw error
  }
}

/**
 * Get posts by sole user ID with pagination
 */
export const getPostsBySoleUserIdPaginated = async (
  soleUserId: string,
  page: number = 0,
  size: number = 10,
  sort: string = "createdAt,desc"
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sort,
    })

    const response = await fetch(
      `${API_BASE_URL}/post/user/${soleUserId}/paginated?${params}`
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching user posts paginated:", error)
    throw error
  }
}

/**
 * Get post count by sole user ID
 */
export const getPostCountBySoleUserId = async (
  soleUserId: string
): Promise<number> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/post/user/${soleUserId}/count`
    )

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching user post count:", error)
    throw error
  }
}

/**
 * Get total post count
 */
export const getTotalPostCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/post/count`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching total post count:", error)
    throw error
  }
}

/**
 * Update post content only
 */
export const updatePostContent = async (
  id: number,
  content: string
): Promise<Post> => {
  try {
    const params = new URLSearchParams({
      content: content,
    })

    const response = await fetch(
      `${API_BASE_URL}/post/${id}/content?${params}`,
      {
        method: "PATCH",
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update post content: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating post content:", error)
    throw error
  }
}

/**
 * Search and filter posts with details (media, comments, likes)
 */
export const searchPosts = async (
  params: SearchPostsParams = {}
): Promise<PageResponse<PostWithDetailsResponse>> => {
  try {
    const queryParams = new URLSearchParams()

    if (params.soleUserId) queryParams.append("soleUserId", params.soleUserId)
    if (params.content) queryParams.append("content", params.content)
    if (params.postId !== undefined)
      queryParams.append("postId", params.postId.toString())
    if (params.orderBy) queryParams.append("orderBy", params.orderBy)
    if (params.orderSeq) queryParams.append("orderSeq", params.orderSeq)
    if (params.pageNo !== undefined)
      queryParams.append("pageNo", params.pageNo.toString())
    if (params.pageSize)
      queryParams.append("pageSize", params.pageSize.toString())

    const url = `${API_BASE_URL}/post/search${queryParams.toString() ? `?${queryParams}` : ""}`
    console.log("Searching posts:", url)

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
