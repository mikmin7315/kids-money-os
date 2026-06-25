import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "./server";

const BUCKET = "behavior-photos";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadBehaviorPhoto(
  file: File,
  childId: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: "jpg, png, webp 파일만 업로드할 수 있어요." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "파일 크기는 5MB 이하여야 해요." };
    }

    const auth = await requireParentSession();
    if (!auth.user) return { ok: false, error: "인증이 필요해요." };
    const supabase = await getSupabaseServerClient();

    // Verify childId belongs to this parent
    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("parent_id", auth.user.id)
      .maybeSingle();
    if (!child) return { ok: false, error: "권한이 없어요." };

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${childId}/${crypto.randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) return { ok: false, error: error.message };

    // Return path only — callers get a signed URL via getBehaviorPhotoUrl
    return { ok: true, path };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "업로드 실패" };
  }
}

export async function getBehaviorPhotoUrl(path: string): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error || !data) return null;
  return data.signedUrl;
}
