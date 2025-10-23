# 💬 Chatroom Page Implementation Guide - Complete Technical Breakdown

## 🎯 OVERVIEW
This document explains how the **Chatroom/Direct Messaging system** works - real-time WebSocket-based chat with pagination, message history, and live updates. This is the most complex feature, covering WebSocket connections, STOMP protocol, message queues, and real-time UI updates.

---

## 📂 FILE STRUCTURE

### Main Pages
- **Chatroom Page**: `/src/app/(home)/chatroom/[roompath]/page.tsx`
- Dynamic route for individual chat conversations

### Core Components
- **Chatroom**: `/src/components/socket/chatroom.tsx`
- Main chat interface component
- **MessageDisplay**: `/src/components/socket/message-display.tsx`
- Message list with pagination
- **MessageInput**: `/src/components/socket/message-input.tsx`
- Text input with emoji picker
- **MessageHeadBar**: `/src/components/socket/message-headbar.tsx`
- Chat header with user info
- **MessageRoomInfo**: `/src/components/socket/message-roomInfo.tsx`
- Sidebar with chat details

### WebSocket Services
- **ChatWebSocketService**: `/src/components/socket/ChatWebSocketService.ts`
- WebSocket connection manager using STOMP protocol
- Handles subscriptions, message sending, disconnection

### Custom Hooks
- **useChatroomMessagesQueries**: `/src/hooks/useChatroomMessagesQueries.ts`
- Fetches paginated message history
- **useChatWebSocket**: `/src/hooks/useChatWebSocket.ts`
- React wrapper for WebSocket service
- **useChatRoomState**: `/src/hooks/useChatRoomState.ts`
- State management for chat room

### API Services
- **Chatroom API**: `/src/app/api/apiservice/chatroom_api.ts`
- REST APIs for chatroom CRUD and message history

---

## 🔄 DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                 USER OPENS CHATROOM PAGE                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────────┐
         │  Extract username from URL           │
         │  /chatroom/[roompath]               │
         └─────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Fetch Chatroom Info  │
              │  getChatroomByUsername│
              └───────────────────────┘
                          │
                  ┌───────┴────────┐
                  │                │
                  ▼                ▼
           Chatroom Exists    New Chat
                  │                │
                  ▼                │
        ┌──────────────────┐      │
        │  Extract roomId  │      │
        │  Subscribe to    │      │
        │  WebSocket topic │      │
        └──────────────────┘      │
                  │                │
                  ▼                ▼
        ┌──────────────────────────────────┐
        │  Fetch Message History           │
        │  useChatroomMessagesQueries      │
        │  Paginated (10 messages/page)    │
        └──────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  Display Messages (oldest at top)   │
        │  Reverse chronological order        │
        └─────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  USER SENDS MESSAGE   │
              └───────────────────────┘
                          │
                  ┌───────┴────────┐
                  │                │
                  ▼                ▼
        New Chat? Create      Existing Chat
        Chatroom First        Use roomId
                  │                │
                  └────────┬───────┘
                           ▼
              ┌───────────────────────────────┐
              │  Send via WebSocket           │
              │  STOMP: /app/chat.send/{id}   │
              └───────────────────────────────┘
                          │
                          ▼
        ┌──────────────────────────────────────┐
        │  Server Broadcasts to /topic/{id}   │
        │  Both users receive message          │
        └──────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  Client Receives WebSocket Event    │
        │  Query Invalidation Triggered       │
        │  UI Updates Automatically           │
        └─────────────────────────────────────┘
```

---

## 🔌 1. WEBSOCKET CONNECTION

### ChatWebSocketService Overview

**File**: `/src/components/socket/ChatWebSocketService.ts`

**Technology Stack**:
- **Protocol**: STOMP (Simple Text Oriented Messaging Protocol)
- **Transport**: SockJS (WebSocket with fallback)
- **Library**: `@stomp/stompjs` + `sockjs-client`

### Connection Setup

```typescript
import { Client, Message } from "@stomp/stompjs"
import SockJS from "sockjs-client"

let client: Client | null = null
let isConnected = false
let roomSubscriptions: Map<string, any> = new Map()

