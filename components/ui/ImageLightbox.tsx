"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Props for the ImageLightbox component
 * @param images: array of image URLs
 * @param open: boolean controlling whether lightbox is shown
 * @param onClose: function to close the lightbox
 * @param startIndex: optional initial index to show
 */
interface ImageLightboxProps {
  images: string[];
  open: boolean;
  onClose: () => void;
  startIndex?: number;
}

/**
 * A minimal "lightbox" or modal component for displaying a set of images
 * with zoom, next/prev navigation, and a button to enter browser-native fullscreen.
 */
export default function ImageLightbox({
  images,
  open,
  onClose,
  startIndex = 0
}: ImageLightboxProps) {
  // The current index of the displayed image
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Zoom scale (1.0 = normal). We'll handle pinch/wheel for zoom.
  const [scale, setScale] = useState(1);

  // We'll store a ref to the lightbox overlay container for fullscreen requests
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep track if we are currently in fullscreen (derived from 'fullscreenchange' events).
  const [isFullscreen, setIsFullscreen] = useState(false);

  // When the lightbox first opens, reset the index to startIndex (or 0 if out of range)
  useEffect(() => {
    if (open) {
      // Lightbox is opening
      let validIndex = 0;
      if (startIndex >= 0 && startIndex < images.length) {
        validIndex = startIndex;
      }
      setCurrentIndex(validIndex);
      setScale(1);
    }
  }, [open, startIndex, images.length]);

  const handleNext = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => {
      if (prev === 0) return images.length - 1;
      return prev - 1;
    });
  }, [images.length]);

  const handleWheel = (e: React.WheelEvent) => {
    // Scroll up = zoom in, scroll down = zoom out
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.1, 5));
    } else {
      setScale((s) => Math.max(s - 0.1, 0.5));
    }
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.2, 5));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.2, 0.5));
  };

  // Listen for native fullscreen changes
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  }

  // Close on Esc key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, handleNext, handlePrev]);

  if (!open) return null;

  return (
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

        {/* Image Container */}
        <div
          className="relative flex cursor-grab items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          style={{
            width: isFullscreen ? "100%" : "90vw",
            height: isFullscreen ? "100%" : "90vh"
          }}
        >
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt="Lightbox Preview"
            className="object-contain object-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center"
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}