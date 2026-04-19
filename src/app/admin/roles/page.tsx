"use client";

import { useActionState, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface, Badge } from "@/components/ui/primitives";
import { listProfilesAction, updateRoleForm, type AdminFormState } from "@/actions/admin";

const initialState: AdminFormState = { ok: false, message: "" };

type Profile = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function AdminRolesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProfilesAction().then((result) => {
      if (result.ok && result.data) setProfiles(result.data);
      setLoading(false);
    });
  }, []);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin / RBAC" title="역할 관리" />

        <section className="mt-6">
          <Surface className="bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">RBAC</p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              사용자 역할을
              <br />
              중앙에서 관리합니다.
            </p>
          </Surface>
        </section>

        <Section title="사용자 목록" description="모든 계정의 역할을 조회하고 변경합니다.">
          {loading ? (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
              <p className="text-sm text-[var(--color-muted)]">불러오는 중...</p>
            </Surface>
          ) : profiles.length === 0 ? (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
              <p className="text-sm text-[var(--color-muted)]">등록된 계정이 없습니다.</p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          )}
        </Section>
      </MobileShell>
    </PageContainer>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateRoleForm, initialState);

  return (
    <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold">{profile.name}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{profile.email}</p>
        </div>
        <Badge tone={profile.role === "admin" ? "rose" : "sky"}>
          {profile.role}
        </Badge>
      </div>

      <form action={action} className="mt-4 flex items-center gap-3">
        <input type="hidden" name="profileId" value={profile.id} />
        <select
          name="role"
          defaultValue={profile.role}
          className="flex-1 rounded-[20px] border border-[var(--color-border)] bg-white/85 px-4 py-3 text-sm text-[var(--color-text)]"
        >
          <option value="parent">parent</option>
          <option value="admin">admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60"
        >
          {pending ? "저장 중" : "변경"}
        </button>
      </form>

      {state.message && (
        <p className={`mt-2 text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </p>
      )}
    </Surface>
  );
}
