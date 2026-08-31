"use server";

import { konaPost } from "./client";

export interface KonaUserRegistrationRequest {
  loginId: string;       // 아이 UUID (고유 식별자)
  loginPassword: string; // 6자리
  birthDate: string;     // YYYYMMDD
  userName: string;
  email: string;
  nationality: string;   // KOR
  gender: string;        // M | F
}

export interface KonaUserRegistrationResponse {
  userId: string;
  cardNo: string;        // 모바일 카드 번호
  par: string;           // 토큰
  expiryDate: string;    // YYMM
  serviceProductId: string;
}

export async function registerKonaUser(
  req: KonaUserRegistrationRequest,
): Promise<KonaUserRegistrationResponse> {
  return konaPost<KonaUserRegistrationResponse>("/api/v1/user/registration", {
    loginId: req.loginId,
    loginPassword: req.loginPassword,
    birthDate: req.birthDate,
    userName: req.userName,
    email: req.email,
    nationality: req.nationality,
    gender: req.gender,
  });
}

export interface KonaCardBalanceResponse {
  userId: string;
  balance: number;
  holdBalance: number;
}

export async function getKonaCardBalance(userId: string): Promise<KonaCardBalanceResponse> {
  return konaPost<KonaCardBalanceResponse>("/api/v1/card/balance", { userId });
}

export interface KonaTransactionListResponse {
  transactions: Array<{
    transactionId: string;
    merchantName: string;
    merchantCategory: string;
    amount: number;
    approvedAt: string;
    status: string;
  }>;
  totalCount: number;
}

export async function getKonaTransactions(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<KonaTransactionListResponse> {
  return konaPost<KonaTransactionListResponse>("/api/v1/card/transactions", {
    userId,
    fromDate,
    toDate,
  });
}
