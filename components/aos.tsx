'use client'

import Aos from 'aos'
import { useEffect } from 'react'

export const AOSInit = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Aos.init({
        easing: 'ease-out-quad',
        duration: 500
      })
    }
  }, [])

  return null
}
