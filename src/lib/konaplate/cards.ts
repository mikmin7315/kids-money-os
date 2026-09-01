import { konaPost, konaPostEncrypted } from "./client";

// ──────────────────────────────────────────
// 회원 가입
// ──────────────────────────────────────────

export interface KonaUserRegistrationRequest {
  ci?: string;           // 한국 본인확인 CI값 (88자) — 샌드박스에서는 생략 가능
  loginId: string;       // 이메일 형식 고유 ID
  loginPassword: string; // 6자리 숫자
  birthDate: string;     // YYYYMMDD
  userName: string;
  email: string;
  nationality: string;   // "Korean"
  gender: string;        // "Male" | "Female"
  mobileNumber: string;  // 010XXXXXXXX
  addressInfo: {
    address: string;
    zipCode: string;
    addressDetail?: string;
  };
  joinChannel: string;   // "OPENAPI" (포털 테스트 데이터 기준, 공용 샌드박스)
  tcIdList: string[];    // 약관 동의 ID 목록
}

export interface KonaUserRegistrationResponse {
  userId: number;
  response: { code: string; description: string };
  basicCardInfo: {
    par: string;
    cardNo: string;
    serviceId: string;
    expiryDate: string;
  };
}

// 샌드박스 약관 ID (프로덕션에서는 KONA PLATE 포털에서 확인)
export const KONA_TC_IDS = ["29184", "29186", "29187", "29188", "601151", "601152", "604150", "606153"];

export async function registerKonaUser(
  req: KonaUserRegistrationRequest,
): Promise<KonaUserRegistrationResponse> {
  const body: Record<string, unknown> = {
    loginId: req.loginId,
    loginPassword: req.loginPassword,
    birthDate: req.birthDate,
    userName: req.userName,
    email: req.email,
    nationality: req.nationality,
    gender: req.gender,
    mobileNumber: req.mobileNumber,
    addressInfo: req.addressInfo,
    joinChannel: req.joinChannel,
    tcIdList: req.tcIdList,
  };
  if (req.ci !== undefined) body.ci = req.ci;
  return konaPostEncrypted<KonaUserRegistrationResponse>("/api/v1/user/registration", body);
}

// ──────────────────────────────────────────
// 보유카드 조회  POST /api/v1/user/card/list
// ──────────────────────────────────────────

export interface KonaCardPointInfo {
  autoUse: boolean;
  pointName: string;
  pointPolicyId: string;
  remainingPoint: number;
}

export interface KonaCardDataItem {
  par: string;
  balance: number;
  isNamed: boolean;
  serviceId: string;
  expiryDate: string;
  cardApplyNo: string;
  serviceName: string;
  mobileCardNo: string;
  physicalCardNo?: string;
  mobileCardStatus: "ACTIVE" | "INACTIVE" | string;
  physicalCardStatus?: "ACTIVE" | "INACTIVE" | string;
  rechargeable: boolean;
  remittable: boolean;
  refundable: boolean;
  rechargeableAmount: number;
  minRechargeAmount: number;
  limits: { day: number; once: number; month: number };
  bankInfo?: { bankName: string; accountNo: string };
  cardPointInfo?: KonaCardPointInfo[];
  autoReloadStatus?: string;
  serviceImageUrl?: string;
  enableFIC?: boolean;
  personalRechargeable?: boolean;
  maxRealNameRechargeAmount?: number;
  maxNonRealNameRechargeAmount?: number;
}

export interface KonaCardsResponse {
  response: { code: string; description: string };
  cardDataInfo: KonaCardDataItem[];
}

export async function getKonaCards(userId: number): Promise<KonaCardsResponse> {
  return konaPost<KonaCardsResponse>("/api/v1/user/card/list", { userId });
}

// ──────────────────────────────────────────
// 카드 매핑 회원 조회  POST /api/v1/user/card/info
// cardNo → userId + 잔액 + 카드 상태
// ──────────────────────────────────────────

