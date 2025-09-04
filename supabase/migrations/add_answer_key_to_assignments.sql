-- Add answer_key field to assignments table
ALTER TABLE public.assignments 
ADD COLUMN answer_key TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN public.assignments.answer_key IS 'AI-generated answer key for the assignment';