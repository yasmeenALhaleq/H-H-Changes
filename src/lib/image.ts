/**
 * Preparing a product photo for the database.
 *
 * Neon's object storage is not available in this project's region, so a photo
 * is kept in the products table as a data URL. A phone camera file is several
 * megabytes, far too much for that, so the picture is shrunk and compressed
 * here in the browser first — a product tile is never larger than a few hundred
 * pixels on screen, and the result lands around 60–120 KB.
 */

/** Longest side of the stored picture, in pixels. */
const MAX_SIDE = 900;

/** Roughly the largest data URL worth storing, in characters. */
const MAX_CHARS = 400_000;

export type ImageProblem = "type" | "unreadable" | "too-large";

/**
 * Reads a chosen file and returns a compressed JPEG data URL, or a reason why
 * it could not be used.
 */
export async function imageToDataUrl(
  file: File,
): Promise<{ dataUrl: string } | { problem: ImageProblem }> {
  if (!file.type.startsWith("image/")) return { problem: "type" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { problem: "unreadable" };
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return { problem: "unreadable" };
  }
  // A transparent PNG would go black as a JPEG, so lay it on white first.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Drop the quality a step at a time until it is small enough to store.
  for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_CHARS) return { dataUrl };
  }
  return { problem: "too-large" };
}

/** The message to show for each reason a picture was turned away. */
export const imageProblemText: Record<ImageProblem, string> = {
  type: "Choose an image file.",
  unreadable: "That image could not be read. Try another one.",
  "too-large": "That image is too detailed to store. Try a smaller one.",
};
