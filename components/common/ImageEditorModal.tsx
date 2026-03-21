"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { X, RotateCcw, RotateCw, Maximize2, Minus, FlipHorizontal, FlipVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  /** Image source: File (object URL) or URL string */
  source: File | string | null;
  /** Called with the edited image as File when user saves */
  onSave: (file: File) => void;
  /** Optional: suggested filename for the output */
  filename?: string;
  /** Optional: max output dimension (keeps aspect ratio) */
  maxOutputSize?: number;
  /** Optional: fixed aspect ratio (e.g. 16/9, 1 for square). Omit for free crop. */
  aspectRatio?: number;
}

export function ImageEditorModal({
  open,
  onClose,
  source,
  onSave,
  filename = "edited-image.png",
  maxOutputSize = 2048,
  aspectRatio,
}: ImageEditorModalProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (source instanceof File) {
      const u = URL.createObjectURL(source);
      setObjectUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setObjectUrl(null);
  }, [source]);

  const imageSrc = source
    ? typeof source === "string"
      ? source
      : objectUrl
    : null;

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSave = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper || !imageSrc) return;

    setSaving(true);
    try {
      const canvas = cropper.getCroppedCanvas({
        maxWidth: maxOutputSize,
        maxHeight: maxOutputSize,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!canvas) {
        setSaving(false);
        return;
      }

      const ext = filename.split(".").pop()?.toLowerCase() || "png";
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setSaving(false);
            return;
          }
          const file = new File([blob], filename, { type: mime });
          onSave(file);
          onClose();
        },
        mime,
        0.92
      );
    } finally {
      setSaving(false);
    }
  };

  const rotate = (deg: number) => {
    cropperRef.current?.cropper?.rotate(deg);
  };

  const scaleX = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const data = cropper.getData();
    cropper.scaleX(-(data.scaleX || 1));
  };

  const scaleY = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const data = cropper.getData();
    cropper.scaleY(-(data.scaleY || 1));
  };

  const zoom = (ratio: number) => {
    cropperRef.current?.cropper?.zoom(ratio);
  };

  const reset = () => {
    cropperRef.current?.cropper?.reset();
  };

  const modalContent = (
    <AnimatePresence>
      {open && source && (
        <motion.div
          key="image-editor-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Image editor"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Edit image</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-[300px] overflow-hidden">
              {imageSrc && (
                <Cropper
                  ref={cropperRef}
                  src={imageSrc}
                  style={{ height: "100%", width: "100%" }}
                  aspectRatio={aspectRatio}
                  guides={true}
                  viewMode={1}
                  dragMode="move"
                  autoCropArea={0.8}
                  restore={false}
                  rotatable={true}
                  scalable={true}
                  zoomable={true}
                  zoomOnTouch={true}
                  zoomOnWheel={true}
                  background={false}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 p-4 border-t border-white/10 bg-black/50">
              <button
                type="button"
                onClick={() => rotate(-90)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Rotate left"
              >
                <RotateCcw className="w-4 h-4" />
                Rotate L
              </button>
              <button
                type="button"
                onClick={() => rotate(90)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Rotate right"
              >
                <RotateCw className="w-4 h-4" />
                Rotate R
              </button>
              <button
                type="button"
                onClick={scaleX}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Flip horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
                Flip H
              </button>
              <button
                type="button"
                onClick={scaleY}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Flip vertical"
              >
                <FlipVertical className="w-4 h-4" />
                Flip V
              </button>
              <button
                type="button"
                onClick={() => zoom(0.1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Zoom in"
              >
                <Maximize2 className="w-4 h-4" />
                Zoom +
              </button>
              <button
                type="button"
                onClick={() => zoom(-0.1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Zoom out"
              >
                <Minus className="w-4 h-4" />
                Zoom -
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Reset"
              >
                Reset
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium transition-colors",
                  saving && "opacity-60 pointer-events-none"
                )}
              >
                {saving ? (
                  <>Saving…</>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save & Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
}
