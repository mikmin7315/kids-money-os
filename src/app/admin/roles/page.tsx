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

        <Section title="사용자 목록" description="모든 계정의 역할을 조회하고 변경합니다.">
          {loading ? (
            <Surface>
              <p className="text-sm text-[var(--color-muted)]">불러오는 중...</p>
            </Surface>
          ) : profiles.length === 0 ? (
            <Surface>
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
    <Surface>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{profile.name}</p>
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
          className="flex-1 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
        >
          <option value="parent">parent</option>
          <option value="admin">admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60"
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
