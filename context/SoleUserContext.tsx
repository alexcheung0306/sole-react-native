"use client"

import { createContext, useContext, useEffect, useState } from "react"
// import { redirect, usePathname } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import WebSocketService from "~/components/socket/WebSocketService"

import { useAppContext } from "~/context/AppContext"
import { getSoleUserByClerkId } from "~/api/apiservice"

interface SoleUserContextType {
  //user search
  jobPagePjStatus: string
  setJobPagePjStatus: (status: string) => void
  jobPageCurrentProjectPage: number
  setJobPageCurrentProjectPage: (page: number) => void
  jobPageSearchAPI: string
  setJobPageSearchAPI: (API: string) => void
  jobPageIsSearching: boolean
  setJobPageIsSearching: (searching: boolean) => void
  jobPageSearchInputValue: string
  setJobPageSearchInputValue: (API: string) => void
  //client search
  manageProjectPagePjStatus: string
  setManageProjectPagePjStatus: (status: string) => void
  manageProjectPageCurrentProjectPage: number
  setManageProjectPageCurrentProjectPage: (page: number) => void
  manageProjectPageSearchAPI: string
  setManageProjectPageSearchAPI: (API: string) => void
  manageProjectPageIsSearching: boolean
  setManageProjectPageIsSearching: (searching: boolean) => void
  manageProjectPageSearchInputValue: string
  setManageProjectPageSearchInputValue: (API: string) => void
  //global data
  soleUserId: string | null
  soleUser: any
  clerkId: string | undefined
}
interface ChatMessage {
  content: string
  sender: string
  type: string
}
const SoleUserContext = createContext<SoleUserContextType | undefined>(
  undefined
)

export const SoleUserProvider = ({ children }: { children: React.ReactNode }) => {
  const { contextType } = useAppContext()
  const { user } = useUser()
  const [soleUserId, setSoleUserId] = useState(null)
  const clerkId = user?.id
  const {
    data: soleUser = [],
    refetch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["soleUser", clerkId],
    queryFn: async () => {
      const result = await getSoleUserByClerkId(clerkId as string)
      return result
    },
    enabled: !!clerkId && clerkId != undefined,
  })

  console.log('soleUser', soleUser);

  if (isError) {
    console.error("Error fetching user data:", error)
  }

  //user states
  const [jobPagePjStatus, setJobPagePjStatus] = useState("")
  const [jobPageCurrentProjectPage, setJobPageCurrentProjectPage] = useState(0)
  const [jobPageSearchAPI, setJobPageSearchAPI] = useState(
    `search?isPrivate=false&status=published&pageNo=${jobPageCurrentProjectPage}&pageSize=2&orderBy=id&orderSeq=dec`
  )
  const [jobPageIsSearching, setJobPageIsSearching] = useState(false)
  const [jobPageSearchInputValue, setJobPageSearchInputValue] = useState("")

  useEffect(() => {
    if (soleUser) {
      setSoleUserId(soleUser?.id)
      setJobPageSearchAPI(
        `search?isPrivate=false&status=published&pageNo=${jobPageCurrentProjectPage}&pageSize=2&orderBy=id&orderSeq=dec`
      )
    }
  }, [soleUser, jobPagePjStatus, jobPageCurrentProjectPage])

  //client states
  const [manageProjectPagePjStatus, setManageProjectPagePjStatus] = useState("")
  console.log("manageProjectPagePjStatusx", manageProjectPagePjStatus)
  const [
    manageProjectPageCurrentProjectPage,
    setManageProjectPageCurrentProjectPage,
  ] = useState(0)
  const [manageProjectPageSearchAPI, setManageProjectPageSearchAPI] =
    useState("")
  const [manageProjectPageIsSearching, setManageProjectPageIsSearching] =
    useState(false)
  const [
    manageProjectPageSearchInputValue,
    setManageProjectPageSearchInputValue,
  ] = useState("")

  // Handle client-level redirect
  // useEffect(() => {
  //   if (soleUser && contextType === "client" && soleUser.clientLevel == null) {
  //     redirect("/user")
  //   }
  // }, [soleUser, contextType])

  // Update search API when soleUser or other dependencies change
  useEffect(() => {
    if (soleUser && contextType === "client") {
      setSoleUserId(soleUser.id)
      setManageProjectPageSearchAPI(
        `${soleUser.id}?status=${manageProjectPagePjStatus}&pageNo=${manageProjectPageCurrentProjectPage}&pageSize=2&orderBy=id&orderSeq=dec`
      )
    }
  }, [
    soleUser,
    manageProjectPagePjStatus,
    manageProjectPageCurrentProjectPage,
    contextType,
  ])

  return (
    <SoleUserContext.Provider
      value={{
        // user search
        jobPagePjStatus,
        setJobPagePjStatus,
        jobPageCurrentProjectPage,
        setJobPageCurrentProjectPage,
        jobPageSearchAPI,
        setJobPageSearchAPI,
        jobPageIsSearching,
        setJobPageIsSearching,
        jobPageSearchInputValue,
        setJobPageSearchInputValue,
        // client search
        manageProjectPagePjStatus,
        setManageProjectPagePjStatus,
        manageProjectPageCurrentProjectPage,
        setManageProjectPageCurrentProjectPage,
        manageProjectPageSearchAPI,
        setManageProjectPageSearchAPI,
        manageProjectPageIsSearching,
        setManageProjectPageIsSearching,
        manageProjectPageSearchInputValue,
        setManageProjectPageSearchInputValue,
        //common value
        soleUserId,
        soleUser,
        clerkId,
      }}
    >
      {children}
    </SoleUserContext.Provider>
  )
}

export const useSoleUserContext = () => {
  const context = useContext(SoleUserContext)
  if (context === undefined) {
    throw new Error(
      "useSoleUserContext must be used within an SoleUserProvider"
    )
  }
  return context
}
