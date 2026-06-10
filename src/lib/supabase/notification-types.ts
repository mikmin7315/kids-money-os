export type AppNotification = {
  id: string;
  childId: string | null;
  target: "parent" | "child";
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export function mapNotificationRow(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    childId: row.child_id ? String(row.child_id) : null,
    target: row.target as "parent" | "child",
    type: String(row.type),
    title: String(row.title),
    body: String(row.body),
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}
