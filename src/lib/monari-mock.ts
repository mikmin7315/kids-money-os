export type Tone = "done" | "pending" | "plus" | "minus" | "neutral";

export const formatKrw = (value: number) =>
  `₩${new Intl.NumberFormat("ko-KR").format(value)}`;

export const parentHomeData = {
  parentName: "민지",
  headline: "오늘 확인할 약속 2건이 있어요",
  heroSub: "아이와 약속 흐름을 한 번에 확인해보세요",
  available: 2920,
  saved: 1000,
  borrowed: 3000,
  rate: 4.5,
  monthAllowance: 33000,
  monthSpend: 25000,
  monthSave: 1000,
  monthPromiseRate: 67,
  children: [
    { id: "1", name: "서윤", balance: 42500, pending: 1, progress: 72 },
    { id: "2", name: "도윤", balance: 18800, pending: 2, progress: 46 },
  ],
  queue: [
    { title: "숙제 완료", child: "서윤", reward: 1000, status: "확인 대기" },
    { title: "7시 전에 일어나기", child: "도윤", reward: 500, status: "오늘 확인" },
  ],
  recent: [
    { title: "7시 전에 일어나기", sub: "서윤 · 오늘", right: "완료", tone: "done" as Tone },
    { title: "숙제 완료", sub: "서윤 · 오늘", right: "확인 대기", tone: "pending" as Tone },
    { title: "이자 반영", sub: "도윤 · 오늘", right: "+₩120", tone: "plus" as Tone },
    { title: "미리쓰기 요청", sub: "도윤 · 어제", right: "₩7,000", tone: "minus" as Tone },
  ],
};

export const approvalsData = [
  {
    id: "a1",
    child: "서윤",
    title: "숙제 완료",
    description: "수학 문제집 3쪽까지 완료했어요",
    reward: 1000,
    submittedAt: "오늘 18:20",
  },
  {
    id: "a2",
    child: "도윤",
    title: "7시 전에 일어나기",
    description: "알람 듣고 바로 일어났어요",
    reward: 500,
    submittedAt: "오늘 07:12",
  },
  {
    id: "a3",
    child: "도윤",
    title: "심부름 하기",
    description: "분리수거와 택배 받기를 했어요",
    reward: 1500,
    submittedAt: "어제 19:48",
  },
];

export const behaviorsData = [
  { title: "숙제 완료", category: "학습", reward: 1000, cycle: "매일", active: true },
  { title: "7시 전에 일어나기", category: "생활", reward: 500, cycle: "평일", active: true },
  { title: "책 20분 읽기", category: "습관", reward: 700, cycle: "매일", active: true },
  { title: "심부름 하기", category: "도움", reward: 1500, cycle: "필요 시", active: false },
];

export const recordsData = [
  { title: "저축하기", sub: "서윤 · 오늘", amount: "+₩5,000", tone: "plus" as Tone },
  { title: "편의점 사용", sub: "서윤 · 어제", amount: "-₩2,000", tone: "minus" as Tone },
  { title: "약속 보상", sub: "도윤 · 2일 전", amount: "+₩1,000", tone: "plus" as Tone },
  { title: "이자 반영", sub: "도윤 · 3일 전", amount: "+₩120", tone: "plus" as Tone },
  { title: "미리쓰기 승인", sub: "도윤 · 4일 전", amount: "-₩7,000", tone: "minus" as Tone },
];

export const reportsData = {
  month: "2026년 4월",
  totalAllowance: 33000,
  totalSpend: 25000,
  totalSave: 1000,
  promiseRate: 67,
  insightCards: [
    {
      title: "약속 흐름",
      value: "67%",
      desc: "이번 달 약속 성공 흐름이 안정적으로 이어지고 있어요",
    },
    {
      title: "저축 흐름",
      value: "₩1,000",
      desc: "지난주보다 저축 비중이 조금 늘었어요",
    },
    {
      title: "사용 흐름",
      value: "₩25,000",
      desc: "간식과 편의점 사용 비중이 가장 컸어요",
    },
  ],
};

export const childHomeData = {
  name: "서윤",
  balance: 42500,
  heroMessage: "오늘 확인할 약속이 2개 있어",
  monthAllowance: 30000,
  monthSaved: 12000,
  monthRemaining: 42500,
  todayPromises: 2,
  pendingCount: 1,
  savingGoalProgress: 72,
  recentSpend: 3000,
  promiseProgress: 75,
  saveProgress: 72,
  activities: [
    { title: "숙제 약속 확인", sub: "오늘", right: "완료", tone: "done" as Tone },
    { title: "편의점 사용", sub: "어제", right: "-₩2,000", tone: "minus" as Tone },
    { title: "저축하기", sub: "2일 전", right: "+₩5,000", tone: "plus" as Tone },
    { title: "심부름 약속", sub: "3일 전", right: "확인 대기", tone: "pending" as Tone },
  ],
};

export const notificationsData = [
  { title: "숙제 완료 확인 요청", sub: "서윤 · 오늘 18:20", right: "새 알림", tone: "pending" as Tone },
  { title: "이자 반영 완료", sub: "도윤 · 오늘 09:10", right: "확인", tone: "done" as Tone },
  { title: "미리쓰기 요청 도착", sub: "도윤 · 어제 21:03", right: "확인 필요", tone: "pending" as Tone },
];

export const settingsData = [
  { title: "가족 프로필", desc: "부모/아이 계정과 표시 이름을 관리해요" },
  { title: "약속 기본 규칙", desc: "자주 쓰는 약속과 보상 기준을 정리해요" },
  { title: "알림 설정", desc: "확인 알림과 요약 알림 빈도를 조정해요" },
  { title: "보안 설정", desc: "로그인, 기기 보호, 계정 연결을 관리해요" },
];
