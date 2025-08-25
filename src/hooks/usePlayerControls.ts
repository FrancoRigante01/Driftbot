import { useEffect, useRef } from 'react'

export type PlayerKeys = {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  ArrowUp: boolean
  ArrowDown: boolean
  ArrowLeft: boolean
  ArrowRight: boolean
}

const initialKeys: PlayerKeys = {
  w: false,
  a: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
}

export function usePlayerControls() {
  const keys = useRef<PlayerKeys>({ ...initialKeys })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys.current) keys.current[e.key as keyof PlayerKeys] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys.current) keys.current[e.key as keyof PlayerKeys] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keys
} 