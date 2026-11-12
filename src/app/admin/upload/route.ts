import { isLoggedIn } from "@/lib/auth";
import { saveUpload } from "@/lib/content-store";
import { optimizeImage } from "@/lib/optimize-image";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept bodies up to 4.5 MB; the editor downsizes huge photos first
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"];

/**
 * Image upload for the /admin editor. Every image is compressed to WebP before it is stored.
 * Returns { url, width, height, originalBytes, bytes }.
 */
export async function POST(request: Request) {
  if (!(await isLoggedIn())) return Response.json({ error: "Não autorizado." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: "Use JPG, PNG, WebP, AVIF ou GIF." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Imagem muito grande (máx. 4 MB)." }, { status: 413 });

  const originalBytes = Number(form.get("originalBytes")) || file.size;

  let image;
  try {
    image = await optimizeImage(Buffer.from(await file.arrayBuffer()), file.type);
  } catch (error) {
    console.error("[admin] image optimization failed", error);
    return Response.json({ error: "Não foi possível ler essa imagem." }, { status: 400 });
  }

  try {
    const url = await saveUpload(image.data, image.ext, image.contentType);
    return Response.json({ url, width: image.width, height: image.height, originalBytes, bytes: image.data.length });
  } catch (error) {
    console.error("[admin] upload failed", error);
    return Response.json({ error: "Falha ao enviar a imagem." }, { status: 500 });
  }
}
