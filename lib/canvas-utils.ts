export interface SheetOptions {
  sourceImage: CanvasImageSource;

  /**
   * Final ID photo width in millimetres.
   * Default: 35 mm
   */
  photoWidthMm?: number;

  /**
   * Final ID photo height in millimetres.
   * Default: 45 mm
   */
  photoHeightMm?: number;

  /**
   * Print output resolution.
   * 300 is standard photo-print quality.
   */
  dpi?: number;

  /**
   * Number of copies to place on the print sheet.
   * Default: automatically calculated for the selected layout.
   */
  copies?: number;

  /**
   * "4x6" is standard photo-paper size.
   * "A4" is useful for home / office printers.
   */
  paper?: "4x6" | "A4";

  /**
   * Use "portrait" unless you specifically want horizontal 4×6 photo paper.
   */
  orientation?: "portrait" | "landscape";

  /**
   * White area around the sheet boundary.
   */
  marginMm?: number;

  /**
   * Space between photo cut lines.
   */
  gapMm?: number;

  /**
   * Render faint full rectangular borders around each image.
   */
  showCutBorders?: boolean;

  /**
   * Render printer-friendly corner crop marks.
   */
  showCropMarks?: boolean;

  /**
   * Adds a small footer outside the print grid.
   */
  showFooter?: boolean;

  /**
   * JPEG is usually best for photo-lab printing.
   * PNG is better only when you intentionally need no JPEG compression.
   */
  format?: "image/jpeg" | "image/png";

  /**
   * Used only for JPEG export.
   */
  quality?: number;

  /**
   * Background color of the entire print sheet.
   */
  backgroundColor?: string;

  /**
   * Choose "cover" to fill each photo cell while preserving the exact
   * requested physical size. Use "contain" only when you never want
   * any source-image edge cropping.
   */
  fit?: "cover" | "contain";
}

export interface PrintSheetResult {
  blob: Blob;
  filename: string;

  dpi: number;
  paper: "4x6" | "A4";
  orientation: "portrait" | "landscape";

  sheetWidthPx: number;
  sheetHeightPx: number;

  photoWidthPx: number;
  photoHeightPx: number;

  photoWidthMm: number;
  photoHeightMm: number;

  columns: number;
  rows: number;
  copiesPlaced: number;
  requestedCopies: number;

  printInstructions: string;
}

const MM_PER_INCH = 25.4;

const PAPER_SIZES_MM = {
  "4x6": {
    width: 101.6,
    height: 152.4,
  },
  A4: {
    width: 210,
    height: 297,
  },
} as const;

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

function getPaperDimensions(
  paper: "4x6" | "A4",
  orientation: "portrait" | "landscape"
) {
  const base = PAPER_SIZES_MM[paper];

  if (orientation === "landscape") {
    return {
      widthMm: base.height,
      heightMm: base.width,
    };
  }

  return {
    widthMm: base.width,
    heightMm: base.height,
  };
}

