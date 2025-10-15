//JobContracts data

import { JobContract, JobContractConditions } from "@/types/contract"

import { API_BASE_URL } from "../apiservice"

export const createJobContracts = async (values: JobContract) => {
  console.log("createJobContracts", values)
  try {
    const response = await fetch(`${API_BASE_URL}/job-contracts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    const result = await response.json()
    if (response.ok) {
      console.log("JobContracts submitted successfully")
      return result // Optionally return the created project or any relevant info
    }
  } catch (error) {
    console.error("Error posting data:", error)
  }
}

// Example usage function showing how to create a contract with multiple conditions
export const createExampleJobContract = async () => {
  const exampleContract = {
    projectId: 1,
    roleId: 101,
    clientId: "client_001",
    talentId: "talent_001",
    jobApplicantId: 1001,
    projectName: "Summer Blockbuster Movie",
    roleTitle: "Lead Actor",
    remarks: "Main character role",
    contractStatus: "offered",
    conditions: [
      {
        usageRights: "Worldwide distribution rights for 5 years",
        paymentBasis: "per_day",
        paymentAmount: 5000.0,
        paymentAmountOt: 7500.0,
        paymentAdditional: 1000.0,
        paymentCurrency: "USD",
        paymentDate: "2024-02-15T10:00:00Z",
        termsAndConditions:
          "Standard industry terms apply. No exclusivity clauses.",
        readByTalent: false,
        readByClient: true,
        schedules: [
          {
            location: "Studio A, Hollywood",
            fromTime: "2024-02-15T08:00:00Z",
            toTime: "2024-02-15T18:00:00Z",
          },
          {
            location: "Outdoor Location, Malibu",
            fromTime: "2024-02-17T07:00:00Z",
            toTime: "2024-02-17T19:00:00Z",
          },
        ],
      },
      {
        usageRights: "Promotional appearances and interviews",
        paymentBasis: "per_appearance",
        paymentAmount: 2000.0,
        paymentAmountOt: 3000.0,
        paymentAdditional: 500.0,
        paymentCurrency: "USD",
        paymentDate: "2024-02-20T14:30:00Z",
        termsAndConditions:
          "Required promotional activities. 5 appearances included.",
        readByTalent: false,
        readByClient: false,
        schedules: [
          {
            location: "Press Conference Room, Beverly Hills",
            fromTime: "2024-02-20T14:30:00Z",
            toTime: "2024-02-20T16:30:00Z",
          },
        ],
      },
    ],
  }

  return createJobContractWithConditions(exampleContract)
}

// Helper function to create job contract with conditions structure
export const createJobContractWithConditions = async (contractData: {
  projectId: number
  roleId: number
  clientId: string
  talentId: string
  jobApplicantId: number
  projectName: string
  roleTitle: string
  remarks?: string
  contractStatus: string
  conditions: Array<{
    usageRights?: string
    paymentBasis: string
    paymentAmount: number
    paymentAmountOt?: number
    paymentAdditional?: number
    paymentCurrency: string
    paymentDate: string
    termsAndConditions?: string
    readByTalent?: boolean
    readByClient?: boolean
    schedules?: Array<{
      location?: string
      fromTime: string
      toTime: string
    }>
  }>
}) => {
  console.log("createJobContractWithConditions", contractData)
  try {
    const response = await fetch(`${API_BASE_URL}/job-contracts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contractData),
    })

    const result = await response.json()
    if (response.ok) {
      console.log("JobContract with conditions created successfully")
      return result
    }
  } catch (error) {
    console.error("Error creating job contract with conditions:", error)
  }
}