const connect = (username: string, onConnected?: () => void) => {
  if (isConnected && client) {
    if (onConnected) onConnected()
    return
  }

  // Create SockJS connection (WebSocket with fallback)
  const socket = new SockJS("http://localhost:8080/ws")
  
  client = new Client({
    webSocketFactory: () => socket,
    debug: (str) => {
      console.log(str) // Optional: Enable for debugging
    },
    onConnect: () => {
      console.log("Chat WebSocket Connected")
      isConnected = true

      // Subscribe to general chat updates
      client?.subscribe("/topic/chat-updates", (message: Message) => {
        try {
          const notification: ChatNotification = JSON.parse(message.body)
          handleChatUpdate(notification)
        } catch (error) {
          console.error("Error parsing chat update:", error)
        }
      })

      // Add user to the system
      addUser(username)

      if (onConnected) onConnected()
    },
    onStompError: (frame) => {
      console.error("Chat WebSocket error: " + frame.headers["message"])
      isConnected = false
    },
    onWebSocketClose: () => {
      console.log("Chat WebSocket closed")
      isConnected = false
      roomSubscriptions.clear()
    },
  })
  
  client.activate()
}
```

### Key Concepts

#### A. SockJS
**Why?**:
- WebSocket with fallback support
- Works even if WebSocket is blocked
- Falls back to HTTP long-polling
- Better browser compatibility

#### B. STOMP Protocol
**Why?**:
- Simple, text-based messaging
- Supports pub/sub patterns
- Built-in routing
- Easy to debug

#### C. Connection Lifecycle
```
1. Create SockJS transport
2. Create STOMP client
3. Activate client
4. Connect to server
5. Subscribe to topics
6. Ready to send/receive messages
7. Disconnect when done
```

---

## 📨 2. MESSAGE SUBSCRIPTION

### Room-Specific Subscriptions

```typescript
const subscribeToRoom = (
  roomId: string,
  onMessageReceived: (notification: ChatNotification) => void
) => {
  if (!isConnected || !client) {
    console.error("Cannot subscribe to room: No active STOMP connection")
    return
  }

  const subscriptionKey = `room-${roomId}`

  // Unsubscribe if already subscribed (prevent duplicates)
  if (roomSubscriptions.has(subscriptionKey)) {
    roomSubscriptions.get(subscriptionKey).unsubscribe()
  }

  // Subscribe to room-specific topic
  const subscription = client.subscribe(
    `/topic/${roomId}`, // Topic format: /topic/{roomId}
    (message: Message) => {
      try {
        const chatMessage = JSON.parse(message.body)
        
        // Convert to notification format
        const notification: ChatNotification = {
          roomId: roomId,
          message: chatMessage,
          notificationType: "NEW_MESSAGE",
          timestamp: new Date().toISOString(),
        }
        
        onMessageReceived(notification)
      } catch (error) {
        console.error("Error parsing room message:", error)
      }
    }
  )

  roomSubscriptions.set(subscriptionKey, subscription)
  console.log(`Subscribed to room ${roomId}`)
}
```

### Topic Structure

**Format**: `/topic/{roomId}`

**Examples**:
- `/topic/room_abc123` - Individual chat room
- `/topic/room_xyz789` - Another chat room
- `/topic/chat-updates` - Global chat notifications

**How it works**:
- Server broadcasts messages to specific topic
- All subscribed clients receive the message
- Real-time, bidirectional communication

---

## 📤 3. SENDING MESSAGES

### Send Message Function

```typescript
const sendDirectMessage = (roomId: string, chatMessage: ChatMessage) => {
  if (!isConnected || !client) {
    console.error("Cannot send direct message: No active STOMP connection")
    return
  }
  
  client.publish({
    destination: `/app/chat.sendDirectMessage/${roomId}`,
    body: JSON.stringify(chatMessage),
  })
}
```

### Message Object Structure

```typescript
interface ChatMessage {
  roomId: string
  senderId: string
  receiverId?: string
  message: string
  media?: string | null
  replyTo?: number | null
  deletedByUser: boolean
  timestamp?: string | number
  readBy?: string | null
}
```

**Example**:
```json
{
  "roomId": "room_abc123",
  "senderId": "user_sender",
  "receiverId": "user_receiver",
  "message": "Hello! How are you?",
  "media": null,
  "replyTo": null,
  "deletedByUser": false,
  "readBy": null
}
```

### Message Flow

```
User types message → Click send
    ↓
Client: sendDirectMessage(roomId, messageData)
    ↓
WebSocket: Publish to /app/chat.sendDirectMessage/{roomId}
    ↓