export interface KonaCardMappingResponse {
  userId: number;
  balance: number;
  ownerKa: string;
  response: { code: string; description: string };
  serviceId: string;
  cardStatus: "ACTIVE" | "INACTIVE" | string;
  serviceName: string;
  cashReceiptInfo?: {
    idNo: string;
    manYn: string;
    approvalDiv: string;
  };
  isAutoRechargeBeforePayment: boolean;
}

export async function getKonaCardByCardNo(cardNo: string): Promise<KonaCardMappingResponse> {
  // reqEncrypt: Y — KONA 공식 문서상 암호화 필수, X-KM-Crypto-Key-Id 포함
  return konaPostEncrypted<KonaCardMappingResponse>("/api/v1/user/card/info", { cardNo });
}

// ──────────────────────────────────────────
// 거래내역 확인  POST /api/v1/transaction/card
// ──────────────────────────────────────────

export interface KonaTransactionItem {
  trType: string;           // "00"=결제, "01"=충전
  rcgType: string | null;
  nrNumber: string;
  trAmount: number;
  orgAmount: number;
  approvalCode: string;
  balanceAfter: number;
  balanceBefore: number;
  merchantName: string;
  bizLicenseNo: string | null;
  authCancelType: "AUTH" | "CANCEL" | string;
  approvalDateTime: string; // "YYYYMMDDHHmmss"
  discountAmount: number;
  usedPointAmount: number;
  savedPointAmount: number;
  cashReciptInfo?: {
    isuStCd: string;
    approvalNo: string;
    approvalDate: string;
  } | null;
  rechargeCancelable: number;
}

export interface KonaTransactionListResponse {
  response: { code: string; description: string };
  pageResponse: {
    page: number;
    totalPages: number;
    numberOfElements: number;
  };
  transactionInfo: KonaTransactionItem[];
}

export async function getKonaTransactions(
  userId: number,
  par: string,
  startDate: string,  // YYYYMMDD
  endDate: string,    // YYYYMMDD
  page = 0,
  pageSize = 20,
): Promise<KonaTransactionListResponse> {
  return konaPost<KonaTransactionListResponse>("/api/v1/transaction/card", {
    userId,
    par,
    startDate,
    endDate,
    pageRequest: { page, pageSize, sort: "approvalDateTime", orderByDirection: "DESC" },
  });
}

// ──────────────────────────────────────────
// 은행계좌 등록 — 4단계 ARS 플로우
// Step 1: 실명 검증  POST /api/v1/bankaccounts/user/valid (reqEncrypt: Y)
// Step 2: ARS 인증 요청  POST /api/v1/bankaccounts/ars/auth (reqEncrypt: Y)
// Step 3: ARS 등록  POST /api/v1/bankaccounts/ars/register (reqEncrypt: Y)
// Step 4: 등록 결과 조회  POST /api/v1/bankaccounts/ars/register/inquiry (reqEncrypt: N)
// ──────────────────────────────────────────

export interface KonaBankAccountValidRequest {
  userId: number;
  bankCode: string;
  bankAccount: string;
  userName: string;
  birthDate: string;  // YYYYMMDD
}

export interface KonaBankAccountValidResponse {
  response: { code: string; description: string };
}

export async function validateKonaBankAccount(
  req: KonaBankAccountValidRequest,
): Promise<KonaBankAccountValidResponse> {
  return konaPostEncrypted<KonaBankAccountValidResponse>(
    "/api/v1/bankaccounts/user/valid",
    req,
  );
}

// ARS 인증 요청: request = { userId } 만 필요
// response에 authNumber(2자리) 포함
export interface KonaBankAccountArsAuthResponse {
  authNumber: string;  // 2자리 인증번호
  response: { code: string; description: string };
}

export async function requestKonaBankAccountArs(
  userId: number,
): Promise<KonaBankAccountArsAuthResponse> {
  return konaPostEncrypted<KonaBankAccountArsAuthResponse>(
    "/api/v1/bankaccounts/ars/auth",
    { userId },
  );
}

