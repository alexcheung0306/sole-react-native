import { API_BASE_URL } from "../apiservice"

//role data
export const getRoleById = async (id: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/roles/${id}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const getRolesByProjectId = async (id: number): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/roles/project/${id}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export const createRoleWithSchedules = async (
  parsedValues: any,
  values: any
): Promise<boolean> => {
  try {
    // Transform the data to match the new backend structure
    const createRoleRequest = {
      role: {
        projectId: parsedValues.projectId,
        requiredGender: parsedValues.requiredGender,
        roleTitle: parsedValues.roleTitle,
        roleDescription: parsedValues.roleDescription,
        paymentBasis: parsedValues.paymentBasis,
        budget: parsedValues.budget,
        talentNumbers: parsedValues.talentNumbers,
        displayBudgetTo: parsedValues.displayBudgetTo,
        talentsQuote: parsedValues.talentsQuote,
        otPayment: parsedValues.otPayment,
        ageMin: parsedValues.ageMin,
        ageMax: parsedValues.ageMax,
        heightMin: parsedValues.heightMin,
        heightMax: parsedValues.heightMax,
        category: Array.isArray(parsedValues.category)
          ? parsedValues.category.join(",")
          : parsedValues.category,
        requiredEthnicGroup: parsedValues.requiredEthnicGroup,
        skills: parsedValues.skills,
        questions: parsedValues.questions,
        isCastingRequired: parsedValues.isCastingRequired,
        isFittingRequired: parsedValues.isFittingRequired,
        isJobScheduleReady: parsedValues.isJobScheduleReady,
      },
      activities:
        values.activityScheduleLists && values.activityScheduleLists.length > 0
          ? values.activityScheduleLists.map((activity: any) => ({
              title: activity.title,
              type: activity.type,
              remarks: activity.remarks || "",
              schedules:
                activity.schedules && activity.schedules.length > 0
                  ? activity.schedules.map((schedule: any) => ({
                      location: schedule.location || "",
                      fromTime: schedule.fromTime || null,
                      toTime: schedule.toTime || null,
                    }))
                  : [],
            }))
          : [],
    }

    console.log("Sending create role request:", createRoleRequest)

    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRoleRequest),
    })

    const result = await response.json()
    if (response.ok) {
      console.log("Role created successfully:", result)
      return true
    } else {
      console.error("Failed to create role:", result)
      return false
    }
  } catch (error) {
    console.error("Error posting data:", error)
    return false
  }
}

export const updateRoleAndSchedules = async (
  roleid: string,
  parsedValues: any,
  values: any
) => {
  try {
    // Transform the data to match the new backend structure
    const updateRoleRequest = {
      role: {
        id: parseInt(roleid),
        projectId: parsedValues.projectId,
        requiredGender: parsedValues.requiredGender,
        roleTitle: parsedValues.roleTitle,
        roleDescription: parsedValues.roleDescription,
        paymentBasis: parsedValues.paymentBasis,
        budget: parsedValues.budget,
        talentNumbers: parsedValues.talentNumbers,
        displayBudgetTo: parsedValues.displayBudgetTo,
        talentsQuote: parsedValues.talentsQuote,
        otPayment: parsedValues.otPayment,
        ageMin: parsedValues.ageMin,
        ageMax: parsedValues.ageMax,
        heightMin: parsedValues.heightMin,
        heightMax: parsedValues.heightMax,
        category: Array.isArray(parsedValues.category)
          ? parsedValues.category.join(",")
          : parsedValues.category,
        requiredEthnicGroup: parsedValues.requiredEthnicGroup,
        skills: parsedValues.skills,
        questions: parsedValues.questions,
        isCastingRequired: parsedValues.isCastingRequired,
        isFittingRequired: parsedValues.isFittingRequired,
        isJobScheduleReady: parsedValues.isJobScheduleReady,
      },
      activities:
        values.activityScheduleLists && values.activityScheduleLists.length > 0
          ? values.activityScheduleLists.map((activity: any) => ({
              id: activity.id || null,
              roleId: parseInt(roleid),
              title: activity.title,
              type: activity.type,
              remarks: activity.remarks || "",
              schedules:
                activity.schedules && activity.schedules.length > 0
                  ? activity.schedules.map((schedule: any) => ({
                      id: schedule.id || null,
                      activityId: activity.id || null,
                      location: schedule.location || "",
                      fromTime: schedule.fromTime || null,
                      toTime: schedule.toTime || null,
                    }))
                  : [],
            }))
          : [],
    }

    console.log("Sending update role request:", updateRoleRequest)

    const response = await fetch(`${API_BASE_URL}/roles/${roleid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateRoleRequest),
    })

    const result = await response.json()
    if (response.ok) {
      console.log("Role updated successfully:", result)
      return true
    } else {
      console.error("Failed to update role:", result)
      return false
    }
  } catch (error) {
    console.error("Error updating data:", error)
    return false
  }
}

export const deleteRoleById = async (roleId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete the role")
    }

    console.log("Delete response:", response)
  } catch (error) {
    console.error("Error deleting role:", error)
    throw error // Rethrow the error for further handling if needed
  }
}
