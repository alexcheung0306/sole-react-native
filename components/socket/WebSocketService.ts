import { Client, Message } from "@stomp/stompjs"
import SockJS from "sockjs-client"

let client: Client | null = null
let currentSubscription: any = null
let isConnected = false // Track connection status

export interface ChatMessage {
  roomId: string // Corresponds to 'room_id'
  senderId: string // Corresponds to 'sender_id'
  receiverId: string // Corresponds to 'receiver_id'
  message: string // Corresponds to 'message'
  media?: string // Corresponds to 'media', optional since it might not always be present
  replyTo?: number // Corresponds to 'reply_to', optional
  deletedByUser: boolean // Corresponds to 'deleted_by_user'
  timestamp: number // Corresponds to 'timestamp'
  readBy: string // Corresponds to 'read_by', assuming it's an array of user IDs
}

const enableSocketLogs = false

const connect = (
  username: string,
  roomId: string,
  onMessageReceived: (message: any) => void,
  onConnected?: () => void // Callback for when connection is established
) => {
  const socket = new SockJS("http://localhost:8080/ws")
  client = new Client({
    webSocketFactory: () => socket,
    debug: (str) => {
      enableSocketLogs && console.log(str)
    },
    onConnect: () => {
      enableSocketLogs && console.log("Connected")
      isConnected = true // Set connection status
      client?.subscribe(`/topic/${roomId}`, (message: Message) => {
        onMessageReceived(JSON.parse(message.body))
      })
      addUser(username)
      if (onConnected) onConnected() // Notify connection success
    },
    onStompError: (frame) => {
      enableSocketLogs &&
        console.error("Broker reported error: " + frame.headers["message"])
      isConnected = false
    },
    onWebSocketClose: () => {
      enableSocketLogs && console.log("WebSocket closed")
      isConnected = false
    },
  })
  client.activate()
}

const disconnect = () => {
  client?.deactivate()
  isConnected = false
}

const subscribeToRoom = (
  roomId: string,
  onMessageReceived: (message: any) => void
) => {
  if (!isConnected || !client) {
    enableSocketLogs &&
      console.error("Cannot subscribe: No active STOMP connection")
    return
  }
  // Unsubscribe from the previous room if it exists
  if (currentSubscription) {
    currentSubscription.unsubscribe()
  }
  // Subscribe to the new room
  currentSubscription = client.subscribe(
    `/topic/${roomId}`,
    (message: Message) => {
      onMessageReceived(JSON.parse(message.body))
    }
  )
  return `Topic - ${roomId}`
}

const sendMessage = (chatMessage: any) => {
  if (!isConnected || !client) {
    enableSocketLogs &&
      console.error("Cannot send message: No active STOMP connection")
    return
  }
  client.publish({
    destination: "/app/chat.sendMessage",
    body: JSON.stringify(chatMessage),
  })
}

const sendDirectMessage = (roomId: any, chatMessage: any) => {
  if (!isConnected || !client) {
    enableSocketLogs &&
      console.error("Cannot send direct message: No active STOMP connection")
    return
  }
  client.publish({
    destination: `/app/chat.sendDirectMessage/${roomId}`,
    body: JSON.stringify(chatMessage),
  })
}

const addUser = (chatMessage: any) => {
  if (!isConnected || !client) {
    enableSocketLogs &&
      console.error("Cannot add user: No active STOMP connection")
    return
  }
  client.publish({
    destination: "/app/chat.addUser",
    body: JSON.stringify(chatMessage),
  })
}

export default {
  connect,
  disconnect,
  sendMessage,
  sendDirectMessage,
  addUser,
  subscribeToRoom,
  isConnected: () => isConnected, // Expose connection status
}