// ARS 등록: 공식 필수 파라미터 6개
// response에 bankAccRegNo 포함
export interface KonaBankAccountArsRegisterRequest {
  userId: number;
  bankCode: string;
  bankAccount: string;
  bankName: string;  // 은행명 (예: "IBK기업은행")
  userName: string;  // 예금주 성명
  birthDate: string; // YYYYMMDD
}

export interface KonaBankAccountArsRegisterResponse {
  bankAccRegNo: string;
  response: { code: string; description: string };
}

export async function registerKonaBankAccount(
  req: KonaBankAccountArsRegisterRequest,
): Promise<KonaBankAccountArsRegisterResponse> {
  return konaPostEncrypted<KonaBankAccountArsRegisterResponse>(
    "/api/v1/bankaccounts/ars/register",
    req,
  );
}

// 등록 결과 조회: request = { regNo: bankAccRegNo }
export interface KonaBankAccountInquiryResponse {
  response: { code: string; description: string };
  status: string;
}

export async function inquireKonaBankAccountRegistration(
  bankAccRegNo: string,
): Promise<KonaBankAccountInquiryResponse> {
  return konaPost<KonaBankAccountInquiryResponse>(
    "/api/v1/bankaccounts/ars/register/inquiry",
    { regNo: bankAccRegNo },
  );
}

// ──────────────────────────────────────────
// 실물카드 회원 연결  POST /api/v1/prepay-card/physical/register (reqEncrypt: Y)
// 포털 발급 실물카드를 등록 회원에게 연결
// ──────────────────────────────────────────

export interface KonaPhysicalCardRegisterRequest {
  userId: number;
  physicalCardNo: string;      // 카드번호 16자리
  physicalCardExpDate: string; // YYMM (포털 expiryDate 마지막 4자리)
  physicalCardCVC: string;     // CVC 3자리
}

export interface KonaPhysicalCardRegisterResponse {
  response: { code: string; description: string };
  par?: string;
  serviceId?: string;
}

export async function registerKonaPhysicalCard(
  req: KonaPhysicalCardRegisterRequest,
): Promise<KonaPhysicalCardRegisterResponse> {
  return konaPostEncrypted<KonaPhysicalCardRegisterResponse>(
    "/api/v1/prepay-card/physical/register",
    req,
  );
}

// ──────────────────────────────────────────
// 결제 승인 (No-HCE)  POST /api/v1/payment/no-hce (reqEncrypt: N)
// 일회용 토큰 + dcvv로 가맹점 결제 승인
// ──────────────────────────────────────────

export interface KonaPaymentNoHceRequest {
  oneTimeToken: string;
  dcvv: string;
  amount: number;
  merchantId: string;
  channel: "OPENAPI";
  transactionId: string;  // 파트너 고유 거래 ID
}

export interface KonaPaymentNoHceResponse {
  nrNumber: string;
  approvalCode: string;
  response: { code: string; description: string };
  balanceAfter?: number;
}

export async function approveKonaPayment(
  req: KonaPaymentNoHceRequest,
): Promise<KonaPaymentNoHceResponse> {
  return konaPost<KonaPaymentNoHceResponse>(
    "/api/v1/payment/no-hce",
    req,
  );
}

// ──────────────────────────────────────────
// 결제 취소 (No-HCE)  POST /api/v1/payment/cancel/no-hce (reqEncrypt: N)
// No-HCE 결제 취소
// ──────────────────────────────────────────

export interface KonaPaymentCancelNoHceRequest {
  cardNo: string;
  amount: number;       // 원거래 금액
  nrNumber: string;     // 원거래 KONA 참조번호
  merchantId: string;
  channel: "OPENAPI";
}

export interface KonaPaymentCancelNoHceResponse {
  response: { code: string; description: string };
}

export async function cancelKonaPayment(
  req: KonaPaymentCancelNoHceRequest,
): Promise<KonaPaymentCancelNoHceResponse> {
  return konaPostEncrypted<KonaPaymentCancelNoHceResponse>(
    "/api/v1/payment/cancel/no-hce",
    req,
  );
}

