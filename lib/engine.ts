"use client";

import {
  removeBackground,
  type Config,
} from "@imgly/background-removal";

export interface ProgressState {
  key: string;
  percent: number;
}

type EngineMode = "fast" | "balanced" | "quality";

interface EngineProfile {
  maxDimension: number;
  jpegQuality: number;
  model: "isnet_fp16";
  label: string;
}

const ENGINE_MODE: EngineMode = "balanced";

/**
 * Fast:
 * - 768 px max input
 * - Exam-form photos / quick preview
 *
 * Balanced:
 * - 1024 px max input
 * - Best default for passport / govt forms
 *
 * Quality:
 * - 1280 px max input
 * - More RAM + more processing time
 */
const ENGINE_PROFILES: Record<EngineMode, EngineProfile> = {
  fast: {
    maxDimension: 768,
    jpegQuality: 0.9,
    model: "isnet_fp16",
    label: "Turbo",
  },
  balanced: {
    maxDimension: 1024,
    jpegQuality: 0.93,
    model: "isnet_fp16",
    label: "Balanced",
  },
  quality: {
    maxDimension: 1280,
    jpegQuality: 0.95,
    model: "isnet_fp16",
    label: "Quality",
  },
};

let warmupPromise: Promise<void> | null = null;

function emitProgress(
  onProgress: ((progress: ProgressState) => void) | undefined,
  key: string,
  percent: number
) {
  onProgress?.({
    key,
    percent: Math.min(100, Math.max(0, Math.round(percent))),
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
          reject(new Error("Could not encode optimized image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Browser image decode complete karke memory-safe inference input banata hai.
 * Yeh 4K uploads ko 768/1024/1280 max dimension tak laata hai.
 */
async function prepareInferenceImage(
  file: File | Blob,
  profile: EngineProfile
): Promise<Blob> {
  const inputUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = inputUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Selected image could not be decoded."));
    });

    try {
      await image.decode();
    } catch {
      // onload already confirms it can render on browsers where decode rejects.
    }

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("Selected image has invalid dimensions.");
    }

    const resizeScale = Math.min(
      1,
      profile.maxDimension / sourceWidth,
      profile.maxDimension / sourceHeight
    );

    // Small image direct pass: avoids extra canvas compression and speed loss.
    if (resizeScale >= 1) {
      return file;
    }

    const width = Math.max(1, Math.round(sourceWidth * resizeScale));
    const height = Math.max(1, Math.round(sourceHeight * resizeScale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!ctx) {
      return file;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);

    return await canvasToBlob(canvas, "image/jpeg", profile.jpegQuality);
  } finally {
    URL.revokeObjectURL(inputUrl);
  }
}

/**
 * Static model files browser cache me prefetch karta hai.
 * Actual IMG.LY resource dependency removeBackground khud resolve karega.
 *
 * First use par model download time lag sakta hai.
 * Subsequent images par browser HTTP cache se speed noticeably better hoti hai.
 */
async function prewarmModelAssets(): Promise<void> {
  if (warmupPromise) return warmupPromise;

  warmupPromise = (async () => {
    try {
      await fetch(
        "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/resources.json",
        {
          method: "GET",
          mode: "cors",
          cache: "force-cache",
        }
      );
    } catch {
      // removeBackground gives the real error; warmup must never block the app.
    }
  })();

  return warmupPromise;
}

/**
 * High-performance client-side background removal engine.
 *
 * Performance path:
 * 1. Image decoding
 * 2. Memory-safe downscale
 * 3. Cached model manifest prewarm
 * 4. ONNX inference in browser
 * 5. Transparent PNG Blob result
 */
export async function isolateSubjectLocally(
  source: File | Blob,
  onProgress?: (progress: ProgressState) => void
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("CUTOUT engine requires a browser environment.");
  }

  const profile = ENGINE_PROFILES[ENGINE_MODE];

  emitProgress(onProgress, `CUTOUT ${profile.label}: preparing image`, 4);

  const preparedImage = await prepareInferenceImage(source, profile);

  emitProgress(onProgress, "Checking local acceleration", 14);

  // Starts manifest caching without delaying image inference preparation.
  void prewarmModelAssets();

  const config: Config = {
    /**
     * CDN model source.
     * This should match the installed background-removal package version.
     *
     * For production best speed:
     * Copy IMG.LY data package dist files to public/models/
     * and change this to `${window.location.origin}/models/`.
     */
    publicPath:
      "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",

    /**
     * Reliable quality/speed balance.
     * Do not use isnet_quint8 until your local resources.json
     * explicitly contains that resource.
     */
    model: profile.model,

    debug: false,

    output: {
      format: "image/png",
      quality: 1,
    },

    progress: (key: string, current: number, total: number) => {
      const nativePercent =
        total > 0
          ? Math.round((current / total) * 100)
          : 0;

      // Reserve 14–99 range for model downloads and inference.
      const mappedPercent = 14 + nativePercent * 0.85;

      let stage = "Processing portrait locally";

      if (key.includes("fetch")) {
        stage = "Loading AI model";
      } else if (key.includes("compute") || key.includes("inference")) {
        stage = "Separating foreground";
      } else if (key.includes("model")) {
        stage = "Preparing neural model";
      }

      emitProgress(onProgress, stage, mappedPercent);
    },
  };

  try {
    emitProgress(onProgress, "Launching local AI engine", 18);

    const output = await removeBackground(preparedImage, config);

    if (!(output instanceof Blob)) {
      throw new Error("Local engine returned an invalid image result.");
    }

    emitProgress(onProgress, "Cutout complete", 100);

    return output;
  } catch (error) {
    console.error("[CUTOUT_ENGINE_ERROR]", {
      mode: ENGINE_MODE,
      model: profile.model,
      crossOriginIsolated: window.crossOriginIsolated,
      cores: navigator.hardwareConcurrency,
      error,
    });

    throw new Error(
      error instanceof Error
        ? `CUTOUT engine failed: ${error.message}`
        : "CUTOUT engine failed unexpectedly."
    );
  }
}