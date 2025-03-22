'use client'

import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

/**
 * Props for the ImageLightbox component:
 * - images: array of image URLs
 * - open: whether the lightbox is visible
 * - onClose: function to close the lightbox
 * - startIndex: optional initial image index
 */
interface ImageLightboxProps {
  images: string[]
  open: boolean
  onClose: () => void
  startIndex?: number
}

/**
 * A helper for Portal usage. Renders children at top-level <body>.
 */
function LightboxPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(children, document.body)
}

/**
 * ImageLightbox:
 * 1) Fits large images to screen by default (downscales if needed).
 * 2) Allows wheel-based zoom in/out around that baseline (fitScale).
 * 3) Supports "click & drag" panning when zoomed in.
 * 4) Next/Prev arrows to browse multiple images.
 * 5) Optional native fullscreen toggle.
 */
export default function ImageLightbox({
  images,
  open,
  onClose,
  startIndex = 0
}: ImageLightboxProps) {

  // current index among images
  const [currentIndex, setCurrentIndex] = useState(startIndex)

  // the "fit scale" to show the entire image on screen
  const [fitScale, setFitScale] = useState(1)
  // additional zoom factor (user-controlled above/below fit)
  const [zoomDelta, setZoomDelta] = useState(1)

  // translation offsets for panning
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)

  // used for pointer drag logic
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // container ref for optional fullscreen
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // reset states when open changes or startIndex changes
  useEffect(() => {
    if (open) {
      const validIndex = Math.min(Math.max(0, startIndex), images.length - 1)
      setCurrentIndex(validIndex)
      setFitScale(1)
      setZoomDelta(1)
      setTranslateX(0)
      setTranslateY(0)
    }
  }, [open, startIndex, images.length])

  // Next / Prev
  const handleNext = useCallback(() => {
    setFitScale(1)
    setZoomDelta(1)
    setTranslateX(0)
    setTranslateY(0)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrev = useCallback(() => {
    setFitScale(1)
    setZoomDelta(1)
    setTranslateX(0)
    setTranslateY(0)
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  // handle zoom in/out
  function handleZoomIn() {
    setZoomDelta((z) => Math.min(z + 0.2, 5))
  }
  function handleZoomOut() {
    setZoomDelta((z) => Math.max(z - 0.2, 0.2))
  }

  // wheel-based zoom
  function handleWheel(e: React.WheelEvent) {
    if (e.deltaY < 0) {
      // zoom in
      setZoomDelta((z) => Math.min(z + 0.1, 5))
    } else {
      // zoom out
      setZoomDelta((z) => Math.max(z - 0.1, 0.2))
    }
  }

  // compute scale
  const effectiveScale = fitScale * zoomDelta

  // on image load, determine how to "fit" the image in the viewport
  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget
    const screenW = window.innerWidth
    const screenH = window.innerHeight

    const fitW = screenW / naturalWidth
    const fitH = screenH / naturalHeight
    const candidateScale = Math.min(fitW, fitH)

    const finalFit = candidateScale >= 1 ? 1 : candidateScale
    setFitScale(finalFit)
    setZoomDelta(1)
    setTranslateX(0)
    setTranslateY(0)
  }

  // pointer / mouse events for panning
  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    // only allow panning if we have scale > 1 or something?
    // but let's allow panning anyway. If scale=1 we won't see difference
    setIsPanning(true)
    panStartRef.current = { x: e.clientX, y: e.clientY }
    initialOffsetRef.current = { x: translateX, y: translateY }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!isPanning) return
    e.preventDefault()

    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y

    setTranslateX(initialOffsetRef.current.x + dx)
    setTranslateY(initialOffsetRef.current.y + dy)
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!isPanning) return
    e.preventDefault()
    setIsPanning(false)
  }

  // handle leaving the container => panning ends
  function onPointerLeave(e: React.PointerEvent) {
    if (!isPanning) return
    e.preventDefault()
    setIsPanning(false)
  }

  // handle ESC / arrow keys
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, handleNext, handlePrev])

  // handle native fullscreen changes
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
    }
  }, [])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }

  if (!open) return null

  return (
    <LightboxPortal>
      <AnimatePresence>
        <motion.div
          key="lightboxBackdrop"
          ref={containerRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Controls top-right */}
          <div className="absolute top-4 right-4 z-[9999] flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={handleZoomIn}
              className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 z-[9999] -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 z-[9999] -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* The container that allows wheel & drag/pan */}
          <div
            className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onWheel={handleWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
          >
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt="Lightbox Preview"
              onLoad={handleImageLoad}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                transform: `translate(${translateX}px, ${translateY}px) scale(${effectiveScale})`,
                transformOrigin: 'center center'
              }}
              className="max-w-none"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </LightboxPortal>
  )
}