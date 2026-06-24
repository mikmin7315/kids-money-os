import { getSupabaseServerClient } from "./server";

const BUCKET = "behavior-photos";

export async function uploadBehaviorPhoto(
  file: File,
  childId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${childId}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) return { ok: false, error: error.message };

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "업로드 실패" };
  }
}
