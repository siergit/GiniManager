-- Work items (central table)
CREATE TABLE public.work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE,
  item_type work_item_type NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  state work_item_state NOT NULL DEFAULT 'backlog',
  priority priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  estimated_minutes INTEGER DEFAULT 0 CHECK (estimated_minutes >= 0),
  actual_minutes INTEGER DEFAULT 0 CHECK (actual_minutes >= 0),
  remaining_minutes INTEGER DEFAULT 0 CHECK (remaining_minutes >= 0),
  progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  progress_override NUMERIC(5,2) CHECK (progress_override >= 0 AND progress_override <= 100),
  risk_level risk_level DEFAULT 'low',
  deviation_pct NUMERIC(7,2) DEFAULT 0,
  blocked_reason TEXT,
  state_changed_at TIMESTAMPTZ DEFAULT now(),
  state_changed_by UUID REFERENCES public.users(id),
  color TEXT,
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  path LTREE,
  depth INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_blocked_reason CHECK (state != 'blocked' OR blocked_reason IS NOT NULL)
);

CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES public.users(id),
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.work_item_state_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  from_state work_item_state,
  to_state work_item_state NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