Server: Receives message, saves to database
    ↓
Server: Broadcasts to /topic/{roomId}
    ↓
All subscribed clients receive message
    ↓
Client: onMessageReceived callback triggered
    ↓
Client: Query invalidation (refetch messages)
    ↓
UI updates with new message
```

---

## 💾 4. MESSAGE HISTORY & PAGINATION

### useChatroomMessagesQueries Hook

**File**: `/src/hooks/useChatroomMessagesQueries.ts`

```typescript
export const useChatroomMessagesQueries = ({
  roomId,
  pageSize = 10,
  sortDirection = "desc",
}: UseChatroomMessagesQueriesProps) => {
  const {
    data: messagesData,
    fetchNextPage: fetchNextMessages,
    hasNextPage: hasNextMessages,
    isFetchingNextPage: isFetchingNextMessages,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
    error: errorMessages,
    refetch: refetchMessages,
  } = useInfiniteQuery({
    queryKey: ["chatroomMessages", roomId, sortDirection],
    queryFn: async ({ pageParam = 0 }) => {
      if (!roomId) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: pageSize,
          number: 0,
          first: true,
          last: true,
          empty: true,
        }
      }
      
      const response = await getChatroomMessagesByRoomIdPaginated(
        roomId,
        pageParam,
        pageSize,
        sortDirection
      )
      
      return response
    },
    enabled: !!roomId && roomId !== "public",
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length - 1
      const loadedItems = allPages.reduce(
        (sum, page) => sum + (page.content?.length || 0),
        0
      )
      
      // Check if there are more items to load
      if (loadedItems < lastPage.totalElements) {
        return currentPage + 1
      }
      return undefined
    },
    initialPageParam: 0,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  })

  // Flatten all pages and REVERSE (oldest first, newest last)
  const messages: ChatMessage[] =
    messagesData?.pages.flatMap((page) => page.content || []).reverse() || []
  
  const totalMessages = messagesData?.pages[0]?.totalElements || 0

  return {
    messages,
    totalMessages,
    fetchNextMessages,
    hasNextMessages,
    isFetchingNextMessages,
    isLoadingMessages,
    isErrorMessages,
    errorMessages,
    refetchMessages,
  }
}
```

### API Endpoint

```
GET /api/chatroom-messages/room/{roomId}/paginated?page=0&size=10&sortDirection=desc
```

**Query Parameters**:
- `page` - Page number (0-indexed)
- `size` - Messages per page (10 recommended)
- `sortDirection` - "desc" (newest first from backend)

**Response Structure**:
```typescript
{
  content: [
    {
      id: 123,
      roomId: "room_abc",
      senderId: "user_sender",
      receiverId: "user_receiver",
      message: "Hello!",
      media: null,
      replyTo: null,
      deletedByUser: false,
      timestamp: "2025-10-22T14:30:00Z",
      readBy: null,
    }
  ],
  totalElements: 50, // Total messages in chat
  totalPages: 5,
  size: 10,
  number: 0, // Current page number
  first: true,
  last: false,
  empty: false,
}
```

### Message Order Reversal

**Why reverse?**:
- Backend returns newest first (`sortDirection=desc`)
- Chat UI shows oldest first (top), newest last (bottom)
- `.reverse()` flips the order

**Example**:
```typescript
// Backend returns (newest first):
[msg10, msg9, msg8, msg7, msg6]

