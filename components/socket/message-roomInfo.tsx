import { useRouter } from "next/navigation"
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  User,
} from "@heroui/react"
import { X } from "lucide-react"

export function MessageRoomInfo({ chatroomInfo, setRoomInfoOpen }) {
  console.log("chatroomInfo,", chatroomInfo)
  const router = useRouter()
  return (
    <Card className="w-full h-[90vh] absolute md:static  border-l radius-0px z-20">
      <CardHeader className="flex gap-3">
        <X
          className="cursor-pointer text-white h-6 w-6 hover:text-gray-300"
          onClick={(e) => setRoomInfoOpen(false)}
        />

        <User
          className="text-white"
          avatarProps={{}}
          description={
            <span className="text-white">{chatroomInfo?.userInfo.name}</span>
          }
          name={
            <span
              onClick={() =>
                router.push(`/user/${chatroomInfo?.userInfo?.username}`)
              }
              className="cursor-pointer text-white"
            >
              @{chatroomInfo?.userInfo?.username}
            </span>
          }
        />
      </CardHeader>
      <Divider />
      <CardBody></CardBody>
      <Divider />
      <CardFooter>sad</CardFooter>
    </Card>
  )
}
