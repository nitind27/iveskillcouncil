import { writeFile, mkdir } from "fs/promises";
import path from "path";

/** Save student profile/signature image from data URL or raw base64 */
export async function saveStudentImage(
  base64OrDataUrl: string,
  kind: "profile" | "signature",
  tag: string
): Promise<string> {
  const raw = base64OrDataUrl.includes(",")
    ? base64OrDataUrl.split(",")[1]
    : base64OrDataUrl;
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length < 200) throw new Error(`${kind} image too small`);
  if (buffer.length > 5 * 1024 * 1024) throw new Error(`${kind} image must be under 5MB`);

  const dir = path.join(process.cwd(), "public", "uploads", "students", kind);
  await mkdir(dir, { recursive: true });
  const ext = base64OrDataUrl.includes("image/png") ? "png" : "jpg";
  const filename = `${kind}-${tag}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/students/${kind}/${filename}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
