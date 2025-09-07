

/////////////////////////////////////Chatroom/////////////////////////////////////

import { ChatMessage } from "../types/chat"
import { API_BASE_URL } from "./apiservice"

export interface CreateIndividualChatroomRequest {
  senderId: string
  receiverId: string
  roomName: string
  type: string
  createdAt: string
  updatedAt: string
}
export const createIndividualChatroom = async (formData:any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chatroom/individual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // Add this line
      },
      body: JSON.stringify(formData),
    })
    if (!response.ok) {
      throw new Error("Failed to create chatroom")
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating chatroom:", error)
    throw error
  }
}

export const getChatroomById = async (roomId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chatroom/roomId/${roomId}`,
      {}
    )
    if (!response.ok) {
      throw new Error("Failed to create comcard")
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error Getting Chatroom:", error)
    throw error
  }
}

export interface ChatroomInfo {
  roomname: string
  chatroom: {
    roomName: string
    type: "individual" | "group" // Assuming these are the possible types
    createdAt: string // ISO 8601 date string
    updatedAt: string // ISO 8601 date string
    id: string // Unique identifier for the chatroom
  }
  url: string // URL related to the chatroom
  userInfo: {
    id: number // Unique identifier for the user
    profilePic: string // URL or path to the profile picture
    name: string // User's name
    bio: string // User's bio
    category: string // User's category (could be a specific type or group)
    soleUserId: string // Unique identifier for the user in a different context
    bucket: string // Could refer to a storage or categorization bucket
    profilePicName: string // Name of the profile picture file
  }
}
//TODO: fetched when dm list click
export const getChatroomByUsername = async (receiverName: string, soleUserId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chatroom/individual/${receiverName}/${soleUserId}`,
      {}
    )
    if (!response.ok) {
      throw new Error("Response getting chatroom fail")
    }
    if (response.status == 204) {
      return response
    }
    const result: ChatroomInfo = await response.json()
    return result
  } catch (error) {
    console.error("Error Getting Chatroom:", error)
    throw error
  }
}

/////////////////////////////////////Chatroom User/////////////////////////////////////

export const createChatroomUser = async (formData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chatroom-user`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error("Failed to create chatroom user")
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating chatroom user:", error)
    throw error
  }
}

export const getAllChatroomBySoleUserId = async (soleUserId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chatroom-user/user/${soleUserId}`,
      {}
    )
    if (!response.ok) {
      throw new Error("Failed to get user's chatroom ")
    }
    if (response.status == 204) {
      return []
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error Getting user's chatroom:", error)
    throw error
  }
}

/////////////////////////////////////Chatroom Message/////////////////////////////////////

//TODO: fetched when dm list click
export const getChatroomMessagesByRoomId = async (roomId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chatroom-messages/room/${roomId}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch messages")
    }
    const previousMessages: ChatMessage[] = await response.json()

    return previousMessages
  } catch (error) {
    console.error("Error fetching previous messages:", error)
  }
}
