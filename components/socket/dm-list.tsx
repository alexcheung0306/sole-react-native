"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useChatRoomContext } from "@/context/ChatRoomContext"
import { useSoleUserContext } from "@/context/SoleUserContext"
import { Input, User } from "@heroui/react"
import { Search } from "lucide-react"

export default function DmList() {
  const router = useRouter()
  const [searching, setSearching] = useState(false)
  const [searchValue, setSearchValue] = useState(null)
  const { soleUserId } = useSoleUserContext()
  const {
    existingChatroom,
    contacts,
    currentContactPerson,
    setCurrentContactPerson,
    currentRoomId,
    setCurrentRoomId,
  } = useChatRoomContext()
  const contactPerson = contacts
    ?.map((contact) => ({
      soleUserId: contact.followRecord.followingId,
      username: contact.username,
      name: contact.name,
    }))
    .filter((contact) => contact.soleUserId !== soleUserId)

  const handleContactSelect = (contact: {
    soleUserId: string
    username: string
  }) => {
    setCurrentContactPerson(contact) // Set contact before navigating
    router.push(`/chatroom/${contact.username}`)
  }

  // Function to calculate similarity based on the number of occurrences of the substring
  function similarityScore(username, searchValue) {
    return (username.match(new RegExp(searchValue, "g")) || []).length
  }

  contacts?.sort((a, b) => {
    const scoreA = similarityScore(a.username, searchValue)
    const scoreB = similarityScore(b.username, searchValue)
    return scoreB - scoreA // Descending order
  })

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-zinc-900 h-[90vh]">
      {/* Search Contacts */}
      <div className="p-2">
        <Input
          isClearable
          radius="lg"
          classNames={{
            label: "text-black/50 dark:text-white/90",
            input: [
              "bg-transparent",
              "text-black/90 dark:text-white/90",
              "placeholder:text-default-700/50 dark:placeholder:text-white/60",
            ],
            innerWrapper: "bg-transparent",
            inputWrapper: [
              "shadow-xl",
              "bg-default-200/50",
              "dark:bg-default/60",
              "backdrop-blur-xl",
              "backdrop-saturate-200",
              "hover:bg-default-200/70",
              "dark:hover:bg-default/70",
              "group-data-[focus=true]:bg-default-200/50",
              "dark:group-data-[focus=true]:bg-default/60",
              "!cursor-text",
            ],
          }}
          placeholder="Search or Start new conversation"
          startContent={
            <Search className="pointer-events-none mb-0.5 shrink-0 text-black/50 dark:text-white/90" />
          }
          onChange={(e) => {
            setSearching(true)
            setSearchValue(e.target.value)
          }}
          onClear={() => setSearching(false)}
        />
      </div>

      {/* Search list */}
      {searching &&
        contactPerson &&
        contactPerson.map((person) => (
          <div
            className={`  flex items-center p-2 cursor-pointer  hover:bg-gray-400   
              ${
                currentContactPerson?.soleUserId == person.soleUserId
                  ? "bg-zinc-600"
                  : "bg-zinc-700"
              }`}
            onClick={() => {
              handleContactSelect(person)
            }}
            key={person.soleUserId}
          >
            <User
              className="text-white"
              avatarProps={{}}
              description={<span className="text-white">{person.name}</span>}
              name={<span className="text-white">@{person.username}</span>}
            />
          </div>
        ))}

      {/* room list */}
      {!searching &&
        existingChatroom &&
        existingChatroom !== 204 &&
        existingChatroom.map((room, index) => (
          <div
            key={index}
            className={`flex items-center p-2 cursor-pointer hover:bg-gray-400 ${
              currentRoomId === room.chatroom.id ? "bg-zinc-800" : "bg-zinc-900"
            }`}
            onClick={() => {
              router.push(`/chatroom/${room.url}`)
              setCurrentRoomId(room.chatroom.id)
            }}
          >
            <User
              className="text-white"
              avatarProps={{}}
              description={
                <span className="text-white">
                  {room.chatroom.type === "individual"
                    ? room.userInfos[0].name
                    : room.chatroom.roomName}
                </span>
              }
              name={
                room.chatroom.type === "individual" && (
                  <span className="text-white">
                    @{room.userInfos[0].username}
                  </span>
                )
              }
            />
          </div>
        ))}
    </div>
  )
}