export const getJobContractsByProjectIdAndStatus = async (
  projectId: number,
  status: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/project/${projectId}/status/${status}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobContractsById = async (contractId: number) => {
  const response = await fetch(`${API_BASE_URL}/job-contracts/${contractId}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobContractsWithProfileByProjectId = async (
  projectId: number
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/projectWithProfile/${projectId}`
  )
  console.log("response", response)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobContractsWithProfileByProjectIdAndTalentId = async (
  projectId: number,
  talentId: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/projectWithProfile/${projectId}/talent/${talentId}`
  )
  console.log("response", response)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getJobContracts = async () => {
  const response = await fetch(`${API_BASE_URL}/job-contracts`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const updateJobContractsStatusById = async (
  values: any,
  contractid: number
) => {
  console.log("updateJobContractsProcess", values)
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-contracts/${contractid}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    )
    const result = await response.json()
    if (response.ok) {
      console.log("JobContract updated successfully")
      return result
    }
  } catch (error) {
    console.error("Error updating job contract:", error)
  }
}

export const deleteJobContractsById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/job-contracts/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
  } catch (error) {
    console.error("Error deleting JobContracts:", error)
  }
}

//GET /api/job-contracts/search?contractId=13&projectId=290&projectName=form%20data&roleId=255&roleTitle=test-roleTitle&talentId=user123&orderBy=createdAt&orderSeq=desc&pageNo=0&pageSize=20
export const searchJobContracts = async (searchUrl: string) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/search?${searchUrl}`
  )
  return response.json()
}

// Mark contract as read by talent
export const markAsReadByTalent = async (contractId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/${contractId}/mark-read-by-talent`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

// Mark contract as read by client
export const markAsReadByClient = async (contractId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/${contractId}/mark-read-by-client`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

// Approve contract condition

// Update read status for both talent and client
export const updateReadStatus = async (
  contractId: number,
  readByTalent?: boolean,
  readByClient?: boolean
) => {
  const params = new URLSearchParams()
  if (readByTalent !== undefined) {
    params.append("readByTalent", readByTalent.toString())
  }
  if (readByClient !== undefined) {
    params.append("readByClient", readByClient.toString())
  }

  const response = await fetch(
    `${API_BASE_URL}/job-contracts/${contractId}/read-status?${params.toString()}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

// Client search job contracts (constrained to client's contracts only)
export const clientSearchJobContracts = async (
  clientId: string,
  searchUrl: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/clientSearch/${clientId}?${searchUrl}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

// Talent search job contracts (constrained to talent's contracts only)
export const talentSearchJobContracts = async (
  talentId: string,
  searchUrl: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/job-contracts/talentSearch/${talentId}?${searchUrl}`
  )
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

// Update contract condition
export const updateContractCondition = async (
  conditionId: number,
  conditionUpdate: JobContractConditions
) => {
  console.log("updateContractCondition", conditionId, conditionUpdate)
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-contracts/condition/${conditionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conditionUpdate),
      }
    )

    const result = await response.json()
    if (response.ok) {
      console.log("Contract condition updated successfully")
      return result
    } else {
      throw new Error(result.message || "Failed to update contract condition")
    }
  } catch (error) {
    console.error("Error updating contract condition:", error)
    throw error
  }
}

export const updateConditionStatus = async (
  conditionId: number,
  conditionStatus: string,
  readByTalent?: boolean,
  readByClient?: boolean
) => {
  console.log(
    "updateConditionStatus",
    conditionId,
    conditionStatus,
    readByTalent,
    readByClient
  )
  try {
    const params = new URLSearchParams({
      conditionStatus: conditionStatus,
    })

    if (readByTalent !== undefined) {
      params.append("readByTalent", readByTalent.toString())
    }
    if (readByClient !== undefined) {
      params.append("readByClient", readByClient.toString())
    }

    const response = await fetch(
      `${API_BASE_URL}/job-contracts/condition/${conditionId}/status?${params.toString()}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const result = await response.json()
    if (response.ok) {
      console.log("Contract condition status updated successfully")
      return result
    } else {
      throw new Error(
        result.message || "Failed to update contract condition status"
      )
    }
  } catch (error) {
    console.error("Error updating contract condition status:", error)
    throw error
  }
}

export const createJobContractCondition = async (
  contractId: number,
  conditionData: any
) => {
  console.log("createJobContractCondition", contractId, conditionData)
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-contracts/${contractId}/conditions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conditionData),
      }
    )

    const result = await response.json()
    if (response.ok) {
      console.log("Contract condition created successfully")
      return result
    } else {
      throw new Error(result.message || "Failed to create contract condition")
    }
  } catch (error) {
    console.error("Error creating contract condition:", error)
    throw error
  }
}

export const createBatchContractConditions = async (batchRequest: {
  contractIds: number[]
  conditionData: any
  remarks?: string
}) => {
  console.log("createBatchContractConditions", batchRequest)
  try {
    const response = await fetch(
      `${API_BASE_URL}/job-contracts/batch-conditions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchRequest),
      }
    )

    const result = await response.json()
    if (response.ok) {
      console.log("Batch contract conditions created successfully")
      return result
    } else {
      throw new Error(
        result.message || "Failed to create batch contract conditions"
      )
    }
  } catch (error) {
    console.error("Error creating batch contract conditions:", error)
    throw error
  }
}
