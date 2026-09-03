"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  Download,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Sparkles,
} from "lucide-react";

// Otsu's Algorithm: ऑटोमैटिक शैडो डिटेक्शन और पेपर क्लिनिंग
function computeOtsuThreshold(grayscaleData: Uint8Array): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayscaleData.length; i++) {
    histogram[grayscaleData[i]]++;
  }

  const total = grayscaleData.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histogram[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }
  return Math.min(210, Math.max(80, threshold + 15));
}

export default function LTIPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);

  // Transformations & Tuning
  const [zoom, setZoom] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [shadowThresh, setShadowThresh] = useState<number>(145);
  const [inkContrast, setInkContrast] = useState<number>(65);
  const [inkColor, setInkColor] = useState<"blue" | "black">("blue");
  const [fileSizeKB, setFileSizeKB] = useState<string>("0");

  // Dragging states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const renderCanvas = useCallback(
    (
      img: HTMLImageElement,
      currentZoom: number,
      currX: number,
      currY: number,
      thresh: number,
      contrast: number,
      colorMode: "blue" | "black"
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 400;

      // Pure white paper background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 + currX, canvas.height / 2 + currY);
      ctx.scale(currentZoom, currentZoom);

      const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawWidth = img.width * baseScale;
      const drawHeight = img.height * baseScale;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Rec. 601 Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > thresh) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          const adjusted = Math.min(255, Math.max(0, factor * (lum - 128) + 128));

          if (colorMode === "blue") {
            data[i] = Math.floor(adjusted * 0.05);
            data[i + 1] = Math.floor(adjusted * 0.22);
            data[i + 2] = Math.floor(adjusted * 0.68);
          } else {
            data[i] = Math.floor(adjusted * 0.08);
            data[i + 1] = Math.floor(adjusted * 0.08);
            data[i + 2] = Math.floor(adjusted * 0.08);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setFileSizeKB((blob.size / 1024).toFixed(1));
          }
        },
        "image/jpeg",
        0.88
      );
    },
    []
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compute Otsu threshold directly from image
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 160;
        tempCanvas.height = 160;
        const tempCtx = tempCanvas.getContext("2d");
        let autoThresh = 145;

        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0, 160, 160);
          const raw = tempCtx.getImageData(0, 0, 160, 160).data;
          const gray = new Uint8Array(160 * 160);
          for (let i = 0, j = 0; i < raw.length; i += 4, j++) {
            gray[j] = Math.round(0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]);
          }
          autoThresh = computeOtsuThreshold(gray);
        }

        setShadowThresh(autoThresh);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
        setSourceImg(img);
        setImageLoaded(true);

        // Instant canvas render on next frame
        requestAnimationFrame(() => {
          renderCanvas(img, 1, 0, 0, autoThresh, inkContrast, inkColor);
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (sourceImg && imageLoaded) {
      renderCanvas(sourceImg, zoom, offsetX, offsetY, shadowThresh, inkContrast, inkColor);
    }
  }, [sourceImg, imageLoaded, zoom, offsetX, offsetY, shadowThresh, inkContrast, inkColor, renderCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - offsetX, y: e.clientY - offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !sourceImg) return;
    setOffsetX(e.clientX - dragStartRef.current.x);
    setOffsetY(e.clientY - dragStartRef.current.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const downloadLTI = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `Official_LTI_Thumb_${inkColor.toUpperCase()}.jpg`;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        link.href = URL.createObjectURL(blob);
        link.click();
      },
      "image/jpeg",
      0.88
    );
  };

  return (
    <main
      style={{
        minHeight: "calc(100dvh - 75px)",
        backgroundColor: "#000000",
        color: "#ededed",
        padding: "32px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
            borderBottom: "1px solid #27272a",
            paddingBottom: 16,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  backgroundColor: "#111113",
                  color: "#a1a1aa",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid #27272a",
                  letterSpacing: "0.05em",
                }}
              >
                AUTONOMOUS LTI ENGINE
              </span>
              <span style={{ fontSize: "10px", color: "#71717a", display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={12} color="#22c55e" /> Zero Server Upload
              </span>
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px", color: "#ffffff" }}>
              LTI Thumb Impression Studio
            </h1>
            <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0" }}>
              Automatic Otsu-binarization, ridge enhancement, and official portal-compliant compression.
            </p>
          </div>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#a1a1aa",
              backgroundColor: "#111113",
              border: "1px solid #27272a",
              padding: "8px 14px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            ← Back to Studio
          </Link>
        </div>

        {/* Workspace Grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, alignItems: "start" }}
          className="studio-grid"
        >
          <style>{`
            @media (min-width: 860px) {
              .studio-grid {
                grid-template-columns: 1fr 380px !important;
              }
            }
          `}</style>

          {/* Canvas Viewport */}
          <div
            style={{
              backgroundColor: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 12,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: "440px",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 8px 30px rgba(0,0,0,0.8)",
            }}
          >
            {/* Canvas is always mounted to eliminate race conditions */}
            <div
              style={{
                display: imageLoaded ? "flex" : "none",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                width: "100%",
              }}
            >
              <div style={{ fontSize: "11px", color: "#a1a1aa", display: "flex", alignItems: "center", gap: 6 }}>
                <Move size={12} color="#ffffff" /> Drag to reposition • Auto-Binarized
              </div>

              <div
                style={{
                  padding: 8,
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  border: "1px solid #3f3f46",
                  cursor: isDragging ? "grabbing" : "grab",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    width: "280px",
                    height: "280px",
                    display: "block",
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* View Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#111113",
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #27272a",
                  }}
                >
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    style={{ background: "none", border: "none", color: "#ededed", cursor: "pointer", display: "flex" }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", minWidth: "32px", textAlign: "center" }}>
                    {zoom.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(3.0, zoom + 0.1))}
                    style={{ background: "none", border: "none", color: "#ededed", cursor: "pointer", display: "flex" }}
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    onClick={resetPosition}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#71717a",
                      cursor: "pointer",
                      display: "flex",
                      marginLeft: 6,
                    }}
                    title="Reset Position"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#ededed",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#111113",
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: "1px solid #27272a",
                  }}
                >
                  <Upload size={13} /> Replace Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                </label>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 600,
                    backgroundColor: "rgba(34,197,94,0.08)",
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  <CheckCircle2 size={13} /> Ready
                </div>
              </div>
            </div>

            {/* Upload Box (Visible only when no image is loaded) */}
            {!imageLoaded && (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  maxWidth: "360px",
                  height: "260px",
                  border: "2px dashed #27272a",
                  borderRadius: 12,
                  cursor: "pointer",
                  backgroundColor: "#111113",
                  padding: 24,
                  textAlign: "center",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    display: "grid",
                    placeItems: "center",
                    color: "#ededed",
                    marginBottom: 14,
                  }}
                >
                  <Upload size={20} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>
                  Upload Thumb Impression
                </span>
                <span style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.5 }}>
                  Drop photo on white paper. Instant background auto-clear.
                </span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {/* Controls Panel */}
          <div
            style={{
              backgroundColor: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 12,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              boxShadow: "0 8px 30px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
                borderBottom: "1px solid #27272a",
                paddingBottom: 10,
                letterSpacing: "0.02em",
              }}
            >
              <Sliders size={15} color="#a1a1aa" /> Binarization Parameters
            </div>

            {/* Ink Color Selector */}
            <div>
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#71717a",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 8,
                  letterSpacing: "0.05em",
                }}
              >
                1. Official Ink Tone
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                <button
                  onClick={() => setInkColor("blue")}
                  style={{
                    padding: "8px",
                    backgroundColor: inkColor === "blue" ? "#18181b" : "#111113",
                    border: `1px solid ${inkColor === "blue" ? "#ffffff" : "#27272a"}`,
                    color: inkColor === "blue" ? "#ffffff" : "#a1a1aa",
                    borderRadius: 6,
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Navy Blue (Default)
                </button>
                <button
                  onClick={() => setInkColor("black")}
                  style={{
                    padding: "8px",
                    backgroundColor: inkColor === "black" ? "#18181b" : "#111113",
                    border: `1px solid ${inkColor === "black" ? "#ffffff" : "#27272a"}`,
                    color: inkColor === "black" ? "#ffffff" : "#a1a1aa",
                    borderRadius: 6,
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Dark Black
                </button>
              </div>
            </div>

            {/* Shadow Slider */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#71717a",
                  marginBottom: 6,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={11} color="#eab308" /> Auto Threshold
                </span>
                <span style={{ color: "#ffffff" }}>{shadowThresh}</span>
              </div>
              <input
                type="range"
                min="80"
                max="220"
                step="2"
                value={shadowThresh}
                onChange={(e) => setShadowThresh(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
              />
            </div>

            {/* Contrast Slider */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#71717a",
                  marginBottom: 6,
                }}
              >
                <span>Ridge Density / Contrast</span>
                <span style={{ color: "#ffffff" }}>{inkContrast}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={inkContrast}
                onChange={(e) => setInkContrast(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
              />
            </div>

            {/* File Size Box */}
            <div
              style={{
                backgroundColor: "#111113",
                border: "1px solid #27272a",
                padding: "12px 14px",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", color: "#71717a", display: "block" }}>Government Portal Spec</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#d4d4d8" }}>Limit: 10KB - 50KB</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "#71717a", display: "block" }}>Output Size</span>
                <strong style={{ fontSize: "13px", color: parseFloat(fileSizeKB) > 50 ? "#ef4444" : "#22c55e" }}>
                  {fileSizeKB} KB
                </strong>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadLTI}
              disabled={!imageLoaded}
              style={{
                width: "100%",
                padding: "13px",
                backgroundColor: imageLoaded ? "#ffffff" : "#18181b",
                color: imageLoaded ? "#000000" : "#52525b",
                border: "none",
                borderRadius: 6,
                fontSize: "12px",
                fontWeight: 700,
                cursor: imageLoaded ? "pointer" : "not-allowed",
                letterSpacing: "0.02em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Download size={15} /> DOWNLOAD COMPLIANT LTI (.JPG)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}