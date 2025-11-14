// project data

import { compressImage } from "@/utils/image-compression"

import { API_BASE_URL } from "../apiservice"

//talent search api (talent)
//http://localhost:8080/api/project/search?isPrivate=false&status=Published&pageNo=1&pageSize=2&orderBy=id&orderSeq=dec
export const getProject = async (searchAPI: string): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project/search?isPrivate=false${searchAPI}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

//my jobs search api (talent)
//http://localhost:8080/api/project/search?isPrivate=false&status=published&pageNo=1&pageSize=2&orderBy=id&orderSeq=dec
export const getInvolvedProject = async (
  searchAPI: string,
  soleUserId: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project/search-involved/${soleUserId}?${searchAPI}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

//client search api (client)
// http://localhost:8080/api/project/sole-user/cm72uo8480002sqqbesvg0a3f?isPrivate=false&status=draft&pageNo=1&pageSize=2&orderBy=id&orderSeq=dec
export const getProjectBySoleUserId = async (
  soleUserId: string,
  searchAPI: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project/sole-user/${soleUserId}${searchAPI}`
    )
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }
    const result: any = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching project data:", error)
    throw error
  }
}

//single project
export const getProjectByIdAndSoleUserId = async (
  projectid: number,
  soleUserId: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project/${projectid}/sole-user/${soleUserId}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

export const getProjectByID = async (projectid: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectid}`)

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result // Return the fetched result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error // Rethrow the error for further handling
  }
}

export const createProject = async (soleUserId: string, values) => {
  const formData = new FormData()
  if (values.projectImage) {
    const compressedImage = await compressImage(values?.projectImage)

    formData.append("projectImage", compressedImage)
  }
  formData.append("soleUserId", soleUserId)
  formData.append("bucket", "projects")
  formData.append("projectImageName", "projectImage")
  formData.append("projectName", values.projectName)
  formData.append("projectDescription", values.projectDescription)
  formData.append("usage", values.usage)
  formData.append("remarks", values.remarks)
  formData.append("status", "Draft")
  formData.append(
    "isPrivate",
    values.isPrivate !== undefined ? values.isPrivate.toString() : "true"
  )
  for (const [key, value] of formData.entries()) {
    console.log(key, value) // Log FormData entries for debugging
  }
  try {
    const response = await fetch(`${API_BASE_URL}/project`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error("Failed to create project")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
  return null
}

export const updateProject = async (
  projectId: number,
  soleUserId,
  values: any
) => {
  const formData = new FormData()
  if (values.projectImage) {
    formData.append("projectImage", values.projectImage)
  }
  formData.append("soleUserId", soleUserId)
  formData.append("bucket", "projects")
  formData.append("projectImageName", "projectImage")
  
  // Always send as strings, even if empty - backend needs these fields
  formData.append("projectName", String(values.projectName || ""))
  formData.append("projectDescription", String(values.projectDescription || ""))
  formData.append("usage", String(values.usage ?? ""))
  formData.append("remarks", String(values.remarks ?? ""))
  formData.append("status", String(values.status || "Draft"))
  formData.append(
    "isPrivate",
    values.isPrivate !== undefined ? values.isPrivate.toString() : "true"
  )
  // Log FormData entries for debugging - check all fields are present
  console.log('[UpdateProject] FormData entries:')
  const formDataEntries: { [key: string]: any } = {}
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value, `(type: ${typeof value})`)
    formDataEntries[key] = value
  }
  // Verify usage and remarks are present
  console.log('[UpdateProject] Usage field present:', 'usage' in formDataEntries, 'value:', formDataEntries['usage'])
  console.log('[UpdateProject] Remarks field present:', 'remarks' in formDataEntries, 'value:', formDataEntries['remarks'])
  
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
      method: "PUT",
      // Don't set Content-Type header for multipart form data - let browser set it with boundary
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[UpdateProject] Error response:`, response.status, errorText)
      throw new Error(`Failed to update project: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log("[UpdateProject] Success response:", result)
    return result // Return the updated project or any relevant info
  } catch (error) {
    console.error("[UpdateProject] Error updating project:", error)
    throw error // Re-throw to let the caller handle it
  }
}

export const publishProject = async (projectId: number, formData: any) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project/publish/${projectId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    )

    const result = await response.json()
    if (response.ok) {
      console.log("Project updated successfully")
      return result
    }
  } catch (error) {
    console.error("Error updating project:", error)
  }
}

export const deleteProjectById = async (projectId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete the project")
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      console.log("Delete response:", data)
    } else {
      console.log("Project deleted successfully (no JSON response)")
    }
  } catch (error) {
    console.error("Error deleting project:", error)
    throw error // Rethrow the error for further handling if needed
  }
}
