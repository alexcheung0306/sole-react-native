import { useEffect, useRef, useState } from "react"
import { useChatRoomContext } from "@/context/ChatRoomContext"
import { useSoleUserContext } from "@/context/SoleUserContext"
import { ConvertTextToTags } from "@/utils/convert-text-to-tags"

export function MessageDisplay({
  messages,
  messagesEndRef,
  isAtBottom,
  setIsAtBottom,
}) {
  const { soleUserId } = useSoleUserContext()
  const [] = useState(true)

  useEffect(() => {
    // Scroll to the bottom without animation on the initial render
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages, messagesEndRef])

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    setIsAtBottom(scrollTop + clientHeight === scrollHeight)
  }
  return (
    <div
      className="flex-grow overflow-y-auto mx-5 flex flex-col pt-[10vh]"
      onScroll={handleScroll}
    >
      {messages && messages.length > 0 ? (
        <div className="flex-grow">
          {messages.map((msg, index) => {
            return (
              <div
                key={index}
                className={`flex ${
                  msg.senderId === soleUserId
                    ? "justify-end ml-36"
                    : "justify-start mr-36"
                } m-2`}
              >
                <div
                  className={`${
                    msg.senderId === soleUserId
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-300 text-black"
                  } p-1 border rounded-lg whitespace-pre-wrap`}
                >
                  <ConvertTextToTags text={msg.message} />
                </div>
              </div>
            )
          })}
          <div className="h-[5vh]" ref={messagesEndRef} />
        </div>
      ) : messages && messages.length == 0 ? (
        <div className="flex justify-center items-center flex-grow">
          No Messages
        </div>
      ) : null}
    </div>
  )
}
