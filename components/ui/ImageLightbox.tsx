"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

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
 * with zoom, next/prev navigation, and optional "fullscreen-like" overlay.
 */
export default function ImageLightbox({
  images,
  open,
  onClose,
  startIndex = 0
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ensure currentIndex doesn't exceed image array length
  useEffect(() => {
    if (startIndex < 0 || startIndex >= images.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(startIndex);
    }
    setScale(1);
  }, [startIndex, images.length]);

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

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Close on Esc key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowRight") {
        handleNext();
      }
      if (e.key === "ArrowLeft") {
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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleZoomIn}
            className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-gray-800 p-2 text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Image Container */}
        <div
          className="relative overflow-hidden"
          style={{
            width: isFullscreen ? "100vw" : "90vw",
            height: isFullscreen ? "100vh" : "90vh"
          }}
          onWheel={handleWheel}
        >
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt="Preview"
            className="max-h-full max-w-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              scale: scale,
              transformOrigin: "center center"
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}