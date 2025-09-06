"use client"

import { useEffect, useState } from "react"
import { useSoleUserContext } from "@/context/SoleUserContext"
import { Button, ButtonText } from "../ui/button"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, Check } from "lucide-react-native"
import { getSingleFollowRecordByFollowerAndFollowingId, FollowRecord } from "~/api/follow_api"
import { createFollowRecord as apiCreateFollowRecord, updateFollowRecord as apiUpdateFollowRecord } from "~/api/follow_api"



export function FollowButton({ size, username, isUser }: { size: string, username: string, isUser: boolean }) {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const { soleUserId } = useSoleUserContext()

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

  const targetUsername = followData?.username

  const createFollowMutation = useMutation({
    mutationFn: (formData: FollowRecord) =>
      apiCreateFollowRecord(soleUserId as string, targetUsername as string, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["singleFollowData", targetUsername],
      })
      queryClient.invalidateQueries({
        queryKey: ["FollowerList", targetUsername],
      })
    },
    onError: (error) => {
      console.error("Error creating follow record:", error)
    },
  })

  const updateFollowMutation = useMutation({
    mutationFn: (formData: FollowRecord) =>
      apiUpdateFollowRecord(followData?.followRecord?.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["singleFollowData", targetUsername],
      })
      queryClient.invalidateQueries({
        queryKey: ["FollowerList", targetUsername],
      })
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

  return (
    <>
      {status === "no record" || status === "unfollowed" ? (
        <Button
          size={size}
          className={size == "md" ? `w-full` : "w-18"}
          onPress={handleFollowChange}
        >
          <ButtonText>Follow</ButtonText>
        </Button>
      ) : status === "following" ? (
        <Button
          size={size}
          className={size == "md" ? `w-full` : "w-18"}
          onPress={handleFollowChange}
        >
          <ButtonText>Following</ButtonText>
        </Button>
      ) : null}
    </>
  )
}
