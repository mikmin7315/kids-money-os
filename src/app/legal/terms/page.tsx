import type { Metadata } from "next";
import { InfoList, InfoSection, PublicInfoPage } from "@/components/legal/public-info-page";
import { policyEffectiveDate } from "@/lib/public-info";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="TERMS"
      title="이용약관"
      description={`Monari 서비스 이용에 필요한 기본 원칙을 안내합니다. 시행일: ${policyEffectiveDate}`}
    >
      <InfoSection title="서비스의 목적">
        <p>Monari는 부모와 아이가 용돈, 저축, 약속과 이자를 함께 기록하며 금융 습관을 연습하는 교육용 서비스입니다.</p>
        <p>앱 안의 금액, 이자와 미리쓰기는 실제 은행 예금, 대출, 투자 또는 법정 금융거래가 아닙니다.</p>
      </InfoSection>

      <InfoSection title="계정과 아이 모드">
        <InfoList items={[
          "부모 사용자는 정확한 계정 정보를 사용하고 로그인 수단을 안전하게 관리해야 합니다.",
          "부모 사용자는 자신이 관리 권한을 가진 아이의 정보만 등록해야 합니다.",
          "아이 모드 PIN과 기기 접근 권한을 관리할 책임은 부모 사용자에게 있습니다.",
        ]} />
      </InfoSection>

      <InfoSection title="기록과 부모의 책임">
        <p>부모 사용자는 앱에 입력한 용돈 규칙, 약속, 승인, 거래 기록의 정확성을 확인해야 합니다. Monari는 가족이 입력한 기록을 바탕으로 화면과 리포트를 제공합니다.</p>
      </InfoSection>

      <InfoSection title="계정 삭제">
        <p>부모 사용자는 설정 화면에서 계정을 삭제할 수 있습니다. 삭제하면 연결된 가족 금융교육 데이터가 함께 삭제되며 복구할 수 없습니다.</p>
      </InfoSection>

      <InfoSection title="서비스 변경과 책임">
        <p>안정적인 운영과 기능 개선을 위해 서비스 내용이 변경되거나 일시 중단될 수 있습니다. 중요한 변경은 합리적인 방법으로 안내합니다.</p>
      </InfoSection>
    </PublicInfoPage>
  );
}
