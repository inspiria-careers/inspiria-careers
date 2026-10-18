"use client";
import React, { useState, useRef } from "react";
import { compressImage } from "@/lib/imageUtils";

interface ImageUploaderProps {
  label: string;
  currentValue?: string | null;
  currentUrl?: string | null;
  onUpload?: (dataUrl: string, file?: File) => void;
  onUploadComplete?: (dataUrl: string, file?: File) => void;
  onRemove?: () => void;
  folder?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  helpText?: string;
  helperText?: string;
  showAltField?: boolean;
  altValue?: string;
  onAltChange?: (alt: string) => void;
  aspectRatio?: "1/1" | "16/9" | "4/3" | "auto";
  compact?: boolean;
}

export default function ImageUploader({
  label,
  currentValue,
  currentUrl,
  onUpload,
  onUploadComplete,
  onRemove,
  folder: _folder,
  maxSizeMB = 2,
  acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  helpText,
  helperText,
  showAltField = false,
  altValue = "",
  onAltChange,
  aspectRatio: _aspectRatio = "auto",
  compact = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const displayValue = currentValue ?? currentUrl ?? null;
  const displayHelp = helpText || helperText || "";

  const handleUploadCallback = (dataUrl: string, file?: File) => {
    if (onUpload) onUpload(dataUrl, file);
    if (onUploadComplete) onUploadComplete(dataUrl, file);
  };

  const processFile = async (file: File) => {
    setErrorMsg("");

    // Validate mime type
    if (!acceptedTypes.includes(file.type)) {
      setErrorMsg(`Invalid file type. Supported formats: ${acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`);
      return;
    }

    // Validate size limit (before compression)
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes * 2) {
      setErrorMsg(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed before compression is ${maxSizeMB * 2} MB.`);
      return;
    }

    try {
      setProcessing(true);

      // SVG doesn't need canvas compression
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string;
          handleUploadCallback(res, file);
          setProcessing(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Compress client-side to ensure lightweight storage
      const processed = await compressImage(file, 1200, 0.85);
      handleUploadCallback(processed.dataUrl, file);
    } catch (err: any) {
      console.error("Image processing error:", err);
      setErrorMsg("Failed to process image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so the same file can be re-selected if needed
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: compact ? "0.75rem" : "1.25rem" }}>
      <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{label}</span>
        {maxSizeMB && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
            Max: {maxSizeMB} MB
          </span>
        )}
      </label>

      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: "0.5rem", fontSize: "0.85rem", padding: "0.5rem 0.75rem" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {displayValue ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.75rem",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
              width: compact ? "60px" : "100px",
              height: compact ? "60px" : "100px",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={displayValue}
              alt={altValue || label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: "180px" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                {processing ? "Processing..." : "Change Image"}
              </button>
              {onRemove && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={onRemove}
                  disabled={processing}
                >
                  Remove
                </button>
              )}
            </div>

            {showAltField && onAltChange && (
              <div style={{ marginTop: "0.5rem" }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.5rem" }}
                  placeholder="Alternative text for accessibility"
                  value={altValue}
                  onChange={(e) => onAltChange(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--brand-primary)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            padding: compact ? "1rem" : "1.75rem 1rem",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(var(--brand-primary-rgb, 15, 76, 129), 0.05)" : "var(--surface)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: compact ? "1.5rem" : "2rem", marginBottom: "0.25rem" }}>
            {processing ? "⏳" : "📤"}
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>
            {processing ? "Optimizing image..." : "Click to select or drag & drop"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {displayHelp || `${acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")} up to ${maxSizeMB} MB`}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
