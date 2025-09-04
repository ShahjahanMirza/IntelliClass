-- =====================================================
-- AI CLASSROOM PLATFORM - COMPLETE DATABASE SETUP
-- =====================================================
-- This script sets up the complete database for the AI classroom platform
-- Features: Unified authentication, OCR processing, automatic grading, Cloudinary integration
-- Run this script in your Supabase SQL Editor after creating a new project

-- =====================================================
-- STEP 1: ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: CREATE TABLES
-- =====================================================

-- Users table (unified authentication - no global role)
-- Users can be both teachers (for classes they create) AND students (for classes they join)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT, -- Cloudinary URL for profile pictures
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    class_code TEXT UNIQUE NOT NULL,
    color_scheme TEXT DEFAULT 'blue',
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class members table (handles both teachers and students)
-- A user can be a teacher in classes they created AND a student in classes they joined
CREATE TABLE public.class_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- Assignments table (supports AI-generated content)
CREATE TABLE public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Assignment content/instructions
    max_marks INTEGER NOT NULL DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    ai_prompt TEXT, -- Original AI prompt if AI-generated
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table (automatic OCR and grading ready)
CREATE TABLE public.submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL, -- Cloudinary URL for uploaded file
    file_name TEXT NOT NULL,
    file_type TEXT, -- pdf, jpg, png, etc.
    ocr_text TEXT, -- Extracted text from OCR API
    ocr_processed_at TIMESTAMP WITH TIME ZONE,
    grade INTEGER, -- Assigned grade
    max_grade INTEGER, -- Maximum possible grade for this assignment
    feedback TEXT, -- AI-generated or manual feedback
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'processing', 'completed', 'failed')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by TEXT DEFAULT 'system', -- 'system' for AI, user ID for manual
    UNIQUE(assignment_id, student_id)
);

-- Tickets table (grade disputes and support)
CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL, -- Student's reason for dispute
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    teacher_response TEXT,
    responded_by UUID REFERENCES public.users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('grade', 'assignment', 'class', 'ticket', 'system', 'info')) DEFAULT 'info',
    related_id UUID, -- ID of related entity (assignment, class, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads tracking table (for Cloudinary integration)
CREATE TABLE public.file_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    cloudinary_public_id TEXT NOT NULL,
    cloudinary_url TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    upload_purpose TEXT NOT NULL CHECK (upload_purpose IN ('avatar', 'assignment_submission', 'assignment_content', 'class_material')),
    related_id UUID, -- ID of related entity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class materials table (for teacher uploads - documents, presentations, images, etc.)
CREATE TABLE public.class_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL, -- Cloudinary URL
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- pdf, ppt, doc, jpg, etc.
    file_size INTEGER, -- in bytes
    cloudinary_public_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES (NON-RECURSIVE)
-- =====================================================

-- Users: Users can only access their own data
CREATE POLICY "users_own_data" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Classes: Simple policies to avoid recursion
-- Teachers can manage their own classes
CREATE POLICY "classes_teacher_manage" ON public.classes
    FOR ALL USING (teacher_id = auth.uid());

-- Anyone can read classes (we'll control access through class_members)
CREATE POLICY "classes_public_read" ON public.classes
    FOR SELECT USING (true);

-- Class Members: Direct policies without cross-references
-- Users can see their own memberships
CREATE POLICY "class_members_own_membership" ON public.class_members
    FOR SELECT USING (user_id = auth.uid());

-- Users can join classes (insert their own membership)
CREATE POLICY "class_members_join_classes" ON public.class_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Teachers can manage memberships for their classes (direct teacher_id check)
CREATE POLICY "class_members_teacher_manage" ON public.class_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_id AND teacher_id = auth.uid()
        )
    );

-- Assignments: Direct policies
-- Teachers can manage their own assignments
CREATE POLICY "assignments_teacher_manage" ON public.assignments
    FOR ALL USING (teacher_id = auth.uid());

-- Students can read assignments for classes they're members of
CREATE POLICY "assignments_student_read" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_id = assignments.class_id AND user_id = auth.uid()
        )
    );

-- Submissions: Direct policies
-- Students can manage their own submissions
CREATE POLICY "submissions_student_own" ON public.submissions
    FOR ALL USING (student_id = auth.uid());

-- Teachers can read/update submissions for their assignments
CREATE POLICY "submissions_teacher_access" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            WHERE id = assignment_id AND teacher_id = auth.uid()
        )
    );

CREATE POLICY "submissions_teacher_update" ON public.submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            WHERE id = assignment_id AND teacher_id = auth.uid()
        )
    );

-- Tickets: Direct policies
-- Students can manage their own tickets
CREATE POLICY "tickets_student_own" ON public.tickets
    FOR ALL USING (student_id = auth.uid());

