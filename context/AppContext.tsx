"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "expo-router"

interface AppContextType {
  contextType: string | null
  firstSegment: string
  appLoading: any
  setAppLoading: any
}
const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  const [appLoading, setAppLoading] = useState(false)
  const [contextType, setContextType] = useState<string | null>(null)

  const path = usePathname()
  useEffect(() => {
    if (path) {
      const firstSegment = path.split("/").filter(Boolean)[0]
      setContextType(firstSegment)
    
    }
  }, [path])

  return (
    <AppContext.Provider
      value={{
        contextType,
        firstSegment,
        appLoading,
        setAppLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