// After .reverse() (oldest first):
[msg6, msg7, msg8, msg9, msg10]
```

---

## 🎨 5. CHATROOM COMPONENT

### Location
`/src/components/socket/chatroom.tsx`

### Component Structure

```typescript
export function Chatroom({ chatRoomState }: ChatroomProps) {
  const { soleUserId } = useSoleUserContext()
  const { firstSegment } = useAppContext()
  const queryClient = useQueryClient()
  const chatRoomUrl = usePathname().split("/").pop()

  const { roomId, setRoomId, currentContactPerson, sendRoomMessage } =
    chatRoomState

  // Fetch chatroom info
  const {
    data: chatroomInfo,
    error: chatroomInfoError,
    isLoading: chatroomInfoIsLoading,
  } = useQuery({
    queryKey: ["chatroomInfo", chatRoomUrl, soleUserId],
    queryFn: async () => {
      const result = await getChatroomByUsername(chatRoomUrl, soleUserId)
      if (result?.status === 204) {
        return null // No chatroom exists yet
      }
      return result
    },
    enabled: !!chatRoomUrl && !!soleUserId,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  // Fetch messages with pagination
  const {
    messages,
    fetchNextMessages,
    hasNextMessages,
    isFetchingNextMessages,
    refetchMessages,
  } = useChatroomMessagesQueries({
    roomId,
    pageSize: 10,
    sortDirection: "desc",
  })

  const [messageToSend, setMessageToSend] = useState<string>("")
  const [showPicker, setShowPicker] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    // Determine receiver ID
    let updatedReceiverId = null
    if (chatroomInfo?.UserInfo?.soleUserId || chatroomInfo?.userInfo?.soleUserId) {
      updatedReceiverId =
        chatroomInfo.UserInfo?.soleUserId || chatroomInfo.userInfo?.soleUserId
    } else if (currentContactPerson?.soleUserId) {
      updatedReceiverId = currentContactPerson.soleUserId
    } else {
      console.error("Cannot send message: no receiver information available")
      return
    }

    if (!messageToSend.trim() || !soleUserId) {
      return
    }

    // If chatroom doesn't exist, create it first
    if (!chatroomInfo || chatroomInfo.chatroom == null) {
      const formValue: CreateIndividualChatroomRequest = {
        senderId: soleUserId,
        receiverId: updatedReceiverId,
        roomName: null,
        type: "individual",
        createdAt: null,
        updatedAt: null,
      }

      try {
        const result = await createIndividualChatroom(formValue)
        if (result) {
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["contactList"] })
          queryClient.invalidateQueries({ queryKey: ["chatroomList"] })
          queryClient.invalidateQueries({ queryKey: ["chatroomInfo"] })

          const newRoomId = result.chatroom?.Id || result.chatroom?.id
          setRoomId(newRoomId)

          const chatMessage: ChatMessage = {
            roomId: newRoomId,
            senderId: soleUserId,
            receiverId: updatedReceiverId,
            message: messageToSend,
            media: null,
            readBy: null,
            replyTo: null,
            deletedByUser: false,
          }
          
          ChatWebSocketService.sendDirectMessage(newRoomId, chatMessage)
        }
      } catch (e) {
        console.log("Error creating chatroom: ", e)
        return
      }
    } else if (roomId) {
      // Existing chatroom - use the hook system
      sendRoomMessage(messageToSend.trim())
    }

    setMessageToSend("")
    setShowPicker(false)
    scrollToBottom()
  }

  // Set roomId when chatroomInfo loads
  useEffect(() => {
    if (chatroomInfo && chatroomInfo.chatroom != null) {
      const roomIdToSet = chatroomInfo.chatroom?.Id || chatroomInfo.chatroom?.id
      setRoomId(roomIdToSet)
    } else {
      setRoomId(null)
    }
  }, [chatroomInfo])

  return (
    <div className="flex">
      {chatroomInfo || currentContactPerson ? (
        <div className="fixed h-[90vh] w-full relative flex flex-col">
          <MessageHeadBar
            chatroomInfo={chatroomInfo}
            setRoomInfoOpen={setRoomInfoOpen}
            currentContactPerson={currentContactPerson}
          />

          {!chatroomInfo || chatroomInfo.chatroom == null ? (
            <div className="flex-grow overflow-y-auto mx-5 flex flex-col pt-[10vh]">
              <div className="text-center text-gray-500">
                Send Message to Start Conversation
              </div>
            </div>
          ) : (
            <MessageDisplay
              messages={messages}
              messagesEndRef={messagesEndRef}
              isAtBottom={isAtBottom}
              setIsAtBottom={setIsAtBottom}
              fetchNextMessages={fetchNextMessages}
              hasNextMessages={hasNextMessages}
              isFetchingNextMessages={isFetchingNextMessages}
            />
          )}

          {!isAtBottom && (
            <Button
              isIconOnly
              variant="faded"
              radius="full"
              className="absolute bottom-[10vh] right-2"
              onPress={scrollToBottom}
            >
              <ChevronsDown />
            </Button>
          )}

          <MessageInput
            showPicker={showPicker}
            setShowPicker={setShowPicker}
            handleSendMessage={handleSendMessage}
            messageToSend={messageToSend}
            setMessageToSend={setMessageToSend}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-[90vh] w-full">
          <div className="text-gray-500">Chatroom Not Found</div>
        </div>
      )}
    </div>
  )
}
```

### Key Features

#### A. New Chat Creation
- If chatroom doesn't exist (`chatroomInfo == null`)
- Creates chatroom on first message
- Assigns roomId
- Sends first message via WebSocket

#### B. Message Sending
- Validates message (not empty)
- Uses WebSocket for real-time delivery
- Updates UI via query invalidation

#### C. Scroll Behavior
- Auto-scrolls to bottom on new message
- Shows "scroll to bottom" button when scrolled up
- Smooth scrolling animation

---

## 📜 6. MESSAGE DISPLAY COMPONENT

### Infinite Scroll for Message History

```typescript
export function MessageDisplay({
  messages,
  messagesEndRef,
  isAtBottom,
  setIsAtBottom,
  fetchNextMessages,
  hasNextMessages,
  isFetchingNextMessages,
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Check if user is at bottom
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current
      const atBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsAtBottom(atBottom)
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-grow overflow-y-auto mx-5 flex flex-col"
    >
      {/* Load More Button (at top) */}
      {hasNextMessages && !isFetchingNextMessages && (
        <button
          onClick={() => fetchNextMessages()}
          className="text-center py-2 text-blue-500"
        >
          Load older messages
        </button>
      )}

      {isFetchingNextMessages && (
        <div className="text-center py-2">
          <Spinner size="sm" />
        </div>
      )}

      {/* Messages List */}
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id || index}
          message={msg}
          isOwn={msg.senderId === soleUserId}
        />
      ))}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}
