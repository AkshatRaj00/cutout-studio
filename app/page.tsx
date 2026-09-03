"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import confetti from "canvas-confetti";
import { isolateSubjectLocally } from "@/lib/engine";
import {
  generatePrintSheetBlob,
  type PrintSheetResult,
} from "@/lib/canvas-utils";
import {
  AlertTriangle,
  Check,
  Download,
  FileImage,
  Loader2,
  Move,
  Printer,
  RotateCcw,
  ShieldCheck,
  Upload,
  ZoomIn,
} from "lucide-react";

interface PortalPreset {
  id: string;
  name: string;
  sub: string;
  widthMm: number;
  heightMm: number;
  maxKb: number;
  defaultBg: string;
  requiresDop: boolean;
  printRecommended?: boolean;
}

const PORTAL_PRESETS: PortalPreset[] = [
  {
    id: "free",
    name: "Raw Isolation",
    sub: "Original aspect ratio • PNG",
    widthMm: 0,
    heightMm: 0,
    maxKb: 0,
    defaultBg: "transparent",
    requiresDop: false,
  },
  {
    id: "upsc",
    name: "UPSC / OTR",
    sub: "35 × 45 mm • Plain white",
    widthMm: 35,
    heightMm: 45,
    maxKb: 50,
    defaultBg: "#ffffff",
    requiresDop: true,
    printRecommended: true,
  },
  {
    id: "ssc",
    name: "SSC CGL / CHSL",
    sub: "35 × 45 mm • Light background",
    widthMm: 35,
    heightMm: 45,
    maxKb: 50,
    defaultBg: "#ffffff",
    requiresDop: true,
    printRecommended: true,
  },
  {
    id: "neet_pass",
    name: "NEET / JEE Passport",
    sub: "35 × 45 mm • Face framing",
    widthMm: 35,
    heightMm: 45,
    maxKb: 200,
    defaultBg: "#ffffff",
    requiresDop: true,
    printRecommended: true,
  },
  {
    id: "neet_post",
    name: "NEET Postcard",
    sub: "4 × 6 inch • 101.6 × 152.4 mm",
    widthMm: 101.6,
    heightMm: 152.4,
    maxKb: 300,
    defaultBg: "#ffffff",
    requiresDop: true,
  },
  {
    id: "pan",
    name: "PAN Card / NSDL",
    sub: "25 × 35 mm • 200 DPI",
    widthMm: 25,
    heightMm: 35,
    maxKb: 50,
    defaultBg: "#ffffff",
    requiresDop: false,
    printRecommended: true,
  },
  {
    id: "sarathi",
    name: "Driving License",
    sub: "35 × 45 mm • Under 50 KB",
    widthMm: 35,
    heightMm: 45,
    maxKb: 50,
    defaultBg: "#ffffff",
    requiresDop: false,
    printRecommended: true,
  },
  {
    id: "visa",
    name: "US / Schengen Visa",
    sub: "51 × 51 mm • 2 × 2 inch",
    widthMm: 51,
    heightMm: 51,
    maxKb: 240,
    defaultBg: "#ffffff",
    requiresDop: false,
    printRecommended: true,
  },
  {
    id: "ibps",
    name: "Banking / IBPS",
    sub: "35 × 45 mm • Under 50 KB",
    widthMm: 35,
    heightMm: 45,
    maxKb: 50,
    defaultBg: "#ffffff",
    requiresDop: false,
    printRecommended: true,
  },
];

const COLOR_PALETTE = [
  { name: "Pure White", hex: "#ffffff" },
  { name: "Soft White", hex: "#f8fafc" },
  { name: "Studio Grey", hex: "#e2e8f0" },
  { name: "Cool Grey", hex: "#cbd5e1" },
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Studio Blue", hex: "#004ce8" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Warm Cream", hex: "#fef3c7" },
  { name: "Mint", hex: "#dcfce7" },
  { name: "Embassy Red", hex: "#dc2626" },
];

