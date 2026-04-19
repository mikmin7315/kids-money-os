#!/bin/bash
# Claude Code + Codex 협력 개발 루프
# 사용법: ./dev-collab.sh "구현할 기능 설명"

FEATURE="${1:-기능을 인자로 전달하세요}"
DRAFT_FILE="collab_draft.tsx"
REVIEW_FILE="collab_review.md"
MAX_ROUNDS=3
ROUND=1

echo "=== 협력 개발 시작: $FEATURE ==="
echo ""

while [ $ROUND -le $MAX_ROUNDS ]; do
  echo "--- Round $ROUND ---"

  # Step 1: Codex가 코드 초안 생성
  echo "[Codex] 코드 생성 중..."
  codex "Next.js App Router + TypeScript + Tailwind로 다음 기능을 구현해줘: $FEATURE. 파일: $DRAFT_FILE" \
    --approval-mode full-auto \
    --quiet

  if [ ! -f "$DRAFT_FILE" ]; then
    echo "[오류] Codex가 $DRAFT_FILE 을 생성하지 못했습니다."
    break
  fi

  # Step 2: Claude Code가 검토
  echo "[Claude] 코드 검토 중..."
  claude -p "다음 파일을 검토해줘: $DRAFT_FILE

  체크리스트:
  - TypeScript 타입 오류
  - Supabase 연동 패턴 (이 프로젝트: kids-money-os)
  - 보안 취약점
  - 개선 필요 사항

  문제없으면 첫 줄에 'APPROVED' 출력.
  수정 필요하면 첫 줄에 'REVISE' 후 구체적 지시 사항 작성." > "$REVIEW_FILE"

  VERDICT=$(head -1 "$REVIEW_FILE")

  if [ "$VERDICT" = "APPROVED" ]; then
    echo ""
    echo "✅ Round $ROUND: 승인됨! 개발 완료."
    echo "결과 파일: $DRAFT_FILE"
    break
  else
    echo "🔄 Round $ROUND: 수정 필요. 다음 라운드..."
    # 리뷰 내용을 다음 라운드 지시에 반영
    FEATURE="$FEATURE. 이전 검토 피드백 반영: $(cat $REVIEW_FILE)"
    ROUND=$((ROUND + 1))
  fi
done

if [ $ROUND -gt $MAX_ROUNDS ]; then
  echo ""
  echo "⚠️  $MAX_ROUNDS 라운드 후 최종 상태: $DRAFT_FILE"
  echo "마지막 리뷰: $REVIEW_FILE"
fi
