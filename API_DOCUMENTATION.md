# OCR Document Processing & AI Grading Backend API Documentation

## Overview

This backend API provides three core functionalities for educational applications:

1. **OCR Text Extraction** - Extract text from PDF documents and images
2. **Document Generation** - Create educational content with AI assistance  
3. **Automated Grading** - Grade student submissions with detailed feedback

## Base URL

```
https://fyp-backend-xah8.onrender.com
```

## Authentication

The API uses environment variables for AI service authentication. Required API keys:

- `MISTRAL_API_KEY` - For OCR processing
- `GEMINI_API_KEY` - For document generation  
- `GROQ_API_KEY` - For grading functionality

## API Endpoints

### 1. Health Check

Check API status and service availability.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "mistral_ocr": true,
    "gemini_generator": true,
    "groq_grading": true
  },
  "timestamp": "2025-06-24T15:30:00.000Z"
}
```

**Status Codes:**
- `200` - API healthy
- `500` - Service issues

---

### 2. OCR Text Extraction

Extract text from uploaded documents using Mistral OCR.

**Endpoint:** `POST /api/ocr/extract`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (required) - Document file to process

**Supported Formats:**
- PDF documents
- Images: PNG, JPG, JPEG, AVIF

**Request Example:**
```javascript
const formData = new FormData();
formData.append('file', documentFile);

fetch('/api/ocr/extract', {
  method: 'POST',
  body: formData
})
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "extracted_text": "The complete extracted text content...",
    "filename": "document.pdf",
    "file_type": "pdf",
    "extraction_timestamp": "2025-06-24T15:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// No file uploaded (400)
{
  "success": false,
  "error": "No file uploaded"
}

// Unsupported file type (400)
{
  "success": false,
  "error": "Unsupported file type: doc",
  "supported_types": ["pdf", "png", "jpg", "jpeg", "avif"]
}

// Processing failed (400)
{
  "success": false,
  "error": "Failed to extract text from document"
}
```

---

### 3. Document Generation

Generate educational content using Gemini AI.

**Endpoint:** `POST /api/generate/document`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "prompt": "Create a mathematics assignment about quadratic equations for high school students",
  "max_marks": 100,
  "days_until_due": 7
}
```

**Parameters:**
- `prompt` (string, required) - Description of content to generate
- `max_marks` (integer, optional) - Maximum marks for assignment (1-1000, default: 100)
- `days_until_due` (integer, optional) - Days until due date (1-365, default: 7)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "content": "# Quadratic Equations Assignment\n\n## Learning Objectives\n...",
    "due_date": "2025-07-01T15:30:00.000Z",
    "marks": 85,
    "max_marks": 100,
    "generated_at": "2025-06-24T15:30:00.000Z",
    "prompt_used": "Create a mathematics assignment..."
  }
}
```

**Error Responses:**
```json
// Missing prompt (400)
{
  "success": false,
  "error": "Prompt is required"
}

// Invalid max_marks (400)
{
  "success": false,
  "error": "max_marks must be an integer between 1 and 1000"
}
```

---

### 4. Submission Grading

Grade student submissions using Groq AI with detailed feedback.

**Endpoint:** `POST /api/grade/submission`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "grading_mode": "Compare OCR'd content with Generated document",
  "ocr_text": "Student's submission text extracted from their document...",
  "generated_content": {
    "content": "Original assignment content...",
    "max_marks": 100,
    "marks": 85,
    "due_date": "2025-07-01T15:30:00.000Z"
  },
  "grading_criteria": "Focus on mathematical accuracy and step-by-step solutions",
  "custom_instructions": "Be thorough in checking calculation steps"
}
```

**Parameters:**
- `grading_mode` (string, required) - One of:
  - `"Compare OCR'd content with Generated document"` - Compare submission with original
  - `"Grade OCR'd content only"` - Grade submission independently  
  - `"Grade Generated content only"` - Evaluate generated content quality
- `ocr_text` (string) - Student submission text (required for OCR modes)
- `generated_content` (object) - Original assignment data (required for comparison/generated modes)
- `grading_criteria` (string, optional) - Specific grading criteria
- `custom_instructions` (string, optional) - Additional grading instructions

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "final_marks": 78,
    "max_marks": 100,
    "percentage": 78.0,
    "grade_letter": "B+",
    "review": "The student demonstrates good understanding of quadratic equations. Calculations are mostly correct with minor errors in the final step...",
    "improvement": -7,
    "breakdown": {
      "Accuracy": "8/10",
      "Completeness": "7/10", 
      "Understanding": "8/10",
      "Presentation": "7/10"
    },
    "graded_at": "2025-06-24T15:30:00.000Z",
    "grading_mode": "Compare OCR'd content with Generated document"
  }
}
```

**Error Responses:**
```json
// Invalid grading mode (400)
{
  "success": false,
  "error": "Invalid grading mode: invalid_mode",
  "valid_modes": ["Compare OCR'd content with Generated document", "Grade OCR'd content only", "Grade Generated content only"]
}

