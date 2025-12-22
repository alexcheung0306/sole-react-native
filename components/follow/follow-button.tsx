"use client"

import { useEffect, useState } from "react"
import { useSoleUserContext } from "@/context/SoleUserContext"
import { Button, ButtonText } from "../ui/button"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, Check } from "lucide-react-native"
import { getSingleFollowRecordByFollowerAndFollowingId, FollowRecord } from "~/api/follow_api"
import { createFollowRecord as apiCreateFollowRecord, updateFollowRecord as apiUpdateFollowRecord } from "~/api/follow_api"
import { useUser } from "@clerk/clerk-expo"
import { TouchableOpacity, Text } from "react-native"



export function FollowButton({soleUserId, size, username, isUser }: { soleUserId: string, size: string, username: string, isUser: boolean }) {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const { user } = useUser()
  const currentUsername = user?.username
 
  const queryClient = useQueryClient()
  const { data: followData } = useQuery({
    queryKey: ["singleFollowData", username],
    queryFn: () =>
      getSingleFollowRecordByFollowerAndFollowingId(soleUserId as string, username),
    enabled:
      !!soleUserId &&
      soleUserId != undefined &&
      !!username &&
      username != undefined &&
      isUser == false,
  })

  const createFollowMutation = useMutation({
    mutationFn: (formData: FollowRecord) =>
      apiCreateFollowRecord(soleUserId as string, username, formData),
    onSuccess: () => {
      // Invalidate follow data for the target user
      queryClient.invalidateQueries({
        queryKey: ["singleFollowData", username],
      })
      // Invalidate follower list for the target user (they gained a follower)
      queryClient.invalidateQueries({
        queryKey: ["FollowerList", username],
      })
      // Invalidate following list for the current user (they are following someone new)
      if (currentUsername) {
        queryClient.invalidateQueries({
          queryKey: ["FollowingList", currentUsername],
        })
      }
    },
    onError: (error) => {
      console.error("Error creating follow record:", error)
    },
  })

  const updateFollowMutation = useMutation({
    mutationFn: (formData: FollowRecord) =>
      apiUpdateFollowRecord(followData?.followRecord?.id, formData),
    onSuccess: () => {
      // Invalidate follow data for the target user
      queryClient.invalidateQueries({
        queryKey: ["singleFollowData", username],
      })
      // Invalidate follower list for the target user
      queryClient.invalidateQueries({
        queryKey: ["FollowerList", username],
      })
      // Invalidate following list for the current user
      if (currentUsername) {
        queryClient.invalidateQueries({
          queryKey: ["FollowingList", currentUsername],
        })
      }
    },
    onError: (error) => {
      console.error("Error updating follow record:", error)
    },
  })

  const handleFollowChange = () => {
    const isFollowing = status === "following"
    const formData = {
      status: isFollowing ? "unfollowed" : "following",
      collaborated: null,
      exclusiveContent: null,
      lastUpdate: null,
    }

    if (status === "no record") {
      createFollowMutation.mutate({
        ...formData,
        status: "following", // Ensure status is "following" for new records
        collaborated: false,
        exclusiveContent: false,
        lastUpdate: null,
      })
    } else {
      updateFollowMutation.mutate({
        ...formData,
        collaborated: false,
        exclusiveContent: false,
        lastUpdate: null,
      })
    }
  }

  useEffect(() => {
    if (followData) {
      if (!followData.followRecord) {
        setStatus("no record")
      } else {
        setStatus(followData.followRecord.status)
      }
    }
  }, [followData])

  const isLoading = createFollowMutation.isPending || updateFollowMutation.isPending

  // Use TouchableOpacity with original gray styling for profile page (size="md")
  if (size === "md") {
    return (
      <>
        {status === "no record" || status === "unfollowed" ? (
          <TouchableOpacity 
            className="flex-1 rounded-lg bg-gray-700 px-4 py-2"
            onPress={handleFollowChange}
            disabled={isLoading}
          >
            <Text className="text-center font-semibold text-white">
              {isLoading ? "..." : "Follow"}
            </Text>
          </TouchableOpacity>
        ) : status === "following" ? (
          <TouchableOpacity 
            className="flex-1 rounded-lg bg-gray-700 px-4 py-2"
            onPress={handleFollowChange}
            disabled={isLoading}
          >
            <Text className="text-center font-semibold text-white">
              {isLoading ? "..." : "Following"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </>
    )
  }

  // Use Button component for other sizes (original behavior)
  return (
    <>
      {status === "no record" || status === "unfollowed" ? (
        <Button
          size={size}
          className={size == "md" ? `w-full` : "w-18"}
          onPress={handleFollowChange}
          disabled={isLoading}
        >
          <ButtonText>{isLoading ? "..." : "Follow"}</ButtonText>
        </Button>
      ) : status === "following" ? (
        <Button
          size={size}
          className={size == "md" ? `w-full` : "w-18"}
          onPress={handleFollowChange}
          disabled={isLoading}
        >
          <ButtonText>{isLoading ? "..." : "Following"}</ButtonText>
        </Button>
      ) : null}
    </>
  )
}
