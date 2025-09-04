-- CRITICAL FIX: Allow teachers to see student data in their classes
-- Run this in your Supabase SQL editor

-- Step 1: Drop the existing restrictive policy
DROP POLICY IF EXISTS "users_own_data" ON public.users;

-- Step 2: Create a more permissive policy for class context
CREATE POLICY "class_members_can_see_each_other" ON public.users
    FOR SELECT USING (
        -- Users can see their own data
        auth.uid() = id
        OR
        -- Users can see other users in the same classes
        EXISTS (
            SELECT 1 FROM public.class_members cm1
            INNER JOIN public.class_members cm2 ON cm1.class_id = cm2.class_id
            WHERE cm1.user_id = auth.uid()
            AND cm2.user_id = users.id
        )
        OR
        -- Teachers can see all students in their classes
        EXISTS (
            SELECT 1 FROM public.classes c
            INNER JOIN public.class_members cm ON c.id = cm.class_id
            WHERE c.teacher_id = auth.uid()
            AND cm.user_id = users.id
        )
    );

-- Step 3: Keep the update/insert/delete policy restrictive (users can only modify their own data)
CREATE POLICY "users_can_update_own_data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_delete_own_data" ON public.users
    FOR DELETE USING (auth.uid() = id);

-- Optional: Create a helper function for getting class members (not required if RLS is fixed)
CREATE OR REPLACE FUNCTION get_class_members_with_users(class_id_param UUID)
RETURNS TABLE (
    id UUID,
    role TEXT,
    joined_at TIMESTAMPTZ,
    user_id UUID,
    users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id,
        cm.role,
        cm.joined_at,
        cm.user_id,
        jsonb_build_object(
            'id', u.id,
            'name', COALESCE(u.name, 'Student ' || RIGHT(u.id::text, 8)),
            'email', COALESCE(u.email, 'Email not available')
        ) as users
    FROM public.class_members cm
    LEFT JOIN public.users u ON cm.user_id = u.id
    WHERE cm.class_id = class_id_param
    ORDER BY cm.role DESC, u.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_class_members_with_users(UUID) TO authenticated;

-- That's it! The RLS policy fix should be sufficient.
-- After running this script, your application should show proper student names and emails.
