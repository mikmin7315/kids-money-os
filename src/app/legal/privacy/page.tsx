import type { Metadata } from "next";
import { InfoList, InfoSection, PublicInfoPage } from "@/components/legal/public-info-page";
import { getSupportEmail, policyEffectiveDate } from "@/lib/public-info";

export const metadata: Metadata = { title: "개인정보 처리 안내" };

export default function PrivacyPage() {
  const supportEmail = getSupportEmail();

  return (
    <PublicInfoPage
      eyebrow="PRIVACY"
      title="개인정보 처리 안내"
      description={`Monari가 서비스 제공을 위해 처리하는 정보와 이용자의 권리를 안내합니다. 시행일: ${policyEffectiveDate}`}
    >
      <InfoSection title="처리하는 정보">
        <InfoList items={[
          "부모 계정 정보: 이름, 이메일 또는 휴대폰 인증 정보, 가입 일시",
          "아이 프로필 정보: 이름, 닉네임, 출생연도, 아이 모드 PIN의 해시값",
          "서비스 이용 중 생성되는 정보: 약속과 행동 기록, 거래 내역, 잔액, 이자, 미리쓰기, 리포트와 알림",
          "로그인 유지와 아이 모드 제공을 위한 세션 및 쿠키 정보",
        ]} />
      </InfoSection>

      <InfoSection title="이용 목적">
        <InfoList items={[
          "부모 계정 인증과 가족별 서비스 제공",
          "아이의 금융교육 활동, 약속, 잔액과 기록 관리",
          "월별 리포트, 정산과 알림 제공",
          "서비스 안정성 확인과 오류 대응",
        ]} />
      </InfoSection>

      <InfoSection title="아동 정보 처리">
        <p>아이 프로필과 활동 정보는 부모 계정 사용자가 직접 등록하고 관리합니다. 아이는 부모 세션 안의 아이 모드를 통해 자신의 화면을 이용합니다.</p>
        <p>부모 사용자는 자신이 관리 권한을 가진 아이의 정보만 등록해야 합니다.</p>
      </InfoSection>

      <InfoSection title="보관, 접근 및 삭제">
        <p>부모 사용자는 앱에서 자신의 가족 데이터를 조회하고 관리합니다. 아이 모드 PIN은 원문이 아닌 해시 형태로 저장됩니다.</p>
        <p>설정 화면에서 계정을 삭제하면 계정에 연결된 아이 프로필과 주요 금융교육 기록이 함께 삭제됩니다.</p>
      </InfoSection>

      <InfoSection title="외부 서비스와 쿠키">
        <p>서비스 운영을 위해 Supabase의 인증·데이터베이스·Realtime 기능과 배포 환경의 호스팅·요청 처리 기능을 사용할 수 있습니다.</p>
        <p>로그인 세션 쿠키와 8시간 동안 유지되는 아이 모드 쿠키를 사용합니다.</p>
      </InfoSection>

      <InfoSection title="이용자 권리와 문의">
        <p>부모 사용자는 앱에서 가족 정보를 확인·수정하고 설정 화면에서 계정을 삭제할 수 있습니다. 문의 방법은 고객지원 페이지에서 확인할 수 있습니다.</p>
      </InfoSection>

      <InfoSection title="보유 기간과 파기">
        <p>계정과 가족 금융교육 기록은 서비스 제공 기간 동안 보관합니다. 사용자가 계정 삭제를 요청하면 관련 계정과 가족 기록을 삭제하며, 법령상 보관 의무가 있는 경우에만 해당 기간 동안 별도 보관합니다.</p>
      </InfoSection>

      <InfoSection title="개인정보 보호 문의">
        <p>서비스 운영자 및 개인정보 보호 담당: Monari 운영자</p>
        <p>문의 이메일: {supportEmail ?? "고객지원 페이지에서 확인해 주세요."}</p>
      </InfoSection>
    </PublicInfoPage>
  );
}
