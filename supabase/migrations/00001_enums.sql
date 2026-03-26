-- Enums for GiniManager
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'collaborator');
CREATE TYPE public.work_item_type AS ENUM ('area', 'project', 'delivery', 'task', 'subtask');
CREATE TYPE public.work_item_state AS ENUM ('backlog', 'ready', 'planned', 'in_progress', 'in_review', 'waiting_approval', 'approved', 'blocked', 'on_hold', 'cancelled', 'done', 'archived', 'reopened', 'deferred', 'failed');
CREATE TYPE public.priority AS ENUM ('critical', 'high', 'medium', 'low', 'none');
CREATE TYPE public.dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'approval', 'colleague', 'external_entity', 'date_milestone');
CREATE TYPE public.dependency_status AS ENUM ('pending', 'satisfied', 'waived');
CREATE TYPE public.time_entry_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'sms');
CREATE TYPE public.notification_event_type AS ENUM ('time_reminder', 'time_escalation', 'state_change', 'assignment', 'comment', 'dependency_resolved', 'dependency_blocked', 'approval_requested', 'approval_granted', 'approval_rejected', 'deadline_approaching', 'overdue', 'deviation_alert', 'capacity_overload');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.capacity_type AS ENUM ('full_time', 'part_time');
CREATE TYPE public.exception_type AS ENUM ('vacation', 'sick_leave', 'public_holiday', 'training', 'other_absence', 'extra_availability');
