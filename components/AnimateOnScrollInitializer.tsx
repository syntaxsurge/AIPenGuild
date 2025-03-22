'use client'

import { useEffect } from 'react'

import Aos from 'aos'

export function AnimateOnScrollInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Aos.init({
        easing: 'ease-out-quad',
        duration: 500,
      })
    }
  }, [])

  return null
}
