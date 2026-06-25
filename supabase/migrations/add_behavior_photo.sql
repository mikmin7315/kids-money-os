-- Add photo support to behavior_logs
alter table public.behavior_logs
  add column if not exists photo_path text,
  add column if not exists photo_taken_at timestamptz;

-- behavior-photos: private bucket (signed URL만 허용)
insert into storage.buckets (id, name, public)
values ('behavior-photos', 'behavior-photos', false)
on conflict (id) do update set public = false;

-- 기존 public read/upload policy 제거
drop policy if exists "Public read behavior photos" on storage.objects;
drop policy if exists "Authenticated upload behavior photos" on storage.objects;

-- 업로드: 부모가 소유한 아이 경로만 허용 ({child_id}/*)
create policy "behavior_photos_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'behavior-photos'
  and (storage.foldername(name))[1] in (
    select id::text from public.children where parent_id = auth.uid()
  )
);

-- 조회는 signed URL만 허용 (storage.ts getBehaviorPhotoUrl 사용)