```

### Message Bubble

```typescript
function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwn
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-black"
        }`}
      >
        <p>{message.message}</p>
        <span className="text-xs opacity-70">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
```

**Features**:
- Own messages: Right-aligned, blue background
- Other's messages: Left-aligned, gray background
- Timestamp below each message
- Max width 70% for readability

---

## 🛠️ 7. IMPLEMENTATION CHECKLIST

### Step 1: Set Up WebSocket Service
```typescript
- [ ] Install dependencies: @stomp/stompjs, sockjs-client
- [ ] Create ChatWebSocketService.ts
- [ ] Implement connect() function
- [ ] Implement subscribeToRoom() function
- [ ] Implement sendDirectMessage() function
- [ ] Implement disconnect() function
- [ ] Test WebSocket connection to server
```

### Step 2: Create API Functions
```typescript
- [ ] getChatroomByUsername(username, soleUserId)
- [ ] createIndividualChatroom(formData)
- [ ] getChatroomMessagesByRoomIdPaginated(roomId, page, size, sort)
- [ ] Test all API endpoints
```

### Step 3: Build Custom Hooks
```typescript
- [ ] useChatroomMessagesQueries (infinite query for messages)
- [ ] useChatWebSocket (React wrapper for WebSocket service)
- [ ] useChatRoomState (state management)
```

### Step 4: Create UI Components
```typescript
- [ ] MessageDisplay (message list with scroll)
- [ ] MessageInput (text input + emoji picker)
- [ ] MessageHeadBar (chat header)
- [ ] MessageBubble (individual message)
```

### Step 5: Build Main Chatroom Component
```typescript
- [ ] Set up chatroom info query
- [ ] Set up messages query with pagination
- [ ] Implement WebSocket subscription
- [ ] Handle new chat creation
- [ ] Handle message sending
- [ ] Implement scroll to bottom
```

### Step 6: Handle Real-Time Updates
```typescript
- [ ] Subscribe to room topic on mount
- [ ] Unsubscribe on unmount
- [ ] Invalidate queries on new message
- [ ] Update UI automatically
```

### Step 7: Error Handling
```typescript
- [ ] Handle WebSocket disconnection
- [ ] Handle message send failures
- [ ] Handle chatroom creation errors
- [ ] Show error messages to user
```

### Step 8: Testing
```typescript
- [ ] Test sending messages
- [ ] Test receiving messages (real-time)
- [ ] Test pagination (load older messages)
- [ ] Test new chat creation
- [ ] Test WebSocket reconnection
- [ ] Test on multiple devices/browsers
```

---

## 🔑 KEY TECHNICAL CONCEPTS

### 1. STOMP Protocol
**Simple Text Oriented Messaging Protocol**
- Text-based messaging
- Pub/Sub pattern
- Topics and queues
- Acknowledgments

