import type { Metadata } from "next";
import { InfoSection, PublicInfoPage } from "@/components/legal/public-info-page";
import { getSupportEmail } from "@/lib/public-info";

export const metadata: Metadata = { title: "고객지원" };

export default function SupportPage() {
  const supportEmail = getSupportEmail();

  return (
    <PublicInfoPage
      eyebrow="SUPPORT"
      title="고객지원"
      description="계정, 아이 모드, 금융교육 기록과 데이터 삭제에 관한 도움을 드립니다."
    >
      <InfoSection title="문의하기">
        {supportEmail ? (
          <p>
            <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--monari-hero)] underline underline-offset-2">{supportEmail}</a>
            로 문의해주세요. 계정 관련 문의에는 가입에 사용한 이메일 또는 휴대폰 번호를 함께 적어주세요.
          </p>
        ) : (
          <p>현재 앱 안의 설정과 계정 삭제 안내 페이지에서 주요 지원 절차를 확인할 수 있습니다.</p>
        )}
      </InfoSection>

      <InfoSection title="자주 묻는 질문">
        <Faq question="아이 모드 PIN을 잊었어요." answer="부모 계정의 설정 화면에서 해당 아이의 PIN을 새로 저장할 수 있습니다." />
        <Faq question="계정을 삭제하고 싶어요." answer="부모 계정으로 로그인한 뒤 설정의 계정 삭제 영역에서 진행할 수 있습니다." />
        <Faq question="금액이나 기록이 예상과 달라요." answer="기록 화면과 설정한 규칙을 먼저 확인한 뒤, 해결되지 않으면 고객지원으로 문의해주세요." />
      </InfoSection>
    </PublicInfoPage>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-4">
      <summary className="cursor-pointer font-extrabold text-[var(--monari-ink)]">{question}</summary>
      <p className="mt-2">{answer}</p>
    </details>
  );
}
