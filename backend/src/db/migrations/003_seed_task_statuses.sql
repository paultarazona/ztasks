-- 003_seed_task_statuses.sql
-- Upserts default global task statuses.
-- is_global = true rows are shared across all categories.

INSERT INTO task_statuses (name, color, position, is_global)
VALUES
  ('To Do',       '#6B7280', 0, true),
  ('In Progress', '#3B82F6', 1, true),
  ('Done',        '#10B981', 2, true),
  ('Blocked',     '#EF4444', 3, true)
ON CONFLICT DO NOTHING;
