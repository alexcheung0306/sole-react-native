"use client"

import { useSoleUserContext } from "@/context/SoleUserContext"

import { useQuery } from "@tanstack/react-query"

import { getFollowingListByUsername } from "~/api/follow_api"

import { FollowButton } from "./follow-button"
import { getFollowerListByUsername } from "~/api/follow_api"
import { useState } from "react"
import { Skeleton } from "../ui/skeleton"
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalHeader } from "../ui/modal"
import { useRouter } from "expo-router"
import { View } from "react-native"

export default function FollowList({ username, isLoading, type }: { username: string, isLoading: boolean, type: string }) {
  const [showModal, setShowModal] = useState(false);

  console.log('username', username);
  const { data: followersData } = useQuery({
    queryKey: ["FollowerList", username],
    queryFn: async () => {
      const result = await getFollowerListByUsername(username)
      return result
    },
    enabled: !!username,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const { data: followingData } = useQuery({
    queryKey: ["FollowingList", username],
    queryFn: async () => {
      const result = await getFollowingListByUsername(username)
      return result
    },
    enabled: !!username,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  console.log("followingData", followingData)
  console.log("followersData", followersData)


  return (
    <>
      <div
        className="flex flex-col items-center cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <Skeleton className=" rounded-lg" isLoaded={!isLoading}>
          <h4 className="text-sm">
            {type == "follower" ? (followersData?.length):(followingData?.length)}
          </h4>
     
        </Skeleton>
        <Skeleton className=" rounded-lg" isLoaded={!isLoading}>
          {type == "follower" && "Follower"}
          {type == "following" && "Following"}
        </Skeleton>
      </div>

      <Modal
        key={type}
        className="fixed h-[80vh] m-auto"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <ModalBackdrop />

        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {type === "follower" && "Follower"}
            {type === "following" && "Following"}
          </ModalHeader>
          <ModalBody>
            {type === "follower" && (
              <div key="followerList">
                {followersData?.length > 0 ? (
                  followersData.map((follower: any) => (
                    <FollowListItem
                      key={follower.followRecord.id}
                      user={follower}
                      type={type}
                    />
                  ))
                ) : 0}
              </div>
            )}

            {type === "following" && (
              <div key="followingList">
                {followingData?.length > 0 ? (
                  followingData.map((following: any) => (
                    <FollowListItem
                      key={following.followRecord.id}
                      user={following}
                      type={type}
                    />
                  ))
                ) : 0}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
export const FollowListItem = ({ user, type }: { user: any, type: string }) => {
  const router = useRouter()
  const { soleUser } = useSoleUserContext()
  const isUser = user?.username === soleUser.username

  return (
    <div
      className={`flex justify-between items-center p-2 hover:bg-gray-400 m-0`}
    >
      {/* <User
        className="text-white"
        avatarProps={{}}
        description={<span className="text-white">{user?.name}</span>}
        name={
          <span
            onClick={() => router.push(`/user/${user?.username}`)}
            className="cursor-pointer text-white"
          >
            @{user?.username}
          </span>
        }
      /> */}
      {!isUser && (
        <FollowButton size="sm" username={user?.username} isUser={isUser} />
      )}
    </div>
  )
}