// Missing required data (400)
{
  "success": false,
  "error": "Both OCR text and generated content are required for comparison grading"
}
```

---

### 5. API Information

Get comprehensive API information and endpoint details.

**Endpoint:** `GET /api/info`

**Response:**
```json
{
  "success": true,
  "api_info": {
    "name": "OCR Document Processing & AI Grading API",
    "version": "1.0.0",
    "description": "Backend API for OCR text extraction, document generation, and automated grading",
    "endpoints": {
      "health_check": {
        "method": "GET",
        "path": "/health",
        "description": "Check API health and service status"
      },
      "ocr_extraction": {
        "method": "POST", 
        "path": "/api/ocr/extract",
        "description": "Extract text from uploaded documents using Mistral OCR",
        "supported_formats": ["pdf", "png", "jpg", "jpeg", "avif"]
      },
      "document_generation": {
        "method": "POST",
        "path": "/api/generate/document", 
        "description": "Generate educational documents using Gemini AI",
        "required_fields": ["prompt"],
        "optional_fields": ["max_marks", "days_until_due"]
      },
      "submission_grading": {
        "method": "POST",
        "path": "/api/grade/submission",
        "description": "Grade submissions using Groq AI",
        "grading_modes": [
          "Compare OCR'd content with Generated document",
          "Grade OCR'd content only", 
          "Grade Generated content only"
        ]
      }
    },
    "services": {
      "mistral_ocr": "mistral-ocr-latest model for document text extraction",
      "gemini_generator": "gemini-2.5-flash for educational content generation",
      "groq_grading": "llama-3.3-70b-versatile for fast submission grading"
    }
  }
}
```

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error category",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. This can be added for production use.

## CORS

CORS is enabled for all origins by default. Configure `CORS_ORIGINS` environment variable for production.

## Integration Examples

### Frontend JavaScript/React

```javascript
// OCR Text Extraction
async function extractText(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/ocr/extract', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// Document Generation  
async function generateDocument(prompt, maxMarks = 100, daysUntilDue = 7) {
  const response = await fetch('/api/generate/document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      max_marks: maxMarks,
      days_until_due: daysUntilDue
    })
  });
  
  return await response.json();
}

// Submission Grading
async function gradeSubmission(ocrText, generatedContent, mode = 'Compare OCR\'d content with Generated document') {
  const response = await fetch('/api/grade/submission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grading_mode: mode,
      ocr_text: ocrText,
      generated_content: generatedContent
    })
  });
  
  return await response.json();
}
```

### Python Client

```python
import requests

# OCR Text Extraction
def extract_text(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post('/api/ocr/extract', files=files)
    return response.json()

# Document Generation
def generate_document(prompt, max_marks=100, days_until_due=7):
    data = {
        'prompt': prompt,
        'max_marks': max_marks,
        'days_until_due': days_until_due
    }
    response = requests.post('/api/generate/document', json=data)
    return response.json()

# Submission Grading
def grade_submission(ocr_text, generated_content, mode='Compare OCR\'d content with Generated document'):
    data = {
        'grading_mode': mode,
        'ocr_text': ocr_text,
        'generated_content': generated_content
    }
    response = requests.post('/api/grade/submission', json=data)
    return response.json()
```

### cURL Examples

```bash
# Health Check
curl -X GET http://localhost:5001/health

# OCR Text Extraction
curl -X POST http://localhost:5001/api/ocr/extract \
  -F "file=@document.pdf"

# Document Generation
curl -X POST http://localhost:5001/api/generate/document \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a history quiz about World War II",
    "max_marks": 50,
    "days_until_due": 5
  }'

# Submission Grading
curl -X POST http://localhost:5001/api/grade/submission \
  -H "Content-Type: application/json" \
  -d '{
    "grading_mode": "Grade OCR'\''d content only",
    "ocr_text": "Student answer content here..."
  }'
```

## Deployment

### Environment Variables

Required:
```bash
MISTRAL_API_KEY=your_mistral_api_key
GEMINI_API_KEY=your_gemini_api_key  
GROQ_API_KEY=your_groq_api_key
```

Optional:
```bash
FLASK_DEBUG=false
SECRET_KEY=your_secret_key_for_production
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Production Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MISTRAL_API_KEY="..."
export GEMINI_API_KEY="..."
export GROQ_API_KEY="..."

# Run with production server
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## Support

- Check `/health` endpoint for service status
- Refer to `/api/info` for endpoint documentation
- All endpoints return detailed error messages for troubleshooting