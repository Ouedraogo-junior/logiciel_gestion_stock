'use client'
import { createContext, useContext, useState } from 'react'

type NavigationContextType = {
  navigating: boolean
  setNavigating: (v: boolean) => void
}

const NavigationContext = createContext<NavigationContextType>({
  navigating: false,
  setNavigating: () => {},
})

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [navigating, setNavigating] = useState(false)
  return (
    <NavigationContext.Provider value={{ navigating, setNavigating }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  return useContext(NavigationContext)
}