// project announcement data

import { API_BASE_URL } from "../apiservice"

// Get all project announcements with pagination
export const getProjectAnnouncements = async (
  orderBy: string = "createdAt",
  orderSeq: string = "desc",
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching project announcements:", error)
    throw error
  }
}

// Get project announcement by ID
export const getProjectAnnouncementById = async (id: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project-announcement/${id}`)
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching project announcement:", error)
    throw error
  }
}

// Get project announcements by project ID with pagination
export const getProjectAnnouncementsByProjectId = async (
  projectId: number,
  orderBy: string = "createdAt",
  orderSeq: string = "desc",
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/project/${projectId}?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching project announcements by project ID:", error)
    throw error
  }
}

// Get all project announcements by project ID (no pagination)
export const getAllProjectAnnouncementsByProjectId = async (
  projectId: number
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/project/${projectId}/all`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error(
      "Error fetching all project announcements by project ID:",
      error
    )
    throw error
  }
}

// Get project announcements by sender ID with pagination
export const getProjectAnnouncementsBySenderId = async (
  senderId: string,
  orderBy: string = "createdAt",
  orderSeq: string = "desc",
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/sender/${senderId}?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching project announcements by sender ID:", error)
    throw error
  }
}

// Get all project announcements by sender ID (no pagination)
export const getAllProjectAnnouncementsBySenderId = async (
  senderId: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/sender/${senderId}/all`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error(
      "Error fetching all project announcements by sender ID:",
      error
    )
    throw error
  }
}

// Get project announcements by project ID and sender ID with pagination
export const getProjectAnnouncementsByProjectIdAndSenderId = async (
  projectId: number,
  senderId: string,
  orderBy: string = "createdAt",
  orderSeq: string = "desc",
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/project/${projectId}/sender/${senderId}?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error(
      "Error fetching project announcements by project ID and sender ID:",
      error
    )
    throw error
  }
}

// Get all project announcements by project ID and sender ID (no pagination)
export const getAllProjectAnnouncementsByProjectIdAndSenderId = async (
  projectId: number,
  senderId: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/project/${projectId}/sender/${senderId}/all`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error(
      "Error fetching all project announcements by project ID and sender ID:",
      error
    )
    throw error
  }
}

// Get project announcements for user based on their role level and view level requirements
export const getProjectAnnouncementsForUser = async (
  projectId: number,
  userId: string,
  userRoleLevels: { roleId: number; level: number }[],
  orderBy: string = "createdAt",
  orderSeq: string = "desc",
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  try {
    console.log(
      "API Call - ProjectId:",
      projectId,
      "UserId:",
      userId,
      "UserRoleLevels:",
      userRoleLevels
    )
    const response = await fetch(
      `${API_BASE_URL}/project-announcement/user/${projectId}/${userId}?orderBy=${orderBy}&orderSeq=${orderSeq}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userRoleLevels),
      }
    )
    console.log("API Response status:", response.status)
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching project announcements for user:", error)
    throw error
  }
}

// Create new project announcement
export const createProjectAnnouncement = async (announcementData: {
  projectId: number
  title: string
  senderId: string
  receivers: any[]
  content: string
}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project-announcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(announcementData),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating project announcement:", error)
    throw error
  }
}

// Update project announcement
export const updateProjectAnnouncement = async (
  id: number,
  announcementData: {
    projectId: number
    title: string
    senderId: string
    receivers: string
    content: string
  }
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project-announcement/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(announcementData),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating project announcement:", error)
    throw error
  }
}

// Delete project announcement
export const deleteProjectAnnouncement = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project-announcement/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete the project announcement")
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      console.log("Delete response:", data)
    } else {
      console.log(
        "Project announcement deleted successfully (no JSON response)"
      )
    }
  } catch (error) {
    console.error("Error deleting project announcement:", error)
    throw error
  }
}
