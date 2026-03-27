import { useEffect, useRef } from 'react'

export function useClickOutside(isActive, onOutside) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return undefined

    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onOutside()
      }
    }

    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [isActive, onOutside])

  return ref
}