### 2. SockJS
**WebSocket with Fallback**
- Primary: WebSocket
- Fallback 1: HTTP streaming
- Fallback 2: HTTP long-polling
- Fallback 3: HTTP polling

### 3. Query Invalidation Pattern
```typescript
// On new message received
queryClient.invalidateQueries({ queryKey: ["chatroomMessages"] })
```
**Result**: Automatic UI update

### 4. Reverse Chronological Order
```typescript
// Backend: Newest first
[msg10, msg9, msg8]

// Frontend: Oldest first
[msg8, msg9, msg10].reverse()
```

### 5. Optimistic UI Updates
- Show message immediately
- Send via WebSocket in background
- If fails, show error and remove

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: WebSocket Not Connecting
**Cause**: Server not running or CORS issue
**Solution**: 
- Check server is running on port 8080
- Verify WebSocket endpoint `/ws`
- Check CORS configuration

### Issue 2: Messages Not Appearing
**Cause**: Not subscribed to correct topic
**Solution**: 
- Verify roomId is correct
- Check subscription: `/topic/{roomId}`
- Ensure query invalidation is triggered

### Issue 3: Duplicate Messages
**Cause**: Multiple subscriptions to same room
**Solution**: 
- Unsubscribe before resubscribing
- Use subscription map to track

### Issue 4: Messages in Wrong Order
**Cause**: Not reversing backend response
**Solution**: 
- Backend returns desc (newest first)
- Frontend needs asc (oldest first)
- Use `.reverse()` after flattening

### Issue 5: Can't Send to New Chat
**Cause**: Chatroom not created before sending
**Solution**: 
- Create chatroom first
- Wait for roomId
- Then send message

---

## 📊 8. DATA MODEL

### ChatMessage
```typescript
{
  id: number,
  roomId: string,
  senderId: string,
  receiverId: string,
  message: string,
  media: string | null,
  replyTo: number | null,
  deletedByUser: boolean,
  timestamp: string,
  readBy: string | null,
}
```

### ChatroomInfo
```typescript
{
  chatroom: {
    id: string,
    roomName: string,
    type: "individual" | "group",
    createdAt: string,
    updatedAt: string,
  },
  UserInfo: {
    soleUserId: string,
    username: string,
    name: string,
    profilePic: string,
    bio: string,
  }
}
```

### ChatNotification
```typescript
{
  roomId: string,
  message: ChatMessage,
  notificationType: "NEW_MESSAGE" | "MESSAGE_DELETED" | "USER_TYPING",
  timestamp: string,
}
```

---

## 🚀 9. PERFORMANCE OPTIMIZATIONS

### A. Pagination
- Load 10 messages at a time
- Fetch more on scroll up
- Reduces initial load time

### B. Query Caching
```typescript
staleTime: 1000 * 30 // 30 seconds
```
- Messages cached for 30s
- Reduces API calls
- Faster UI updates

### C. WebSocket Keep-Alive
- Server sends heartbeat
- Detects disconnections
- Auto-reconnects

### D. Message Deduplication
- Track message IDs
- Ignore duplicate events
- Prevents UI glitches

---

## 📝 SUMMARY

### Core Features
1. **Real-Time Messaging**: WebSocket-based instant delivery
2. **Message History**: Paginated REST API for old messages
3. **New Chat Creation**: Dynamic chatroom creation
4. **Scroll Behavior**: Auto-scroll, manual scroll, load more
5. **Online Status**: See when user is connected
6. **Read Receipts**: Track message read status (optional)

### Architecture
- **Transport**: WebSocket (STOMP over SockJS)
- **Backend**: Spring Boot with WebSocket support
- **Frontend**: React with TanStack Query
- **State**: React hooks + Context API
- **Real-time**: Pub/Sub pattern with topics

### Data Flow
1. Connect WebSocket on app load
2. Subscribe to room topic
3. Fetch message history (paginated)
4. Display messages (oldest to newest)
5. User sends message → WebSocket
6. Server broadcasts → All clients
7. Clients receive → Query invalidation
8. UI updates automatically

### Best Practices
- Use STOMP for messaging
- Implement reconnection logic
- Cache queries appropriately
- Handle errors gracefully
- Optimize pagination
- Test on slow networks
- Monitor WebSocket health

---

**Document Created**: 2025-10-22  
**Version**: 1.0.0  
**Purpose**: Complete technical guide for implementing real-time WebSocket-based chat system with STOMP protocol



