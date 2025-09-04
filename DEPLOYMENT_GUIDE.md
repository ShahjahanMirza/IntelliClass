# EduAI Platform - Deployment Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Supabase Account** with project set up
4. **Cloudinary Account** with upload preset configured
5. **OCR API Access** (current backend API)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd eduai-platform
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
VITE_CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# API Configuration
VITE_API_BASE_URL=your_backend_api_url
```

### 3. Database Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note down the project URL and anon key

2. **Run Database Schema**
   ```sql
   -- Execute the contents of database/schema.sql in Supabase SQL Editor
   -- Execute the contents of database/rls_policies.sql
   -- Execute the contents of database/functions.sql
   ```

3. **Enable Row Level Security**
   - Ensure RLS is enabled on all tables
   - Verify policies are working correctly

### 4. Cloudinary Setup

1. **Create Account** at https://cloudinary.com
2. **Create Upload Preset**:
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Name: `assignment_uploads`
   - Signing Mode: `Unsigned`
   - Folder: `assignments`
   - Resource Type: `Auto`
   - Access Mode: `Public`
   - File Size Limit: `10MB`
   - Allowed Formats: `pdf,png,jpg,jpeg,avif`

### 5. Backend API

Ensure your OCR and grading API is running and accessible. The frontend expects these endpoints:

- `POST /api/ocr/extract` - OCR text extraction
- `POST /api/grade` - Assignment grading

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure they start with `VITE_` for client-side access

### Option 2: Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Add in Netlify dashboard

### Option 3: Traditional Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload `dist` folder** to your web server

3. **Configure Web Server**
   - Ensure SPA routing works (redirect all routes to index.html)
   - Enable HTTPS
   - Set proper headers for security

## Post-Deployment Checklist

### 1. Verify Core Functionality
- [ ] User registration and login
- [ ] Class creation and joining
- [ ] Assignment creation and submission
- [ ] File upload and OCR processing
- [ ] Grading system
- [ ] Notifications
- [ ] Responsive design on mobile

### 2. Security Verification
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] RLS policies working
- [ ] File upload restrictions enforced
- [ ] Authentication working correctly

### 3. Performance Testing
- [ ] Page load times acceptable
- [ ] File uploads working smoothly
- [ ] Database queries optimized
- [ ] Real-time features responsive

### 4. Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Monitoring and Maintenance

### 1. Error Monitoring
Consider implementing:
- Sentry for error tracking
- LogRocket for user session recording
- Google Analytics for usage analytics

### 2. Database Monitoring
- Monitor Supabase usage and limits
- Set up alerts for high usage
- Regular backup verification

### 3. Performance Monitoring
- Monitor Core Web Vitals
- Track API response times
- Monitor file upload success rates

### 4. Security Monitoring
- Regular security audits
- Monitor for suspicious activity
- Keep dependencies updated

## Scaling Considerations

### 1. Database Scaling
- Monitor Supabase limits
- Consider read replicas for heavy read workloads
- Implement database connection pooling

### 2. File Storage Scaling
- Monitor Cloudinary usage and costs
- Consider CDN for better global performance
- Implement file cleanup policies

### 3. API Scaling
- Monitor backend API performance
- Implement rate limiting
- Consider API caching strategies

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check Cloudinary upload preset configuration
   - Verify file size and type restrictions
   - Check network connectivity

2. **Authentication Issues**
   - Verify Supabase configuration
   - Check RLS policies
   - Ensure environment variables are correct

3. **OCR Not Working**
   - Verify backend API is running
   - Check API endpoint URLs
   - Verify file format compatibility

4. **Real-time Features Not Working**
   - Check Supabase real-time configuration
   - Verify WebSocket connections
   - Check browser console for errors

### Support

For technical support:
1. Check browser console for errors
2. Verify all environment variables
3. Test with different browsers
4. Check network connectivity
5. Review Supabase logs

## Backup and Recovery

### 1. Database Backup
- Supabase provides automatic backups
- Consider additional backup strategies for critical data
- Test restore procedures regularly

### 2. File Backup
- Cloudinary provides redundancy
- Consider additional backup for critical files
- Implement file versioning if needed

### 3. Code Backup
- Use Git for version control
- Maintain multiple deployment environments
- Document deployment procedures

## Success Metrics

Track these metrics post-deployment:
- User registration and retention rates
- Assignment submission success rates
- File upload success rates
- OCR processing accuracy
- System uptime and performance
- User satisfaction scores

## Conclusion

The EduAI platform is production-ready with proper configuration. Follow this guide carefully and test thoroughly before going live. Regular monitoring and maintenance will ensure optimal performance and user experience.