const MM_PER_INCH = 25.4;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getFormattedCurrentDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `DOP: ${day}-${month}-${year}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";

    image.onload = async () => {
      try {
        if ("decode" in image) {
          await image.decode();
        }
      } catch {
        // Handled via standard onload
      }
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("The generated image could not be decoded."));
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Browser could not encode the generated image."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export default function CutoutTacticalStudio() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Waiting for image");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [customColor, setCustomColor] = useState("#ffffff");
  const [isTransparent, setIsTransparent] = useState(false);
  const [enableShadow, setEnableShadow] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<PortalPreset>(
    PORTAL_PRESETS[1]
  );

  const [scale, setScale] = useState(1.12);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [showBiometricGuide, setShowBiometricGuide] = useState(true);
  const [applyStamp, setApplyStamp] = useState(true);
  const [candidateName, setCandidateName] = useState("CANDIDATE NAME");
  const [photoDate, setPhotoDate] = useState(getFormattedCurrentDate());
  const [targetKb, setTargetKb] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const resultUrlRef = useRef<string | null>(null);

  const isRawPreset = selectedPreset.id === "free";
  const hasPhysicalDimensions =
    selectedPreset.widthMm > 0 && selectedPreset.heightMm > 0;

  const canGeneratePrintSheet =
    hasPhysicalDimensions &&
    selectedPreset.widthMm <= 51 &&
    selectedPreset.heightMm <= 51;

  const photoRatio = useMemo(() => {
    if (!hasPhysicalDimensions) return 35 / 45;
    return selectedPreset.widthMm / selectedPreset.heightMm;
  }, [hasPhysicalDimensions, selectedPreset.heightMm, selectedPreset.widthMm]);

  const releaseResultUrl = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => releaseResultUrl();
  }, [releaseResultUrl]);

  useEffect(() => {
    if (!loading) return;

    let frameId = 0;
    let simulatedProgress = 0;

    const animateProgress = () => {
      setProgress((actualProgress) => {
        simulatedProgress = Math.max(simulatedProgress, actualProgress);
        if (simulatedProgress < 92) {
          simulatedProgress += Math.max(0.15, (92 - simulatedProgress) * 0.018);
        }
        return Math.max(actualProgress, Math.round(simulatedProgress));
      });
      frameId = window.requestAnimationFrame(animateProgress);
    };

    frameId = window.requestAnimationFrame(animateProgress);
    return () => window.cancelAnimationFrame(frameId);
  }, [loading]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    if (!(blob instanceof Blob)) {
      throw new Error("Generated file is invalid.");
    }

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1500);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  }, []);

  const resetTransform = useCallback(() => {
    setScale(1.12);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleProcess = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Only image files are supported. Use JPG, PNG, or WebP.");
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage("Please choose an image smaller than 15 MB.");
        return;
      }

      setErrorMessage(null);
      setSourceFile(file);
      releaseResultUrl();
      setResultUrl(null);

      setLoading(true);
      setProgress(1);
      setProgressLabel("Preparing image for local AI");

      try {
        const blob = await isolateSubjectLocally(file, ({ key, percent }) => {
          setProgress(percent);
          setProgressLabel(
            key === "compute:inference"
              ? "Separating subject from background"
              : key === "fetch"
                ? "Loading local AI model"
                : "Processing image locally"
          );
        });

        if (!(blob instanceof Blob)) {
          throw new Error("Background processor returned an invalid image.");
        }

        setProgress(96);
        setProgressLabel("Finalising transparent cutout");

        const nextResultUrl = URL.createObjectURL(blob);
        await loadImage(nextResultUrl);

        releaseResultUrl();
        resultUrlRef.current = nextResultUrl;
        setResultUrl(nextResultUrl);

        setProgress(100);
        setProgressLabel("Cutout ready");
        resetTransform();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Local background removal failed unexpectedly.";

        console.error("[CUTOUT] Local inference error:", error);
        setErrorMessage(
          `Background removal failed: ${message}. Open the browser console for details.`
        );
        setSourceFile(null);
        releaseResultUrl();
        setResultUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [releaseResultUrl, resetTransform]
  );

  const handlePresetSelect = (preset: PortalPreset) => {
    setSelectedPreset(preset);

    const wantsTransparent = preset.defaultBg === "transparent";
    setIsTransparent(wantsTransparent);

    if (!wantsTransparent) {
      setCustomColor(preset.defaultBg);
    }

    setApplyStamp(preset.requiresDop);

    if (preset.maxKb > 0) {
      setTargetKb(preset.maxKb);
    }

    setShowBiometricGuide(preset.widthMm > 0);
    resetTransform();
  };

  const handleStartPan = (clientX: number, clientY: number) => {
    setIsPanning(true);
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  const handleMovePan = (clientX: number, clientY: number) => {
    if (!isPanning) return;
    setPosition({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    });
  };

  const handleEndPan = () => {
    setIsPanning(false);
  };

  const renderCompositeCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!resultUrl || !previewBoxRef.current) return null;

    const image = await loadImage(resultUrl);
    const previewRect = previewBoxRef.current.getBoundingClientRect();

    if (previewRect.width <= 0 || previewRect.height <= 0) {
      throw new Error("Preview dimensions are not ready. Try again in a moment.");
    }

    const outputDpi = selectedPreset.id === "pan" ? 200 : 300;

    const canvasWidth = hasPhysicalDimensions
      ? Math.round((selectedPreset.widthMm / MM_PER_INCH) * outputDpi)
      : image.naturalWidth;

    const canvasHeight = hasPhysicalDimensions
      ? Math.round((selectedPreset.heightMm / MM_PER_INCH) * outputDpi)
      : image.naturalHeight;

    if (canvasWidth <= 0 || canvasHeight <= 0) {
      throw new Error("Invalid output image dimensions.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Canvas rendering is not available in this browser.");
    }

    if (isTransparent) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = customColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const scaleX = canvasWidth / previewRect.width;
    const scaleY = canvasHeight / previewRect.height;

    const uiBaseWidth = previewRect.width;
    const uiBaseHeight = previewRect.width * (image.naturalHeight / image.naturalWidth);

    const finalBaseWidth = uiBaseWidth * scaleX;
    const finalBaseHeight = uiBaseHeight * scaleY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.clip();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (enableShadow && !isTransparent) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = Math.round(12 * scaleX);
      ctx.shadowOffsetY = Math.round(6 * scaleY);
    }

    ctx.translate(canvasWidth / 2 + position.x * scaleX, canvasHeight + position.y * scaleY);
    ctx.scale(scale, scale);
    ctx.drawImage(
      image,
      -finalBaseWidth / 2,
      -finalBaseHeight,
      finalBaseWidth,
      finalBaseHeight
    );
    ctx.restore();

    if (applyStamp && hasPhysicalDimensions && !isRawPreset) {
      const stampHeight = Math.round(canvasHeight * 0.155);
      const stampY = canvasHeight - stampHeight;

      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, stampY, canvasWidth, stampHeight);

      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = Math.max(1, Math.round(canvasWidth * 0.003));
      ctx.strokeRect(0, stampY, canvasWidth, stampHeight);

      ctx.fillStyle = "#09090b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const safeName = candidateName.trim().slice(0, 42) || "CANDIDATE NAME";
      const safeDate = photoDate.trim().slice(0, 36) || "DOP";

      const nameFontSize = Math.max(10, Math.round(stampHeight * 0.33));
      const dateFontSize = Math.max(8, Math.round(stampHeight * 0.23));

      ctx.font = `700 ${nameFontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.fillText(safeName.toUpperCase(), canvasWidth / 2, stampY + stampHeight * 0.36);

      ctx.font = `600 ${dateFontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.fillText(safeDate.toUpperCase(), canvasWidth / 2, stampY + stampHeight * 0.74);
      ctx.restore();
    }

    return canvas;
  }, [
    applyStamp,
    candidateName,
    customColor,
    enableShadow,
    hasPhysicalDimensions,
    isRawPreset,
    isTransparent,
    photoDate,
    position.x,
    position.y,
    resultUrl,
    scale,
    selectedPreset.id,
    selectedPreset.widthMm,
    selectedPreset.heightMm,
  ]);

  const handleExport = async () => {
    try {
      setErrorMessage(null);
      const canvas = await renderCompositeCanvas();
      if (!canvas) {
        throw new Error("No processed cutout is ready to export.");
      }

      const shouldExportPng = isTransparent || isRawPreset || targetKb <= 0;

      if (shouldExportPng) {
        const blob = await canvasToBlob(canvas, "image/png");
        downloadBlob(blob, `cutout-${selectedPreset.id}.png`);
        return;
      }

      let low = 0.1;
      let high = 0.98;
      let bestUnderLimit: Blob | null = null;
      let smallestBlob: Blob | null = null;

      for (let index = 0; index < 9; index++) {
        const quality = (low + high) / 2;
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);

        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
        }

        const kb = blob.size / 1024;
        if (kb <= targetKb) {
          bestUnderLimit = blob;
          low = quality;
        } else {
          high = quality;
        }
      }

      const outputBlob = bestUnderLimit ?? smallestBlob;
      if (!outputBlob) {
        throw new Error("JPEG export could not be generated.");
      }

      if (outputBlob.size / 1024 > targetKb) {
        setErrorMessage(
          `The image could not reach the selected ${targetKb} KB limit without extreme quality loss. The smallest possible file was downloaded.`
        );
      }

      downloadBlob(outputBlob, `cutout-${selectedPreset.id}-${targetKb}kb.jpg`);
    } catch (error) {
      console.error("[CUTOUT] Single export failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Could not export the compliant image."
      );
    }
  };

  const handleExportPrintSheet = async () => {
    if (!canGeneratePrintSheet) {
      setErrorMessage(
        "This preset is too large for an 8-photo 4×6 print sheet. Use normal download."
      );
      return;
    }

    try {
      setSheetLoading(true);
      setErrorMessage(null);

      const singleCanvas = await renderCompositeCanvas();
      if (!singleCanvas) {
        throw new Error("No processed cutout is ready for the print sheet.");
      }

      const singleBlob = await canvasToBlob(singleCanvas, "image/png");
      const singleUrl = URL.createObjectURL(singleBlob);

      try {
        const singleImage = await loadImage(singleUrl);

        const sheet: PrintSheetResult = await generatePrintSheetBlob({
          sourceImage: singleImage,
          photoWidthMm: selectedPreset.widthMm,
          photoHeightMm: selectedPreset.heightMm,
        });

        downloadBlob(sheet.blob, sheet.filename);
      } finally {
        URL.revokeObjectURL(singleUrl);
      }
    } catch (error) {
      console.error("[CUTOUT] Print sheet failed:", error);
      setErrorMessage(
        error instanceof Error ? `Print sheet failed: ${error.message}` : "Print sheet generation failed."
      );
    } finally {
      setSheetLoading(false);
    }
  };

  const resetStage = () => {
    releaseResultUrl();
    setSourceFile(null);
    setResultUrl(null);
    setProgress(0);
    setProgressLabel("Waiting for image");
    setErrorMessage(null);
    resetTransform();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 1140,
      margin: "0 auto",
      padding: "32px 20px 64px 20px",
      boxSizing: "border-box"
    }}>
      <style>{`
        .passport-studio-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (min-width: 960px) {
          .passport-studio-layout {
            display: grid;
            grid-template-columns: 1fr 340px;
            align-items: start;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
          <ShieldCheck size={14} color="#10b981" />
          <span>Local processing · No server upload</span>
        </div>
        <h1 style={{
          fontSize: "clamp(24px, 3.5vw, 32px)",
          fontWeight: 700,
          color: "#fafafa",
          margin: "0 0 8px 0",
          letterSpacing: "-0.02em"
        }}>
          Passport &amp; Government Form Studio
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#a1a1aa", lineHeight: 1.6 }}>
          Remove background locally, tune biometric framing, and export compliant files under official KB limits or generate 4×6 print sheets.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 16px",
          borderRadius: 6,
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#fca5a5",
          fontSize: "13px",
          marginBottom: 20
        }}>
          <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleProcess(f);
        }}
      />

      <div className="passport-studio-layout">

        {/* Left Side: Upload / Canvas Workspace */}
        <div style={{
          background: "#121316",
          border: "1px solid #27272a",
          borderRadius: 8,
          padding: 20,
          boxSizing: "border-box"
        }}>
          {!sourceFile && !loading && !resultUrl && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcess(file);
              }}
              style={{
                border: `1.5px dashed ${isDragging ? "#fafafa" : "#3f3f46"}`,
                backgroundColor: "#0d0e11",
                padding: "72px 20px",
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
                  Upload portrait photo
                </div>
                <div style={{ fontSize: "12px", color: "#71717a" }}>
                  Drag &amp; drop or click to browse (JPG, PNG, WEBP • Max 15MB)
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              minHeight: 380,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center"
            }}>
              <Loader2 size={32} color="#fafafa" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#fafafa" }}>{progress}%</div>
              <div style={{ fontSize: "13px", color: "#a1a1aa", marginTop: 4 }}>{progressLabel}</div>
              <div style={{
                width: 240,
                height: 4,
                background: "#27272a",
                borderRadius: 2,
                marginTop: 16,
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${clamp(progress, 0, 100)}%`,
                  background: "#fafafa",
                  transition: "width 0.2s ease"
                }} />
              </div>
            </div>
          )}

          {!loading && resultUrl && (
            <div>
              {/* Workspace Top Bar */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #27272a",
                flexWrap: "wrap",
                gap: 8
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>
                    {selectedPreset.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#71717a" }}>
                    Drag photo to re-position
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowBiometricGuide((v) => !v)}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: showBiometricGuide ? "#27272a" : "#18181b",
                      color: showBiometricGuide ? "#ffffff" : "#a1a1aa",
                      border: "1px solid #27272a",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    Guide {showBiometricGuide ? "On" : "Off"}
                  </button>
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
                      gap: 4
                    }}
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>
              </div>

              {/* Viewport Box */}
              <div style={{
                minHeight: 380,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                background: "#09090b",
                borderRadius: 6,
                border: "1px solid #27272a",
                overflow: "hidden"
              }}>
                <div
                  ref={previewBoxRef}
                  style={{
                    position: "relative",
                    width: "min(100%, 300px)",
                    aspectRatio: `${photoRatio}`,
                    backgroundColor: isTransparent ? "transparent" : customColor,
                    backgroundImage: isTransparent ? `
                      linear-gradient(45deg, #18181b 25%, transparent 25%),
                      linear-gradient(-45deg, #18181b 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #18181b 75%),
                      linear-gradient(-45deg, transparent 75%, #18181b 75%)
                    ` : "none",
                    backgroundSize: "16px 16px",
                    overflow: "hidden",
                    cursor: "grab",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    border: "1px solid #3f3f46"
                  }}
                  onMouseDown={(e) => handleStartPan(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleMovePan(e.clientX, e.clientY)}
                  onMouseUp={handleEndPan}
                  onMouseLeave={handleEndPan}
                  onTouchStart={(e) => {
                    const t = e.touches[0];
                    if (t) handleStartPan(t.clientX, t.clientY);
                  }}
                  onTouchMove={(e) => {
                    const t = e.touches[0];
                    if (t) handleMovePan(t.clientX, t.clientY);
                  }}
                  onTouchEnd={handleEndPan}
                >
                  <img
                    src={resultUrl}
                    alt="Processed portrait"
                    draggable={false}
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 0,
                      width: "100%",
                      transformOrigin: "bottom center",
                      pointerEvents: "none",
                      transform: `translate(calc(-50% + ${position.x}px), ${position.y}px) scale(${scale})`,
                      filter: enableShadow && !isTransparent ? "drop-shadow(0 10px 14px rgba(0,0,0,0.35))" : "none"
                    }}
                  />

                  {showBiometricGuide && hasPhysicalDimensions && (
                    <div
                      style={{
                        position: "absolute",
                        top: "13%",
                        left: "19%",
                        width: "62%",
                        height: "56%",
                        border: "1px dashed rgba(255, 255, 255, 0.4)",
                        borderRadius: "50%",
                        pointerEvents: "none"
                      }}
                    />
                  )}

                  {applyStamp && hasPhysicalDimensions && !isRawPreset && (
                    <div style={{
                      position: "absolute",
                      right: 0,
                      bottom: 0,
                      left: 0,
                      display: "flex",
                      minHeight: 44,
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px 8px",
                      background: "#ffffff",
                      borderTop: "1.5px solid #09090b",
                      fontFamily: "monospace",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "#09090b" }}>
                        {(candidateName.trim() || "CANDIDATE NAME").toUpperCase()}
                      </div>
                      <div style={{ fontSize: "8.5px", fontWeight: 600, color: "#09090b", marginTop: 2 }}>
                        {(photoDate.trim() || "DOP").toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Viewport Zoom & Actions Bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#0d0e11",
                border: "1px solid #27272a",
                borderRadius: 6,
                marginTop: 14,
                flexWrap: "wrap",
                gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ZoomIn size={15} color="#a1a1aa" />
                  <span style={{ fontSize: "11px", color: "#a1a1aa", fontWeight: 500 }}>Scale</span>
                  <input
                    type="range"
                    min="0.65"
                    max="2.8"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    style={{ width: 110, accentColor: "#f4f4f5", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#fafafa" }}>
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={resetTransform}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: "#18181b",
                      color: "#a1a1aa",
                      border: "1px solid #27272a",
                      borderRadius: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <Move size={11} /> Reset Frame
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnableShadow((v) => !v)}
                    disabled={isTransparent}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: enableShadow ? "#27272a" : "#18181b",
                      color: enableShadow ? "#ffffff" : "#a1a1aa",
                      border: "1px solid #27272a",
                      borderRadius: 4,
                      cursor: isTransparent ? "not-allowed" : "pointer"
                    }}
                  >
                    Shadow {enableShadow ? "On" : "Off"}
                  </button>
                </div>
              </div>

              {/* Backdrop Color Bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#0d0e11",
                border: "1px solid #27272a",
                borderRadius: 6,
                marginTop: 10,
                flexWrap: "wrap",
                gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransparent(true);
                      setEnableShadow(false);
                    }}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: isTransparent ? "#27272a" : "#18181b",
                      color: isTransparent ? "#ffffff" : "#a1a1aa",
                      border: "1px solid #27272a",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    Transparent
                  </button>

                  <label
                    title="Choose custom background colour"
                    style={{
                      position: "relative",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                      cursor: "pointer",
                      border: !isTransparent ? "2px solid #ffffff" : "2px solid #27272a",
                      display: "inline-block"
                    }}
                  >
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setIsTransparent(false);
                      }}
                      style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
                    />
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {COLOR_PALETTE.slice(0, 6).map((color) => {
                    const selected = !isTransparent && customColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.name}
                        type="button"
                        title={color.name}
                        onClick={() => {
                          setCustomColor(color.hex);
                          setIsTransparent(false);
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          background: color.hex,
                          border: selected ? "2px solid #fafafa" : "1px solid #3f3f46",
                          borderRadius: 3,
                          cursor: "pointer"
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Dock Controls Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Card 1: Presets */}
          <div style={{
            background: "#121316",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: 16
          }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa", marginBottom: 12 }}>
              Official Form Presets
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 240,
              overflowY: "auto",
              paddingRight: 2
            }}>
              {PORTAL_PRESETS.map((preset) => {
                const active = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: active ? "#27272a" : "#18181b",
                      border: `1px solid ${active ? "#52525b" : "#27272a"}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: active ? "#ffffff" : "#d4d4d8" }}>
                        {preset.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "#71717a", marginTop: 2 }}>
                        {preset.sub}
                      </div>
                    </div>
                    {active && <Check size={14} color="#fafafa" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Date and Name Stamp */}
          <div style={{
            background: "#121316",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa" }}>Name &amp; Date Stamp</span>
              <button
                type="button"
                onClick={() => setApplyStamp((v) => !v)}
                disabled={!hasPhysicalDimensions || isRawPreset}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 500,
                  background: applyStamp ? "#27272a" : "#18181b",
                  color: applyStamp ? "#ffffff" : "#71717a",
                  border: "1px solid #27272a",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                {applyStamp ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: 4 }}>
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={candidateName}
                  maxLength={42}
                  onChange={(e) => setCandidateName(e.target.value)}
                  disabled={!applyStamp || isRawPreset}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 4,
                    color: "#fafafa",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: 4 }}>
                  Date of Photo (DOP)
                </label>
                <input
                  type="text"
                  value={photoDate}
                  maxLength={36}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  disabled={!applyStamp || isRawPreset}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 4,
                    color: "#fafafa",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Compression & Download */}
          <div style={{
            background: "#121316",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: 16
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa", display: "block", marginBottom: 8 }}>
              Target File Size
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
              {[20, 50, 100, 200].map((limit) => (
                <button
                  key={limit}
                  type="button"
                  onClick={() => setTargetKb(limit)}
                  style={{
                    padding: "6px 0",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: targetKb === limit ? "#27272a" : "#18181b",
                    color: targetKb === limit ? "#ffffff" : "#71717a",
                    border: `1px solid ${targetKb === limit ? "#52525b" : "#27272a"}`,
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  &lt;{limit}KB
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!resultUrl || loading}
              onClick={handleExport}
              style={{
                width: "100%",
                padding: "12px 0",
                background: resultUrl && !loading ? "#fafafa" : "#27272a",
                color: resultUrl && !loading ? "#09090b" : "#71717a",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: 6,
                cursor: resultUrl && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 8
              }}
            >
              <Download size={15} />
              Download Compliant File
            </button>

            <button
              type="button"
              disabled={!resultUrl || sheetLoading || !canGeneratePrintSheet}
              onClick={handleExportPrintSheet}
              style={{
                width: "100%",
                padding: "10px 0",
                background: "#18181b",
                color: canGeneratePrintSheet && resultUrl ? "#d4d4d8" : "#52525b",
                border: "1px solid #27272a",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: 6,
                cursor: canGeneratePrintSheet && resultUrl && !sheetLoading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              {sheetLoading ? (
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Printer size={15} />
              )}
              {sheetLoading ? "Generating 4×6 Sheet..." : "Download 4×6 Print Sheet (8 Photos)"}
            </button>
          </div>

          {sourceFile && (
            <div style={{
              background: "#121316",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <FileImage size={18} color="#a1a1aa" />
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "12px", color: "#fafafa", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                  {sourceFile.name}
                </div>
                <div style={{ fontSize: "10px", color: "#71717a", marginTop: 2 }}>
                  {(sourceFile.size / 1024 / 1024).toFixed(2)} MB · Local
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}