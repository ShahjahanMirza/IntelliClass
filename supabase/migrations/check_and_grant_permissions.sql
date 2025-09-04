-- Check current permissions for anon and authenticated roles
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon role for basic read access
GRANT SELECT ON assignments TO anon;
GRANT SELECT ON class_members TO anon;
GRANT SELECT ON classes TO anon;
GRANT SELECT ON file_uploads TO anon;
GRANT SELECT ON notifications TO anon;
GRANT SELECT ON submissions TO anon;
GRANT SELECT ON tickets TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON class_materials TO anon;
GRANT SELECT ON video_rooms TO anon;
GRANT SELECT ON room_participants TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON assignments TO authenticated;
GRANT ALL PRIVILEGES ON class_members TO authenticated;
GRANT ALL PRIVILEGES ON classes TO authenticated;
GRANT ALL PRIVILEGES ON file_uploads TO authenticated;
GRANT ALL PRIVILEGES ON notifications TO authenticated;
GRANT ALL PRIVILEGES ON submissions TO authenticated;
GRANT ALL PRIVILEGES ON tickets TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON class_materials TO authenticated;
GRANT ALL PRIVILEGES ON video_rooms TO authenticated;
GRANT ALL PRIVILEGES ON room_participants TO authenticated;

-- Verify permissions after granting
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;