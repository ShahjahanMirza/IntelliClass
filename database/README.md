# AI Classroom Platform - Database Setup Guide

## Overview
This directory contains the complete database setup for the AI Classroom Platform with unified authentication, OCR processing, and automatic grading capabilities.

## Files
- `complete_database_setup.sql` - Complete database setup script (run this in Supabase SQL Editor)

## Features Included

### 🔐 Unified Authentication System
- Users can be both teachers (for classes they create) AND students (for classes they join)
- No global role column - roles are determined by class membership
- Secure Row Level Security (RLS) policies

### 📚 Core Tables
1. **users** - User profiles (linked to auth.users)
2. **classes** - Class information with unique codes
3. **class_members** - Junction table for user-class relationships with roles
4. **assignments** - Assignment details (supports AI-generated content)
5. **submissions** - Student submissions with OCR and grading support
6. **tickets** - Grade dispute system
7. **notifications** - User notifications
8. **file_uploads** - Cloudinary file tracking

### 🤖 AI Integration Features
- **OCR Processing**: Automatic text extraction from uploaded files
- **Auto Grading**: Integration with external grading API
- **AI Content Generation**: Support for AI-generated assignments
- **Cloudinary Integration**: File storage and management

### 🔒 Security Features
- Row Level Security (RLS) on all tables
- Secure functions with SECURITY DEFINER
- Proper foreign key constraints
- Input validation and constraints

### ⚡ Performance Optimizations
- Strategic indexes on frequently queried columns
- Efficient query patterns for RLS policies
- Optimized for the application's access patterns

## Setup Instructions

### 1. Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for project initialization to complete

### 2. Update Application Credentials
Update these files with your new project credentials:

**`.env` file:**
```env
VITE_SUPABASE_URL=your_new_supabase_url
VITE_SUPABASE_ANON_KEY=your_new_supabase_anon_key
```

**`src/utils/supabase.ts` (fallback values):**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_new_supabase_url';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_new_supabase_anon_key';
```

### 3. Run Database Setup
1. Open Supabase SQL Editor in your project dashboard
2. Copy the entire content of `complete_database_setup.sql`
3. Paste and run the script
4. Verify the success message appears

### 4. Verify Setup
Check that these tables were created:
- ✅ users
- ✅ classes  
- ✅ class_members
- ✅ assignments
- ✅ submissions
- ✅ tickets
- ✅ notifications
- ✅ file_uploads

### 5. Test Authentication
1. Start your application: `npm run dev`
2. Try registering a new user
3. Verify user profile is created automatically
4. Test creating and joining classes

## Key Workflow Features

### Assignment Submission & Grading
1. **Student uploads file** → Stored in Cloudinary
2. **Automatic OCR trigger** → Text extracted via API
3. **Auto grading trigger** → Grade calculated via AI API
4. **Notifications sent** → Student and teacher notified
5. **Grade disputes** → Ticket system for appeals

### Class Management
1. **Teacher creates class** → Unique code generated
2. **Auto-membership** → Teacher automatically added as member
3. **Student joins** → Uses class code to join
4. **Role-based access** → Different permissions per role

### File Management
1. **Cloudinary primary** → All files stored in Cloudinary
2. **Supabase backup** → Optional storage buckets available
3. **File tracking** → Database tracks all uploads
4. **Security** → RLS policies protect file access

## Troubleshooting

### Common Issues
1. **RLS Policy Errors**: Ensure user is authenticated before accessing data
2. **Foreign Key Violations**: Check that referenced records exist
3. **Permission Denied**: Verify RLS policies allow the operation
4. **Function Errors**: Check function logs in Supabase dashboard

### Debug Queries
```sql
-- Check user profile creation
SELECT * FROM auth.users;
SELECT * FROM public.users;

-- Check class membership
SELECT c.name, cm.role, u.name as user_name 
FROM classes c 
JOIN class_members cm ON c.id = cm.class_id 
JOIN users u ON cm.user_id = u.id;

-- Check submission processing
SELECT s.*, a.title as assignment_title 
FROM submissions s 
JOIN assignments a ON s.assignment_id = a.id;
```

## API Integration

### External APIs Used
- **OCR API**: `https://fyp-backend-xah8.onrender.com/api/ocr/extract`
- **Grading API**: `https://fyp-backend-xah8.onrender.com/api/grade/submission`
- **Document Generation**: `https://fyp-backend-xah8.onrender.com/api/generate/document`

### Cloudinary Configuration
Ensure these environment variables are set:
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

## Support
If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify all environment variables are set
3. Ensure external APIs are accessible
4. Test with sample data first

---
**Note**: This setup creates a production-ready database with all security and performance optimizations. The unified authentication system allows maximum flexibility for users to participate in multiple roles across different classes.
