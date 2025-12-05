//applicant data

import { API_BASE_URL } from "../apiservice"
import {
  JobApplicantPreviewResponse,
  SearchApplicantsParams,
  SearchApplicantsResponse,
} from "./types/applicant"

// Get job applicants by user search with pagination
//http://localhost:8080/api/job-applicants/search-by-user/cmcms0d3i0000f046wtof867h?applicationStatus=offered&pageNo=0&pageSize=10
export const getJobApplicantsByUser = async (
  soleUserId: string,
  searchAPI: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-applicants/search-by-user/${soleUserId}?${searchAPI}`
    )
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching job applicants:", error)
    throw error
  }
}

export const getRoleApplicants = async () => {
  const response = await fetch(`${API_BASE_URL}/job-applicants`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRoleApplicantById = async (id: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/job-applicants/${id}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRoleApplicantWithDetailsById = async (
  id: number
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/job-applicants/${id}/details`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRoleApplicantsByRoleId = async (
  roleId: number
): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/job-applicants/role/${roleId}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRoleApplicantsByRoleIdAndApplicationProcess = async (
  roleId: number,
  applicationProcess: string
): Promise<any[]> => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/role/${roleId}/application-process/${applicationProcess}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

// New project-based API functions
export const getJobApplicantsByProjectId = async (
  projectId: number
): Promise<any[]> => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/project/${projectId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobApplicantsByProjectIdAndRoleId = async (
  projectId: number,
  roleId: number
): Promise<any[]> => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/project/${projectId}/role/${roleId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobApplicantsByProjectIdAndRoleIdAndApplicationProcess = async (
  projectId: number,
  roleId: number,
  applicationProcess: string
): Promise<any[]> => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/project/${projectId}/role/${roleId}/application-process/${applicationProcess}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobApplicantByProjectIdAndRoleIdAndSoleUserId = async (
  projectId: number,
  roleId: number,
  soleUserId: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/project/${projectId}/role/${roleId}/sole-user/${soleUserId}`
  )
  if (response.status === 204) {
    return response
  }
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getApplicationProcessCountsByProjectIdAndRoleId = async (
  projectId: number,
  roleId: number
): Promise<Record<string, number>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-applicants/project/${projectId}/role/${roleId}/process-counts`
    )
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error getting application process counts:", error)
    throw error
  }
}

export const getJobApplicantsByProjectIdAndSoleUserId = async (
  projectId: number,
  soleUserId: string
): Promise<any[]> => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/project/${projectId}/sole-user/${soleUserId}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRoleApplicantByRoleIdandSoleUserId = async (
  roleId: number,
  soleUserId: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-applicants/role/${roleId}/sole-user/${soleUserId}`
  )
  if (response.status === 204) {
    return response
  }
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json() // Call the json method
}

export const createApplicant = async (values: any) => {
  console.log("createApplicant", values)
  try {
    const response = await fetch(`${API_BASE_URL}/job-applicants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    const result = await response.json()
    if (response.ok) {
      return result // Optionally return the created project or any relevant info
    }
  } catch (error) {
    console.error("Error posting data:", error)
  }
}

export const updateApplicantProcessById = async (values: any, id: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/job-applicants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
    const result = await response.json()
    if (response.ok) {
      return result // Optionally return the created project or any relevant info
    }
  } catch (error) {
    console.error("Error posting data:", error)
  }
}

export const deleteApplicantById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/job-applicants/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
  } catch (error) {
    console.error("Error deleting applicant:", error)
  }
}

// Get application process counts for breadcrumbs
export const getApplicationProcessCounts = async (
  roleId: number
): Promise<Record<string, number>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-applicants/role/${roleId}/process-counts`
    )
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error getting application process counts:", error)
    throw error
  }
}

// Search applicants with comprehensive filtering and name search
export const searchApplicants = async (searchParams: string) => {
  try {
    // Build query string from parameters

    const response = await fetch(
      `${API_BASE_URL}/job-applicants/search?${searchParams}`
    )

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching applicants:", error)
    throw error
  }
}

// Search applicants with project ID support
export const searchApplicantsWithProject = async (
  projectId: number,
  searchParams: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-applicants/search?projectId=${projectId}&${searchParams}`
    )

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching applicants with project:", error)
    throw error
  }
}
