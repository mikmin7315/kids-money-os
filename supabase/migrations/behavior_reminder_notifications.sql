insert into public.notification_templates (notif_type, label, title_template, body_template)
values
  (
    'daily_behavior_reminder',
    '매일 약속 기록 리마인더',
    '오늘 약속 체크했나요?',
    '오늘 실천한 약속을 기록해 보세요!'
  ),
  (
    'stale_behavior_approval',
    '오래 기다린 약속 승인 알림',
    '확인할 약속 기록이 있어요',
    '3일 이상 기다린 약속 기록을 확인해 주세요.'
  )
on conflict (notif_type) do update
set
  label = excluded.label,
  title_template = excluded.title_template,
  body_template = excluded.body_template;