-- Teachers can access tickets for their assignments
CREATE POLICY "tickets_teacher_access" ON public.tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            INNER JOIN public.assignments a ON s.assignment_id = a.id
            WHERE s.id = submission_id AND a.teacher_id = auth.uid()
        )
    );

-- Notifications: Users can only access their own notifications
CREATE POLICY "notifications_own_access" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- File uploads: Users can only access their own uploads
CREATE POLICY "file_uploads_own_access" ON public.file_uploads
    FOR ALL USING (user_id = auth.uid());

-- Class Materials: Teachers can manage materials for their classes, students can read
-- Teachers can manage their own class materials
CREATE POLICY "class_materials_teacher_manage" ON public.class_materials
    FOR ALL USING (teacher_id = auth.uid());

-- Students can read materials for classes they're members of
CREATE POLICY "class_materials_student_read" ON public.class_materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_id = class_materials.class_id AND user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 5: CREATE FUNCTIONS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically add teacher to their class as a member
CREATE OR REPLACE FUNCTION public.add_teacher_to_class()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.class_members (class_id, user_id, role)
    VALUES (NEW.id, NEW.teacher_id, 'teacher')
    ON CONFLICT (class_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
    target_user_id UUID,
    notification_title TEXT,
    notification_message TEXT,
    notification_type TEXT DEFAULT 'info',
    related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (target_user_id, notification_title, notification_message, notification_type, related_entity_id)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique class codes
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        new_code := upper(substring(md5(random()::text) from 1 for 6));

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.classes WHERE class_code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger OCR processing after submission
CREATE OR REPLACE FUNCTION public.trigger_ocr_processing()
RETURNS TRIGGER AS $$
BEGIN
    -- Update grading status to processing
    UPDATE public.submissions
    SET grading_status = 'processing'
    WHERE id = NEW.id;

    -- Create notification for student
    PERFORM public.create_notification(
        NEW.student_id,
        'Assignment Submitted',
        'Your assignment has been submitted and is being processed for grading.',
        'assignment',
        NEW.assignment_id
    );

    -- Create notification for teacher
    PERFORM public.create_notification(
        (SELECT teacher_id FROM public.assignments WHERE id = NEW.assignment_id),
        'New Submission',
        'A student has submitted an assignment that is being processed.',
        'assignment',
        NEW.assignment_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify students when new material is uploaded
CREATE OR REPLACE FUNCTION public.notify_students_new_material()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notifications for all students in the class
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT
        cm.user_id,
        'New Material Available',
        'New material "' || NEW.title || '" has been uploaded to your class.',
        'material',
        NEW.id
    FROM public.class_members cm
    WHERE cm.class_id = NEW.class_id
    AND cm.role = 'student';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to add teacher to their class when class is created
CREATE TRIGGER add_teacher_to_class_trigger
    AFTER INSERT ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.add_teacher_to_class();

-- Trigger to process submissions after upload
CREATE TRIGGER trigger_submission_processing
    AFTER INSERT ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_ocr_processing();

-- Triggers to update timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_materials_updated_at
    BEFORE UPDATE ON public.class_materials
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to notify students when new material is uploaded
CREATE TRIGGER notify_students_material_trigger
    AFTER INSERT ON public.class_materials
    FOR EACH ROW EXECUTE FUNCTION public.notify_students_new_material();

-- =====================================================
-- STEP 7: CREATE STORAGE BUCKETS (OPTIONAL - USING CLOUDINARY)
-- =====================================================

-- Note: This project uses Cloudinary for file storage, but we can create
-- Supabase storage buckets as backup or for specific use cases

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create assignments bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (if using Supabase storage)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for assignments (if using Supabase storage)
CREATE POLICY "Users can upload assignment files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'assignments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can access their own assignment files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'assignments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_grading_status ON public.submissions(grading_status);
CREATE INDEX IF NOT EXISTS idx_tickets_submission_id ON public.tickets(submission_id);
CREATE INDEX IF NOT EXISTS idx_tickets_student_id ON public.tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_class_id ON public.class_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_teacher_id ON public.class_materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_is_active ON public.class_materials(is_active);

-- =====================================================
-- STEP 9: INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- You can uncomment and modify this section to add sample data for testing

/*
-- Sample notification types for reference
INSERT INTO public.notifications (user_id, title, message, type) VALUES
(auth.uid(), 'Welcome!', 'Welcome to AI Classroom Platform', 'system');
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'AI Classroom Platform database setup completed successfully!' as status,
       'Tables created: users, classes, class_members, assignments, submissions, tickets, notifications, file_uploads, class_materials' as tables,
       'Features enabled: RLS policies, automatic triggers, OCR processing, Cloudinary integration, material notifications' as features;