// ──────────────────────────────────────────
// 일회용 토큰 발급  POST /api/v2/payment/generate/onetimetoken
// 계좌 충전 전 반드시 호출 — dcvv + oneTimeToken 발급
// reqEncrypt: Y (JWE)
// ──────────────────────────────────────────

export type KonaTokenType = "CREDIT" | "DEBIT" | "REFUND";

export interface KonaOneTimeTokenResponse {
  dcvv: string;
  response: { code: string; description: string };
  expiryTime: number;    // Unix ms
  oneTimeToken: string;
}

export async function issueKonaOneTimeToken(
  cardNo: string,
  type?: KonaTokenType,
): Promise<KonaOneTimeTokenResponse> {
  return konaPostEncrypted<KonaOneTimeTokenResponse>(
    "/api/v2/payment/generate/onetimetoken",
    type ? { cardNo, type } : { cardNo },
  );
}

// ──────────────────────────────────────────
// 계좌 충전  POST /api/v1/recharges/by-bank-accounts/no-hce
// reqEncrypt: N
// ──────────────────────────────────────────

export interface KonaRechargeRequest {
  dcvv: string;
  amount: number;
  userId: number;
  merchantId: string;
  sequenceId: string;  // 파트너 고유 거래 ID (중복 방지)
  oneTimeToken: string;
}

export interface KonaRechargeResponse {
  nrNumber: string;                              // KONA 거래 참조번호
  response: { code: string; description: string };
  isPending: boolean;
}

export async function rechargeKonaCard(
  req: KonaRechargeRequest,
): Promise<KonaRechargeResponse> {
  return konaPost<KonaRechargeResponse>(
    "/api/v1/recharges/by-bank-accounts/no-hce",
    req,
  );
}

// ──────────────────────────────────────────
// 계좌 충전취소  POST /api/v1/recharges/by-bank-accounts/no-hce/cancel
// reqEncrypt: N
// ──────────────────────────────────────────

export interface KonaRechargeCancelRequest {
  dcvv: string;
  userId: number;
  nrNumber: string;    // 원거래 KONA 참조번호
  cardExpiry: string;  // YYMM (e.g. "2509")
  sequenceId: string;
  oneTimeToken: string;
}

export interface KonaRechargeCancelResponse {
  response: { code: string; description: string };
  isPending: boolean;
}

export async function cancelKonaRecharge(
  req: KonaRechargeCancelRequest,
): Promise<KonaRechargeCancelResponse> {
  return konaPost<KonaRechargeCancelResponse>(
    "/api/v1/recharges/by-bank-accounts/no-hce/cancel",
    req,
  );
}

// ──────────────────────────────────────────
// 충전 결과 확인  POST /api/v1/recharges/by-bank-account/result/inquiry
// isPending=true 인 거래의 최종 결과 조회
// ──────────────────────────────────────────

export interface KonaRechargeResultResponse {
  nrNumber?: string;
  response: { code: string; description: string };
  result: "COMPLETED" | "FAILED" | "PENDING";
}

export async function checkKonaRechargeResult(
  sequenceId: string,
): Promise<KonaRechargeResultResponse> {
  return konaPost<KonaRechargeResultResponse>(
    "/api/v1/recharges/by-bank-account/result/inquiry",
    { sequenceId },
  );
}

// ──────────────────────────────────────────
// 카드 상태 변경  POST /api/v1/card/status
// 부모가 아이 카드 동결(SUSPEND) / 해제(ACTIVE) 제어
// ──────────────────────────────────────────

export type KonaCardStatusValue = "ACTIVE" | "SUSPEND" | "CLOSE";

export interface KonaCardStatusResponse {
  response: { code: string; description: string };
}

export async function changeKonaCardStatus(
  userId: number,
  par: string,
  cardNo: string,
  status: KonaCardStatusValue,
): Promise<KonaCardStatusResponse> {
  return konaPost<KonaCardStatusResponse>("/api/v1/card/status", {
    userId,
    par,
    cardNo,
    status,
  });
}
