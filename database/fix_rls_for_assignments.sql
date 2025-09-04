-- RLS policies for the 'assignments' table

-- Enable RLS on the assignments table
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "teachers_can_manage_assignments" ON public.assignments;
DROP POLICY IF EXISTS "students_can_view_assignments" ON public.assignments;

-- Policy for teachers to manage assignments in their classes
CREATE POLICY "teachers_can_manage_assignments"
ON public.assignments
FOR ALL
USING (
  -- The user must be the teacher of the class the assignment belongs to
  (SELECT teacher_id FROM public.classes WHERE id = class_id) = auth.uid()
)
WITH CHECK (
  -- The user must be the teacher of the class the assignment belongs to
  (SELECT teacher_id FROM public.classes WHERE id = class_id) = auth.uid()
);

-- Policy for students to view assignments in their classes
CREATE POLICY "students_can_view_assignments"
ON public.assignments
FOR SELECT
USING (
  -- The user must be a member of the class the assignment belongs to
  EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE class_id = assignments.class_id
    AND user_id = auth.uid()
  )
);