function validatePositiveNumber(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a valid number greater than 0.`);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not generate the print sheet image."));
          return;
        }

        resolve(blob);
      },
      type,
      type === "image/jpeg" ? quality : undefined
    );
  });
}

/**
 * Draws an image inside its exact print cell.
 *
 * `cover`:
 * - Maintains the requested mm dimensions exactly.
 * - Preserves aspect ratio.
 * - Crops extra edges if source ratio differs.
 *
 * `contain`:
 * - Shows the complete source image.
 * - Can leave white space inside the photo cell.
 */
function drawImageFitted(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  targetWidth: number,
  targetHeight: number,
  fit: "cover" | "contain",
  sourceWidth: number,
  sourceHeight: number
): void {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let drawX = x;
  let drawY = y;
  let drawWidth = targetWidth;
  let drawHeight = targetHeight;

  if (fit === "cover") {
    if (sourceRatio > targetRatio) {
      drawHeight = targetHeight;
      drawWidth = targetHeight * sourceRatio;
      drawX = x - (drawWidth - targetWidth) / 2;
    } else {
      drawWidth = targetWidth;
      drawHeight = targetWidth / sourceRatio;
      drawY = y - (drawHeight - targetHeight) / 2;
    }
  } else {
    if (sourceRatio > targetRatio) {
      drawWidth = targetWidth;
      drawHeight = targetWidth / sourceRatio;
      drawY = y + (targetHeight - drawHeight) / 2;
    } else {
      drawHeight = targetHeight;
      drawWidth = targetHeight * sourceRatio;
      drawX = x + (targetWidth - drawWidth) / 2;
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, targetWidth, targetHeight);
  ctx.clip();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function drawCutMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  tickLength: number,
  lineWidth: number
): void {
  ctx.save();

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "square";

  ctx.beginPath();

  // Top-left
  ctx.moveTo(x - tickLength, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y - tickLength);

  // Top-right
  ctx.moveTo(x + width, y - tickLength);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width + tickLength, y);

  // Bottom-left
  ctx.moveTo(x - tickLength, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + height + tickLength);

  // Bottom-right
  ctx.moveTo(x + width, y + height + tickLength);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width + tickLength, y + height);

  ctx.stroke();
  ctx.restore();
}

function getImageNaturalSize(sourceImage: CanvasImageSource): {
  width: number;
  height: number;
} {
  if (sourceImage instanceof HTMLImageElement) {
    return {
      width: sourceImage.naturalWidth || sourceImage.width,
      height: sourceImage.naturalHeight || sourceImage.height,
    };
  }

  if (sourceImage instanceof HTMLCanvasElement) {
    return {
      width: sourceImage.width,
      height: sourceImage.height,
    };
  }

  if (typeof ImageBitmap !== "undefined" && sourceImage instanceof ImageBitmap) {
    return {
      width: sourceImage.width,
      height: sourceImage.height,
    };
  }

  if (
    typeof HTMLVideoElement !== "undefined" &&
    sourceImage instanceof HTMLVideoElement
  ) {
    return {
      width: sourceImage.videoWidth || sourceImage.width,
      height: sourceImage.videoHeight || sourceImage.height,
    };
  }

  throw new Error(
    "Unsupported source image. Use an HTMLImageElement, canvas, ImageBitmap, or video element."
  );
}

/**
 * Creates a dimensionally accurate print sheet.
 *
 * Example 35 × 45 mm at 300 DPI:
 * - 413 × 531 pixels per photo
 * - Properly laid out on 4 × 6 inch / A4 paper
 *
 * Note:
 * Canvas JPEG export has browser-controlled DPI metadata. The actual
 * physical size stays correct when the printer uses "Actual size" / "100%"
 * and does not use "Fit to page".
 */
export async function generatePrintSheetBlob(
  options: SheetOptions
): Promise<PrintSheetResult> {
  const {
    sourceImage,
    photoWidthMm = 35,
    photoHeightMm = 45,
    dpi = 300,
    copies,
    paper = "4x6",
    orientation = "portrait",
    marginMm = 4,
    gapMm = 4,
    showCutBorders = true,
    showCropMarks = true,
    showFooter = true,
    format = "image/jpeg",
    quality = 0.98,
    backgroundColor = "#ffffff",
    fit = "cover",
  } = options;

  validatePositiveNumber("photoWidthMm", photoWidthMm);
  validatePositiveNumber("photoHeightMm", photoHeightMm);
  validatePositiveNumber("dpi", dpi);
  validatePositiveNumber("marginMm", marginMm);

  if (gapMm < 0 || !Number.isFinite(gapMm)) {
    throw new Error("gapMm must be 0 or greater.");
  }

  if (quality < 0 || quality > 1 || !Number.isFinite(quality)) {
    throw new Error("quality must be between 0 and 1.");
  }

  if (copies !== undefined && (!Number.isInteger(copies) || copies <= 0)) {
    throw new Error("copies must be a positive whole number.");
  }

  const { width: sourceWidth, height: sourceHeight } =
    getImageNaturalSize(sourceImage);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Source image is not loaded or has invalid dimensions.");
  }

  const { widthMm: sheetWidthMm, heightMm: sheetHeightMm } =
    getPaperDimensions(paper, orientation);

  const sheetWidthPx = mmToPx(sheetWidthMm, dpi);
  const sheetHeightPx = mmToPx(sheetHeightMm, dpi);

  const photoWidthPx = mmToPx(photoWidthMm, dpi);
  const photoHeightPx = mmToPx(photoHeightMm, dpi);

  const marginPx = mmToPx(marginMm, dpi);
  const gapPx = mmToPx(gapMm, dpi);
  const footerHeightPx = showFooter ? mmToPx(8, dpi) : 0;

  const usableWidthPx = sheetWidthPx - marginPx * 2;
  const usableHeightPx =
    sheetHeightPx - marginPx * 2 - footerHeightPx;

  const columns = Math.floor(
    (usableWidthPx + gapPx) / (photoWidthPx + gapPx)
  );

  const rows = Math.floor(
    (usableHeightPx + gapPx) / (photoHeightPx + gapPx)
  );

  if (columns < 1 || rows < 1) {
    throw new Error(
      `${photoWidthMm}×${photoHeightMm} mm photo does not fit on ${paper} paper in ${orientation} mode. Use A4, change orientation, reduce margins, or use a smaller photo size.`
    );
  }

  const maxCopies = columns * rows;
  const requestedCopies = copies ?? maxCopies;
  const copiesPlaced = Math.min(requestedCopies, maxCopies);

  const gridWidthPx =
    columns * photoWidthPx + Math.max(0, columns - 1) * gapPx;

  const gridHeightPx =
    rows * photoHeightPx + Math.max(0, rows - 1) * gapPx;

  const gridStartX = Math.round((sheetWidthPx - gridWidthPx) / 2);
  const usableTopPx = marginPx;
  const usableBottomPx = sheetHeightPx - marginPx - footerHeightPx;
  const availableGridHeight = usableBottomPx - usableTopPx;

  const gridStartY = Math.round(
    usableTopPx + Math.max(0, (availableGridHeight - gridHeightPx) / 2)
  );

  const canvas = document.createElement("canvas");
  canvas.width = sheetWidthPx;
  canvas.height = sheetHeightPx;

  const ctx = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: false,
  });

  if (!ctx) {
    throw new Error("Canvas 2D rendering is not available in this browser.");
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

  const borderWidth = Math.max(1, Math.round(dpi / 300));
  const cropTickPx = mmToPx(2.2, dpi);
  const cropLinePx = Math.max(1, Math.round(dpi / 220));

  for (let index = 0; index < copiesPlaced; index++) {
    const row = Math.floor(index / columns);
    const column = index % columns;

    const x = gridStartX + column * (photoWidthPx + gapPx);
    const y = gridStartY + row * (photoHeightPx + gapPx);

    drawImageFitted(
      ctx,
      sourceImage,
      x,
      y,
      photoWidthPx,
      photoHeightPx,
      fit,
      sourceWidth,
      sourceHeight
    );

    if (showCutBorders) {
      ctx.save();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
      ctx.restore();
    }

    if (showCropMarks) {
      drawCutMarks(
        ctx,
        x,
        y,
        photoWidthPx,
        photoHeightPx,
        cropTickPx,
        cropLinePx
      );
    }
  }

  if (showFooter) {
    const footerY = sheetHeightPx - Math.round(marginPx / 2);

    ctx.save();
    ctx.fillStyle = "#64748b";
    ctx.font = `600 ${Math.max(12, Math.round(dpi / 20))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      `CUTOUT • ${photoWidthMm}×${photoHeightMm} mm • ${dpi} PPI • ${copiesPlaced} PHOTO${copiesPlaced === 1 ? "" : "S"} • PRINT AT 100% / ACTUAL SIZE`,
      sheetWidthPx / 2,
      footerY
    );

    ctx.restore();
  }

  const blob = await canvasToBlob(canvas, format, quality);

  const extension = format === "image/png" ? "png" : "jpg";

  return {
    blob,
    filename: `cutout-${photoWidthMm}x${photoHeightMm}mm-${dpi}ppi-${copiesPlaced}copies.${extension}`,
    dpi,
    paper,
    orientation,
    sheetWidthPx,
    sheetHeightPx,
    photoWidthPx,
    photoHeightPx,
    photoWidthMm,
    photoHeightMm,
    columns,
    rows,
    copiesPlaced,
    requestedCopies,
    printInstructions:
      "Print using Actual size / 100% scaling. Disable Fit to page, Shrink to fit, Fill page, and borderless auto-scaling. Use 4×6 inch photo paper when paper is 4x6.",
  };
}