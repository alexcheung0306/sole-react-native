import { API_BASE_URL } from "./apiservice"

export const createComcard = async (formData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comcard`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error("Failed to create comcard")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}
// export const getComcardByID = async (id: number): Promise<any> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/comcard/${id}`)

//     if (!response.ok) {
//       throw new Error(`Error: ${response.statusText}`)
//     }

//     const result = await response.json()
//     return result // Return the fetched result
//   } catch (error) {
//     console.error("Error fetching comcard:", error)
//     throw error // Rethrow the error for further handling
//   }
// }
