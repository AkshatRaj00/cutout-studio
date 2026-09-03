"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { 
  Upload, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  Loader2,
  SlidersHorizontal,
  Palette
} from "lucide-react";

const INK_PRESETS = [
  { name: "Black", hex: "#000000" },
  { name: "Blue", hex: "#0033aa" },
  { name: "Navy", hex: "#0f172a" },
];

const BG_PRESETS = [
  { name: "White", hex: "#ffffff" },
  { name: "Off-White", hex: "#f8fafc" },
];

export default function SignatureTacticalStudio() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  const [threshold, setThreshold] = useState<number>(145);
  const [contrastBoost, setContrastBoost] = useState<number>(40);
  const [targetKb, setTargetKb] = useState<number>(20);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [inkColor, setInkColor] = useState<string>("#000000");
  const [exporting, setExporting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [sourceUrl, processedUrl]);

  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const executeBinarization = useCallback(
    (
      img: HTMLImageElement,
      thresh: number,
      boost: number,
      bgHex: string,
      inkHex: string,
      transparent: boolean
    ) => {
      const targetWidth = 800;
      const targetHeight = Math.round((targetWidth / img.naturalWidth) * img.naturalHeight);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const d = imgData.data;

      const bgRgb = hexToRgb(bgHex);
      const inkRgb = hexToRgb(inkHex);

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance > thresh) {
          if (transparent) {
            d[i + 3] = 0;
          } else {
            d[i] = bgRgb.r;
            d[i + 1] = bgRgb.g;
            d[i + 2] = bgRgb.b;
            d[i + 3] = 255;
          }
        } else {
          const factor = Math.max(0, (thresh - luminance) / thresh);
          const inkIntensity = Math.min(1, factor * (1 + boost / 50));

          d[i] = Math.round(inkRgb.r * inkIntensity + bgRgb.r * (1 - inkIntensity));
          d[i + 1] = Math.round(inkRgb.g * inkIntensity + bgRgb.g * (1 - inkIntensity));
          d[i + 2] = Math.round(inkRgb.b * inkIntensity + bgRgb.b * (1 - inkIntensity));
          d[i + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        if (processedUrl) URL.revokeObjectURL(processedUrl);
        setProcessedUrl(URL.createObjectURL(blob));
      }, transparent ? "image/png" : "image/jpeg", 0.95);
    },
    [processedUrl]
  );

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    setSourceFile(file);
    setSourceUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      loadedImageRef.current = img;
      executeBinarization(img, threshold, contrastBoost, bgColor, inkColor, isTransparent);
    };
  };

  const reprocess = (
    newThresh = threshold,
    newBoost = contrastBoost,
    newBg = bgColor,
    newInk = inkColor,
    newTrans = isTransparent
  ) => {
    if (loadedImageRef.current) {
      executeBinarization(loadedImageRef.current, newThresh, newBoost, newBg, newInk, newTrans);
    }
  };

  const handleExport = async () => {
    if (!loadedImageRef.current) return;
    setExporting(true);

    const img = loadedImageRef.current;
    const targetWidth = 600;
    const targetHeight = Math.round((targetWidth / img.naturalWidth) * img.naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setExporting(false);
      return;
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const d = imgData.data;

    const bgRgb = hexToRgb(bgColor);
    const inkRgb = hexToRgb(inkColor);

    for (let i = 0; i < d.length; i += 4) {
      const luminance = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luminance > threshold) {
        if (isTransparent) {
          d[i + 3] = 0;
        } else {
          d[i] = bgRgb.r;
          d[i + 1] = bgRgb.g;
          d[i + 2] = bgRgb.b;
          d[i + 3] = 255;
        }
      } else {
        const factor = Math.max(0, (threshold - luminance) / threshold);
        const inkIntensity = Math.min(1, factor * (1 + contrastBoost / 50));

        d[i] = Math.round(inkRgb.r * inkIntensity + bgRgb.r * (1 - inkIntensity));
        d[i + 1] = Math.round(inkRgb.g * inkIntensity + bgRgb.g * (1 - inkIntensity));
        d[i + 2] = Math.round(inkRgb.b * inkIntensity + bgRgb.b * (1 - inkIntensity));
        d[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const mimeType = isTransparent ? "image/png" : "image/jpeg";

    if (mimeType === "image/png") {
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `signature-transparent.png`);
        setExporting(false);
      }, "image/png");
      return;
    }

    let minQ = 0.05;
    let maxQ = 0.98;
    let bestBlob: Blob | null = null;

    for (let i = 0; i < 7; i++) {
      const midQ = (minQ + maxQ) / 2;
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", midQ);
      });

      if (!blob) break;
      bestBlob = blob;
      const kb = blob.size / 1024;

      if (kb > targetKb) {
        maxQ = midQ;
      } else {
        minQ = midQ;
      }
    }

    if (bestBlob) {
      triggerDownload(bestBlob, `signature-compliant-${targetKb}kb.jpg`);
    }
    setExporting(false);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const resetStage = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setSourceFile(null);
    setSourceUrl(null);
    setProcessedUrl(null);
    loadedImageRef.current = null;
    setThreshold(145);
    setContrastBoost(40);
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 1080,
      margin: "0 auto",
      padding: "32px 20px 64px 20px",
      boxSizing: "border-box"
    }}>
      <style>{`
        .studio-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (min-width: 900px) {
          .studio-layout {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            align-items: start;
          }
        }
      `}</style>

      {/* Header Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 16,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: "12px",
          color: "#a1a1aa",
          marginBottom: 12,
          fontWeight: 500
        }}>
          <span>Official Document Utility</span>
        </div>
        <h1 style={{
          fontSize: "clamp(24px, 3.5vw, 32px)",
          fontWeight: 700,
          color: "#fafafa",
          margin: "0 0 8px 0",
          letterSpacing: "-0.02em"
        }}>
          Signature Cleaner &amp; Binarizer
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#a1a1aa", lineHeight: 1.6 }}>
          Remove camera shadows, paper grain, and export compliant files under 10KB–20KB for UPSC, SSC, and NTA forms.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
        }}
      />

      <div className="studio-layout">
        
        {/* Left Side: Upload / Canvas Preview */}
        <div style={{
          background: "#121316",
          border: "1px solid #27272a",
          borderRadius: 8,
          padding: 20,
          boxSizing: "border-box"
        }}>
          {!processedUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "1.5px dashed #3f3f46",
                backgroundColor: "#0d0e11",
                padding: "64px 20px",
                textAlign: "center",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                borderRadius: 6,
                transition: "border-color 0.2s ease"
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: "#18181b",
                border: "1px solid #27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f4f4f5"
              }}>
                <Upload size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: 4 }}>
                  Upload signature photo
                </div>
                <div style={{ fontSize: "12px", color: "#71717a" }}>
                  PNG, JPG, or WEBP taken from your smartphone
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14
              }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#d4d4d8" }}>
                  Preview Output
                </span>
                <button
                  type="button"
                  onClick={resetStage}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#a1a1aa",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5
                  }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
                background: isTransparent ? "transparent" : bgColor,
                backgroundImage: isTransparent ? `
                  linear-gradient(45deg, #18181b 25%, transparent 25%),
                  linear-gradient(-45deg, #18181b 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #18181b 75%),
                  linear-gradient(-45deg, transparent 75%, #18181b 75%)
                ` : "none",
                backgroundSize: "16px 16px",
                border: "1px solid #27272a",
                borderRadius: 6,
                minHeight: 240
              }}>
                <img
                  src={processedUrl}
                  alt="Processed Signature"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 200,
                    objectFit: "contain"
                  }}
                />
              </div>

              <div style={{
                marginTop: 14,
                fontSize: "12px",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <CheckCircle2 size={15} />
                Background neutralized and paper shadows removed.
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Controls Panel */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          opacity: processedUrl ? 1 : 0.45,
          pointerEvents: processedUrl ? "auto" : "none",
          transition: "opacity 0.2s ease"
        }}>
          
          {/* Card 1: Adjustments */}
          <div style={{
            background: "#121316",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: 20
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "13px",
              fontWeight: 600,
              color: "#fafafa",
              marginBottom: 16
            }}>
              <SlidersHorizontal size={15} />
              Adjustments
            </div>

            {/* Threshold Slider */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "12px", color: "#a1a1aa" }}>Shadow threshold</span>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#f4f4f5" }}>
                  {threshold}
                </span>
              </div>
              <input
                type="range"
                min="90"
                max="210"
                value={threshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setThreshold(val);
                  reprocess(val, contrastBoost, bgColor, inkColor, isTransparent);
                }}
                style={{ width: "100%", accentColor: "#f4f4f5", cursor: "pointer" }}
              />
            </div>

            {/* Contrast Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "12px", color: "#a1a1aa" }}>Ink thickness &amp; contrast</span>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#f4f4f5" }}>
                  +{contrastBoost}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={contrastBoost}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setContrastBoost(val);
                  reprocess(threshold, val, bgColor, inkColor, isTransparent);
                }}
                style={{ width: "100%", accentColor: "#f4f4f5", cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Card 2: Color Options */}
          <div style={{
            background: "#121316",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: 20
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "13px",
              fontWeight: 600,
              color: "#fafafa",
              marginBottom: 16
            }}>
              <Palette size={15} />
              Appearance
            </div>

            {/* Ink Color */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: "12px", color: "#a1a1aa", display: "block", marginBottom: 8 }}>
                Ink color
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {INK_PRESETS.map((ink) => {
                  const active = inkColor.toLowerCase() === ink.hex.toLowerCase();
                  return (
                    <button
                      key={ink.name}
                      type="button"
                      onClick={() => {
                        setInkColor(ink.hex);
                        reprocess(threshold, contrastBoost, bgColor, ink.hex, isTransparent);
                      }}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: active ? "#27272a" : "#18181b",
                        color: active ? "#ffffff" : "#a1a1aa",
                        border: `1px solid ${active ? "#52525b" : "#27272a"}`,
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      {ink.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <span style={{ fontSize: "12px", color: "#a1a1aa", display: "block", marginBottom: 8 }}>
                Background
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsTransparent(true);
                    reprocess(threshold, contrastBoost, bgColor, inkColor, true);
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    background: isTransparent ? "#27272a" : "#18181b",
                    color: isTransparent ? "#ffffff" : "#a1a1aa",
                    border: `1px solid ${isTransparent ? "#52525b" : "#27272a"}`,
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  Transparent
                </button>

                {BG_PRESETS.map((bg) => {
                  const active = !isTransparent && bgColor.toLowerCase() === bg.hex.toLowerCase();
                  return (
                    <button
                      key={bg.name}
                      type="button"
                      onClick={() => {
                        setIsTransparent(false);
                        setBgColor(bg.hex);
                        reprocess(threshold, contrastBoost, bg.hex, inkColor, false);
                      }}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: active ? "#27272a" : "#18181b",
                        color: active ? "#ffffff" : "#a1a1aa",
                        border: `1px solid ${active ? "#52525b" : "#27272a"}`,
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      {bg.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Export Limits */}
          <div style={{
            background: "#121316",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: 20
          }}>
            <span style={{ fontSize: "12px", color: "#a1a1aa", display: "block", marginBottom: 8 }}>
              Target file size
            </span>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[10, 20, 50].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setTargetKb(kb)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: targetKb === kb ? "#27272a" : "#18181b",
                    color: targetKb === kb ? "#ffffff" : "#71717a",
                    border: `1px solid ${targetKb === kb ? "#52525b" : "#27272a"}`,
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  &lt;{kb} KB
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!processedUrl || exporting}
              onClick={handleExport}
              style={{
                width: "100%",
                padding: "12px 0",
                background: "#fafafa",
                color: "#09090b",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: processedUrl && !exporting ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 6,
                transition: "opacity 0.2s ease"
              }}
            >
              {exporting ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Download size={16} />
              )}
              {exporting ? "Optimizing..." : `Download Signature (<${targetKb}KB)`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}