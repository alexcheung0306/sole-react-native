//applicant data

import { API_BASE_URL } from "../apiservice"

export const getRoleApplicants = async () => {
  const response = await fetch(`${API_BASE_URL}/job-applicants`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRoleApplicantById = async (id: number): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/job-applicants/${id}`)
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
      console.log("Applicant submitted successfully")
      return result // Optionally return the created project or any relevant info
    }
  } catch (error) {
    console.error("Error posting data:", error)
  }
}

export const updateApplicantProcessById = async (values: any, id: number) => {
  console.log("updateApplicantProcess", values)
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
      console.log("Applicant submitted successfully")
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
