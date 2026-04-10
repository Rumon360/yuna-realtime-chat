import { nanoid } from "nanoid"
import { useEffect, useState } from "react"

const ANIMALS = [
  "wolf",
  "fox",
  "cat",
  "dog",
  "bear",
  "lion",
  "tiger",
  "rabbit",
  "deer",
]

const STORAGE_KEY = "chat_username"

const generateUsername = () => {
  const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `anonymouse-${word}-${nanoid(5)}`
}

function useUsername() {
  const [username, setUsername] = useState("")

  useEffect(() => {
    const main = () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setUsername(stored)
        return
      }

      const generated = generateUsername()
      localStorage.setItem(STORAGE_KEY, generated)
      setUsername(generated)
    }
    main()
  }, [])

  return { username }
}

export default useUsername
