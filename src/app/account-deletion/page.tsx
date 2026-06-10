import type { Metadata } from "next";
import Link from "next/link";
import { InfoList, InfoSection, PublicInfoPage } from "@/components/legal/public-info-page";
import { getSupportEmail } from "@/lib/public-info";

export const metadata: Metadata = { title: "계정 삭제 안내" };

export default function AccountDeletionPage() {
  const supportEmail = getSupportEmail();

  return (
    <PublicInfoPage
      eyebrow="ACCOUNT DELETION"
      title="계정 삭제 안내"
      description="Monari 계정과 연결된 가족 데이터를 삭제하는 방법을 안내합니다."
    >
      <InfoSection title="앱에서 직접 삭제">
        <ol className="list-decimal space-y-2 pl-5">
          <li>부모 계정으로 로그인합니다.</li>
          <li><Link href="/settings" className="font-bold text-[var(--monari-hero)] underline underline-offset-2">설정</Link>에서 내 계정 영역을 엽니다.</li>
          <li>계정 삭제를 선택하고 확인 문구를 입력합니다.</li>
        </ol>
      </InfoSection>

      <InfoSection title="삭제되는 정보">
        <InfoList items={[
          "부모 계정 프로필",
          "등록한 아이 프로필과 아이 모드 PIN 해시",
          "약속, 행동 기록, 잔액, 거래, 이자와 미리쓰기 기록",
          "월별 리포트와 가족 알림",
        ]} />
        <p className="font-bold text-rose-700">삭제 후에는 복구할 수 없습니다.</p>
      </InfoSection>

      <InfoSection title="앱에 로그인할 수 없는 경우">
        {supportEmail ? (
          <p>
            계정에 사용한 이메일 또는 휴대폰 번호를 포함해{" "}
            <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--monari-hero)] underline underline-offset-2">{supportEmail}</a>
            로 삭제 요청을 보내주세요. 본인 확인 후 처리합니다.
          </p>
        ) : (
          <p>앱에 로그인할 수 없는 경우 고객지원 페이지에서 현재 제공되는 문의 방법을 확인해주세요.</p>
        )}
      </InfoSection>
    </PublicInfoPage>
  );
}
