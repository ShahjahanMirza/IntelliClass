import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
};
// Health check
export const checkHealth = async () => {
  try {
    // Simple test to check if Gemini API is accessible
    const result = await model.generateContent('Hello');
    return { status: 'healthy', message: 'Gemini API is accessible' };
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', message: 'Gemini API is not accessible' };
  }
};

// Test Gemini API connection and response structure
export const testGeminiConnection = async () => {
  console.log('=== GEMINI CONNECTION TEST START ===');
  console.log('Environment check:');
  console.log('- VITE_GEMINI_API_KEY exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log('- API Key length:', import.meta.env.VITE_GEMINI_API_KEY?.length || 0);
  console.log('- API Key preview:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
  
  try {
    console.log('Testing simple content generation...');
    const testPrompt = 'Generate a simple test response with the word "SUCCESS" in it.';
    
    const result = await model.generateContent(testPrompt);
    console.log('Test result object:', result);
    console.log('Test result type:', typeof result);
    console.log('Test result keys:', Object.keys(result || {}));
    
    const response = await result.response;
    console.log('Test response object:', response);
    console.log('Test response type:', typeof response);
    console.log('Test response keys:', Object.keys(response || {}));
    
    const text = response.text();
    console.log('Test text type:', typeof text);
    console.log('Test text length:', text?.length || 0);
    console.log('Test text content:', text);
    
    const testResult = {
      success: true,
      test_content: text,
      message: 'Gemini API test successful'
    };
    
    console.log('Test return object:', testResult);
    console.log('=== GEMINI CONNECTION TEST SUCCESS ===');
    
    return testResult;
  } catch (error: any) {
    console.error('=== GEMINI CONNECTION TEST ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('=== GEMINI CONNECTION TEST ERROR END ===');
    
    return {
      success: false,
      error: error.message,
      message: 'Gemini API test failed'
    };
  }
};

// OCR text extraction using backend API for PDFs and Gemini Vision for images
export const extractText = async (file: File) => {
  console.log('Calling extractText for file:', file.name, file.type, file.size);
  
  // Validate file type - now supporting both images and PDFs
  const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const supportedDocumentTypes = ['application/pdf'];
  const allSupportedTypes = [...supportedImageTypes, ...supportedDocumentTypes];
  
  if (!allSupportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, GIF, WebP images or PDF documents.`);
  }
  
  // Route to appropriate OCR method based on file type
  if (supportedDocumentTypes.includes(file.type)) {
    return await extractTextFromPDF(file);
  } else {
    return await extractTextFromImage(file);
  }
};

// Extract text from PDF using client-side PDF.js and Tesseract.js
const extractTextFromPDF = async (file: File) => {
  console.log('Processing PDF with client-side OCR:', file.name);
  
  try {
    // Dynamically import PDF.js
    const [pdfjsLib, pdfjsWorker, Tesseract] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      import('tesseract.js')
    ]);
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
    
    // Convert PDF to images using PDF.js
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allExtractedText = '';
    
    // Process each page of the PDF
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing PDF page ${pageNum}/${pdf.numPages}`);
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      
      // Create canvas to render PDF page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to blob for Tesseract
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      // Extract text from the rendered page using Tesseract
      const { data: { text } } = await Tesseract.default.recognize(blob, 'eng', {
        logger: (m) => console.log(`Page ${pageNum} OCR:`, m)
      });
      
      if (text.trim()) {
        allExtractedText += `\n--- Page ${pageNum} ---\n${text.trim()}\n`;
      }
    }
    
    if (!allExtractedText.trim()) {
      throw new Error('No text was extracted from the PDF. Please ensure the document contains readable text.');
    }
    
    return {
      success: true,
      extracted_text: allExtractedText.trim(),
      message: 'Text extracted successfully from PDF using client-side OCR',
      file_info: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
  } catch (error: any) {
    console.error('PDF OCR error:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid or corrupted PDF file. Please try a different document.');
    }
    
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Extract text from images using Tesseract.js
const extractTextFromImage = async (file: File) => {
  console.log('Processing image with Tesseract.js:', file.name);
  
  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Please use files smaller than 10MB.');
  }
  
  try {
    console.log('Starting Tesseract OCR processing...');
    
    // Dynamically import Tesseract.js
    const Tesseract = await import('tesseract.js');
    
    // Use Tesseract.js to extract text from the image
    const { data: { text, confidence } } = await Tesseract.default.recognize(file, 'eng', {
      logger: (m) => console.log('Tesseract OCR:', m)
    });
    
    console.log('Tesseract OCR completed. Confidence:', confidence);
    console.log('Extracted text:', text);
    
    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error('No text was extracted from the image. Please ensure the image contains readable text.');
    }
    
    // Check if confidence is too low (below 30%)
    if (confidence < 30) {
      console.warn('Low OCR confidence detected:', confidence);
    }
    
    return {
      success: true,
      extracted_text: text.trim(),
      message: `Text extracted successfully using Tesseract.js (confidence: ${confidence.toFixed(1)}%)`,
      file_info: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      confidence: confidence
    };
  } catch (error: any) {
    console.error('Tesseract OCR error:', error);
    
    // Enhanced error handling
    if (error.message?.includes('timeout')) {
      throw new Error('OCR processing timed out. Please try again with a smaller file.');
    }
    
    if (error.message?.includes('worker')) {
      throw new Error('OCR worker failed to initialize. Please refresh the page and try again.');
    }
    
    if (error.message?.includes('invalid') || error.message?.includes('corrupt')) {
      throw new Error('Invalid or corrupted image file. Please try a different image.');
    }
    
    // If it's already a custom error message, pass it through
    if (error.message?.startsWith('Unsupported file type') || 
        error.message?.startsWith('File size too large') ||
        error.message?.startsWith('No text was extracted')) {
      throw error;
    }
    
    // Generic fallback error
    throw new Error(`Failed to extract text from the image: ${error.message || 'Unknown error occurred'}. Please try with a different image.`);
  }
};
// AI document generation using Gemini
export const generateDocument = async (prompt: string, maxMarks: number = 100, daysUntilDue: number = 7) => {
  console.log('=== generateDocument DEBUG START ===');
  console.log('Input parameters:', { prompt, maxMarks, daysUntilDue });
  console.log('API Key available:', !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log('API Key length:', import.meta.env.VITE_GEMINI_API_KEY?.length || 0);
  
  try {
    const enhancedPrompt = `Generate an educational assignment based on the following requirements:

Topic/Subject: ${prompt}
Maximum Marks: ${maxMarks}
Days Until Due: ${daysUntilDue}

Please create a comprehensive assignment that includes:
1. Clear instructions for students
2. Specific questions or tasks
3. Grading criteria
4. Expected learning outcomes

Format the response as a well-structured assignment document.`;
    
    console.log('Enhanced prompt:', enhancedPrompt);
    console.log('Calling Gemini API...');
    
    const result = await model.generateContent(enhancedPrompt);
    console.log('Raw result object:', result);
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result || {}));
    
    const response = await result.response;
    console.log('Raw response object:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));
    
    const generatedContent = response.text();
    console.log('Generated content type:', typeof generatedContent);
    console.log('Generated content length:', generatedContent?.length || 0);
    console.log('Generated content preview:', generatedContent?.substring(0, 200));
    
    const returnObject = {
      success: true,
      generated_content: generatedContent,
      max_marks: maxMarks,
      days_until_due: daysUntilDue,
      message: 'Assignment generated successfully using Gemini'
    };
    
    console.log('Return object:', returnObject);
    console.log('Return object keys:', Object.keys(returnObject));
    console.log('=== generateDocument DEBUG END ===');
    
    return returnObject;
  } catch (error: any) {
    console.error('=== generateDocument ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('=== generateDocument ERROR END ===');
    throw new Error(`Failed to generate document: ${error.message}`);
  }
};
// Submission grading using Gemini
export const gradeSubmission = async (gradingMode: string, ocrText: string | null, generatedContent: any | null, gradingCriteria?: string, customInstructions?: string) => {
  console.log('Calling gradeSubmission with Gemini:', { gradingMode, ocrTextLength: ocrText?.length, generatedContent, gradingCriteria, customInstructions });
  
  try {
    let prompt = `Please grade the following student submission based on the provided criteria:

`;
    
    if (generatedContent) {
      prompt += `Assignment Content:\n${typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent)}\n\n`;
    }
    
    if (ocrText) {
      prompt += `Student Submission (OCR Text):\n${ocrText}\n\n`;
    }
    
    if (gradingCriteria) {
      prompt += `Grading Criteria:\n${gradingCriteria}\n\n`;
    }
    
    if (customInstructions) {
      prompt += `Additional Instructions:\n${customInstructions}\n\n`;
    }
    
    prompt += `Please provide:
1. A numerical grade (0-100)
2. Detailed feedback explaining the grade
3. Areas for improvement
4. Strengths in the submission

Format your response as JSON with the following structure:
{
  "grade": <numerical_grade>,
  "feedback": "<detailed_feedback>",
  "strengths": "<identified_strengths>",
  "improvements": "<areas_for_improvement>"
}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const gradingResult = response.text();
    
    console.log('gradeSubmission Gemini response:', gradingResult);
    
    // Try to parse JSON response, fallback to text if parsing fails
    try {
      const parsedResult = JSON.parse(gradingResult);
      console.log('Parsed grading result:', parsedResult);
      
      // Extract grade from different possible field names
      const grade = parsedResult.grade || parsedResult.marks || parsedResult.final_marks || parsedResult.score || 0;
      const feedback = parsedResult.feedback || parsedResult.review || parsedResult.comments || 'No feedback provided';
      
      console.log('Extracted grade:', grade, 'feedback length:', feedback.length);
      
      return {
        success: true,
        grade: Number(grade), // Ensure it's a number
        feedback: feedback,
        strengths: parsedResult.strengths || '',
        improvements: parsedResult.improvements || parsedResult.areas_for_improvement || '',
        final_marks: Number(grade), // Also set final_marks for compatibility
        review: feedback, // Also set review for compatibility
        message: 'Submission graded successfully using Gemini'
      };
    } catch (parseError) {
      console.log('JSON parse failed, using text format. Parse error:', parseError);
      return {
        success: true,
        grade: 0,
        feedback: gradingResult,
        final_marks: 0,
        review: gradingResult,
        message: 'Submission graded successfully using Gemini (text format)'
      };
    }
  } catch (error: any) {
    console.error('gradeSubmission Gemini error:', error);
    throw new Error(`Failed to grade submission: ${error.message}`);
  }
};

// Generate answers for assignments using Gemini
export const generateAnswers = async (assignmentContent: string, maxMarks: number = 100) => {
  console.log('=== generateAnswers DEBUG START ===');
  console.log('Input parameters:', { assignmentContent: assignmentContent?.substring(0, 200), maxMarks });
  console.log('API Key available:', !!import.meta.env.VITE_GEMINI_API_KEY);
  
  try {
    const prompt = `Based on the following assignment, generate comprehensive model answers:

Assignment Content:
${assignmentContent}

Maximum Marks: ${maxMarks}

Please provide:
1. Complete model answers for all questions/tasks
2. Key points that should be covered
3. Marking scheme breakdown
4. Alternative acceptable answers where applicable

Format the response clearly with proper headings and structure.`;
    
    console.log('Calling Gemini API for answers...');
    
    const result = await model.generateContent(prompt);
    console.log('Raw result object:', result);
    console.log('Result keys:', Object.keys(result || {}));
    
    const response = await result.response;
    console.log('Raw response object:', response);
    console.log('Response keys:', Object.keys(response || {}));
    
    const generatedAnswers = response.text();
    console.log('Generated answers type:', typeof generatedAnswers);
    console.log('Generated answers length:', generatedAnswers?.length || 0);
    console.log('Generated answers preview:', generatedAnswers?.substring(0, 200));
    
    const returnObject = {
      success: true,
      generated_answers: generatedAnswers,
      max_marks: maxMarks,
      message: 'Model answers generated successfully using Gemini'
    };
    
    console.log('Return object:', returnObject);
    console.log('Return object keys:', Object.keys(returnObject));
    console.log('=== generateAnswers DEBUG END ===');
    
    return returnObject;
  } catch (error: any) {
    console.error('=== generateAnswers ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('=== generateAnswers ERROR END ===');
    throw new Error(`Failed to generate answers: ${error.message}`);
  }
};
// Mock API for classes, assignments, and grades
// In a real app, these would be actual API calls to your backend
export const getClasses = async () => {
  console.log('Calling getClasses API');
  try {
    // Mock data - replace with actual Supabase calls
    await new Promise(resolve => setTimeout(resolve, 300));
    const classes = [
      { id: '1', name: 'Mathematics 101', subject: 'Mathematics', description: 'Basic algebra and geometry', color_scheme: 'blue' },
      { id: '2', name: 'Physics 101', subject: 'Physics', description: 'Introduction to mechanics', color_scheme: 'green' },
      { id: '3', name: 'Chemistry 101', subject: 'Chemistry', description: 'Basic chemical principles', color_scheme: 'red' }
    ];
    console.log('getClasses response:', classes);
    return classes;
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

export const createClass = async (classData: {
  name: string;
  subject: string;
  description: string;
  color_scheme: string;
}) => {
  console.log('Calling createClass with:', classData);
  try {
    // Mock create - replace with actual Supabase calls
    await new Promise(resolve => setTimeout(resolve, 500));
    const newClass = {
      id: Math.floor(Math.random() * 10000).toString(),
      ...classData
    };
    console.log('createClass response:', newClass);
    return newClass;
  } catch (error: any) {
    console.error('createClass error:', error);
    throw error;
  }
};
export const getAssignments = async (classId: string) => {
  console.log('Calling getAssignments for class:', classId);
  try {
    // Mock data - replace with actual Supabase calls
    await new Promise(resolve => setTimeout(resolve, 300));
    const assignments = [
      { 
        id: '1', 
        title: 'Algebra Basics', 
        content: 'Solve the following equations...', 
        max_marks: 100, 
        due_date: '2024-02-15',
        class_id: classId
      },
      { 
        id: '2', 
        title: 'Geometry Problems', 
        content: 'Calculate the area and perimeter...', 
        max_marks: 80, 
        due_date: '2024-02-20',
        class_id: classId
      }
    ];
    console.log('getAssignments response:', assignments);
    return assignments;
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};
export const getGrades = async (assignmentId: string) => {
  console.log('Calling getGrades for assignment:', assignmentId);
  try {
    // Mock data - replace with actual Supabase calls
    await new Promise(resolve => setTimeout(resolve, 300));
    const grades = [
      {
        id: '1',
        student_name: 'John Doe',
        score: 85,
        feedback: 'Good work on most problems',
        assignment_id: assignmentId,
        submitted_at: '2024-01-10T10:30:00.000Z'
      },
      {
        id: '2',
        student_name: 'Jane Smith',
        score: 92,
        feedback: 'Excellent understanding of concepts',
        assignment_id: assignmentId,
        submitted_at: '2024-01-11T14:20:00.000Z'
      }
    ];
    console.log('getGrades response:', grades);
    return grades;
  } catch (error: any) {
    console.error('Error fetching grades:', error);
    throw error;
  }
};
export const updateGrade = async (gradeId: string, marks: number) => {
  console.log('Calling updateGrade API with:', { gradeId, marks });
  try {
    // Import updateSubmission from supabase utils
    const { updateSubmission } = await import('./supabase');

    // Update the submission with the new grade
    const { data, error } = await updateSubmission(gradeId, {
      grade: marks,
      graded_at: new Date().toISOString(),
      graded_by: 'teacher'
    });

    if (error) {
      throw error;
    }

    const result = {
      success: true,
      gradeId,
      marks,
      data
    };
    console.log('updateGrade API response:', result);
    return result;
  } catch (error) {
    console.error('updateGrade API error:', error);
    throw error;
  }
};

export const createAssignment = async (assignmentData: {
  title: string;
  content: string;
  max_marks: number;
  due_date: string;
  class_id: string;
}) => {
  console.log('Calling createAssignment with:', assignmentData);
  try {
    // Mock create - replace with actual Supabase calls
    await new Promise(resolve => setTimeout(resolve, 500));
    const newAssignment = {
      id: Math.floor(Math.random() * 10000).toString(),
      ...assignmentData,
      created_at: new Date().toISOString()
    };
    console.log('createAssignment response:', newAssignment);
    return newAssignment;
  } catch (error: any) {
    console.error('createAssignment error:', error);
    throw error;
  }
};