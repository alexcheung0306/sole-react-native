"use client"

import { useEffect, useRef, useState } from "react"
import { useAppContext } from "@/context/AppContext"
import { useChatRoomContext } from "@/context/ChatRoomContext"
import { useSoleUserContext } from "@/context/SoleUserContext"
import { Button } from "@heroui/react"
import { useQuery } from "@tanstack/react-query"
import { ChevronsDown } from "lucide-react"

import {
  createIndividualChatroom,
  CreateIndividualChatroomRequest,
  getChatroomByUsername,
} from "@/app/api/apiservice/chatroom_api"

import { MessageDisplay } from "./message-display"
import { MessageHeadBar } from "./message-headbar"
import { MessageInput } from "./message-input"
import { MessageRoomInfo } from "./message-roomInfo"
import WebSocketService, { ChatMessage } from "./WebSocketService"

export function Chatroom() {
  const { soleUserId } = useSoleUserContext()
  const {
    chatroomInfo,
    chatroomInfoIsLoading,
    contactsRefetch,
    messages,
    roomId,
    setRoomId,
  } = useChatRoomContext()
  const { contextType } = useAppContext()
  const [receiverId, setReceiverId] = useState(null)
  const [messageToSend, setMessageToSend] = useState<string>("")
  const [roomInfoOpen, setRoomInfoOpen] = useState<Boolean>(false)
  const [showPicker, setShowPicker] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = () => {
    setReceiverId(chatroomInfo.userInfo.soleUserId)
    const updatedReceiverId = chatroomInfo.userInfo.soleUserId

    //TODO: useMutation
    if (chatroomInfo.chatroom == null && updatedReceiverId) {
      const formValue: CreateIndividualChatroomRequest = {
        senderId: soleUserId,
        receiverId: updatedReceiverId,
        roomName: null,
        type: "individual",
        createdAt: null,
        updatedAt: null,
      }
      try {
        const result = createIndividualChatroom(formValue)
        if (result) {
          contactsRefetch()
          console.log("Sucess Creating Individual Chatroom: ", result)
        }
      } catch (e) {
        console.log("Error: ", e)
        return
      }
    }

    if (messageToSend.trim() && soleUserId && roomId) {
      const chatMessage: ChatMessage = {
        roomId: roomId,
        senderId: soleUserId,
        receiverId: receiverId,
        message: messageToSend,
        media: null,
        readBy: null,
        replyTo: null,
        deletedByUser: false,
        timestamp: 0,
      }
      WebSocketService.sendDirectMessage(roomId, chatMessage)
      setMessageToSend("")
      setShowPicker(false)
    }
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    if (chatroomInfo && chatroomInfo.chatroom != null) {
      setRoomId(chatroomInfo.chatroom?.id) // Set the room ID once data is fetched
    } else {
      setRoomId(null)
    }
  }, [chatroomInfo])

  if (!soleUserId) {
    return <div>Loading user...</div>
  }

  if (chatroomInfoIsLoading) {
    return (
      <div className="flex ">
        <div className={`fixed h-[90vh] w-full relative flex flex-col`}>
          <MessageHeadBar
            chatroomInfo={chatroomInfo}
            setRoomInfoOpen={setRoomInfoOpen}
          />

          <div className="flex-grow overflow-y-auto mx-5 flex flex-col pt-[10vh]">
            Loading Chatroom Info
          </div>

          <MessageInput
            showPicker={showPicker}
            setShowPicker={setShowPicker}
            handleSendMessage={handleSendMessage}
            messageToSend={messageToSend}
            setMessageToSend={setMessageToSend}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex ">
      {chatroomInfo ? (
        <div className={`fixed h-[90vh] w-full relative flex flex-col`}>
          <MessageHeadBar
            chatroomInfo={chatroomInfo}
            setRoomInfoOpen={setRoomInfoOpen}
          />

          {chatroomInfo.chatroom == null ? (
            <div className="flex-grow overflow-y-auto mx-5 flex flex-col pt-[10vh]">
              Send Message to Start Conversation
            </div>
          ) : (
            <MessageDisplay
              messages={messages}
              messagesEndRef={messagesEndRef}
              isAtBottom={isAtBottom}
              setIsAtBottom={setIsAtBottom}
            />
          )}

          {!isAtBottom && (
            <Button
              isIconOnly
              variant="faded"
              radius="full"
              className="z-40 absolute bottom-[10vh] right-2 text-gray-500 bg-transparent/50 hover:bg-gray-200 p-2"
              onPress={() =>
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
              }
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
        <>Chatroom Not Found</>
      )}

      {roomInfoOpen && (
        <MessageRoomInfo
          chatroomInfo={chatroomInfo}
          setRoomInfoOpen={setRoomInfoOpen}
        />
      )}
    </div>
  )
}
