'use client'

import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

/**
 * Props for the ImageLightbox component
 * @param images: array of image URLs
 * @param open: boolean controlling whether lightbox is shown
 * @param onClose: function to close the lightbox
 * @param startIndex: optional initial index to show
 */
interface ImageLightboxProps {
  images: string[]
  open: boolean
  onClose: () => void
  startIndex?: number
}

/**
 * A helper for Portal. This ensures the lightbox
 * is mounted at the top of <body>, avoiding stacking context issues.
 */
function LightboxPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === "undefined") {
    return null
  }

  return createPortal(children, document.body)
}

/**
 * A minimal "lightbox" or modal component for displaying a set of images
 * with a "fit to screen" approach for large images, plus wheel-based zoom.
 */
export default function ImageLightbox({
  images,
  open,
  onClose,
  startIndex = 0
}: ImageLightboxProps) {
  // The current index of the displayed image
  const [currentIndex, setCurrentIndex] = useState(startIndex)

  // fitScale is the scale needed to fit the entire image on the screen
  // zoomDelta is how much we zoom in/out relative to that baseline.
  const [fitScale, setFitScale] = useState(1)
  const [zoomDelta, setZoomDelta] = useState(1)

  // We'll store a reference to the container for fullscreen toggling
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep track of native fullscreen usage
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Reset index & scale on open
  useEffect(() => {
    if (open) {
      const validIndex = Math.min(Math.max(0, startIndex), images.length - 1)
      setCurrentIndex(validIndex)
      setFitScale(1)
      setZoomDelta(1)
    }
  }, [open, startIndex, images.length])

  // Next & previous navigation
  const handleNext = useCallback(() => {
    setFitScale(1)
    setZoomDelta(1)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrev = useCallback(() => {
    setFitScale(1)
    setZoomDelta(1)
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  // On wheel, we adjust zoomDelta (the user-defined factor above fitScale).
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      // wheel up => zoom in
      setZoomDelta((z) => Math.min(z + 0.1, 5))
    } else {
      // wheel down => zoom out
      setZoomDelta((z) => Math.max(z - 0.1, 0.2))
    }
  }

  const handleZoomIn = () => {
    setZoomDelta((z) => Math.min(z + 0.2, 5))
  }

  const handleZoomOut = () => {
    setZoomDelta((z) => Math.max(z - 0.2, 0.2))
  }

  // Listen for native fullscreen changes
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange)
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
      console.error("Error toggling fullscreen:", err)
    }
  }

  // Close on Esc key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "ArrowLeft") {
        handlePrev()
      }
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose, handleNext, handlePrev])

  if (!open) return null

  /**
   * We'll compute an onLoad callback so we can measure the image's natural dimension
   * and compute how to fit it on the screen by default. We'll store that in fitScale,
   * then the user can further zoom with zoomDelta.
   */
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    const screenW = window.innerWidth
    const screenH = window.innerHeight

    // We want to fit the entire image in the screen dimension, so compute ratio
    const fitW = screenW / naturalWidth
    const fitH = screenH / naturalHeight
    const candidateScale = Math.min(fitW, fitH)

    // If candidateScale >= 1, the image is smaller than screen, so scale is 1 (no upscaling).
    // Otherwise we use candidateScale.
    const finalFitScale = candidateScale >= 1 ? 1 : candidateScale

    setFitScale(finalFitScale)
    setZoomDelta(1)
  }

  // The effective scale is fitScale * zoomDelta
  const effectiveScale = fitScale * zoomDelta

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
          {/* Top-right Controls */}
          <div className="absolute top-4 right-4 z-[9999] flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
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
              aria-label="Close lightbox"
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

          {/* Scrollable container to allow panning if zoomed in */}
          <div
            className="relative flex h-full w-full cursor-grab items-center justify-center overflow-auto"
            onWheel={handleWheel}
          >
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt="Lightbox Preview"
              onLoad={handleImageLoad}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none max-w-none"
              style={{
                transform: `scale(${effectiveScale})`,
                transformOrigin: "center center"
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </LightboxPortal>
  )
}