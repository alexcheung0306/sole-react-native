import { userInfo } from "os"
import { useRouter } from "next/navigation"
import { useChatRoomContext } from "@/context/ChatRoomContext"
import { User } from "@heroui/react"
import { ChevronLeft } from "lucide-react"

export function MessageHeadBar({ chatroomInfo, setRoomInfoOpen }) {
  const router = useRouter()
  const { messages, roomId } = useChatRoomContext()
  return (
    <div className="absolute h-[10vh] w-full z-10 border-b flex items-center bg-background/25 backdrop-blur-md">
      <div
        className="w-36 h-16  cursor-pointer flex justify-center items-center md:hidden text-white h-6 w-6 hover:text-gray-300"
        onClick={() => router.push("/chatroom")}
      >
        <ChevronLeft />
      </div>

      <div
        className="h-16 mx-2 md:mx-5 flex items-center cursor-pointer"
        onClick={() => setRoomInfoOpen(true)} // Updated this line
      >
        <User
          className="text-white text-xl"
          avatarProps={{}}
          description={
            <span className="text-white">{chatroomInfo?.roomname}</span>
          }
          name={<span className="text-white">{userInfo?.name}</span>}
        />
      </div>
    </div>
  )
}
