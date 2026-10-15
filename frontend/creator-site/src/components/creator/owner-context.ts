import { createContext, useContext } from "react"

/** True when the visitor is signed in as the owner of the profile being viewed. */
export const OwnerContext = createContext(false)
export const useIsOwner = () => useContext(OwnerContext)
