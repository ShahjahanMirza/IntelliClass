from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import traceback

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.mistral_client import MistralClient
from utils.gemini_client import GeminiClient
from utils.groq_client import GroqClient
from utils.tesseract_client import TesseractClient
from utils.simple_ocr import SimpleOCR

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize clients globally
mistral_client = None
gemini_client = None
groq_client = None
tesseract_client = None
simple_ocr = None

def initialize_clients():
    """Initialize all AI clients"""
    global mistral_client, gemini_client, groq_client, tesseract_client, simple_ocr
    try:
        mistral_client = MistralClient()
        gemini_client = GeminiClient()
        groq_client = GroqClient()
        tesseract_client = TesseractClient()
        simple_ocr = SimpleOCR()
        return True
    except Exception as e:
        print(f"Error initializing clients: {str(e)}")
        return False

def startup():
    """Initialize clients on startup"""
    if not initialize_clients():
        print("Warning: Failed to initialize some clients")

# Initialize clients when module loads
startup()

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': str(error)
    }), 400

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': str(error)
    }), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test client connections
        mistral_status = mistral_client.test_connection() if mistral_client else False
        gemini_status = gemini_client.test_connection() if gemini_client else False
        groq_status = groq_client.test_connection() if groq_client else False
        tesseract_status = tesseract_client.test_connection() if tesseract_client else False
        simple_ocr_status = simple_ocr.test_connection() if simple_ocr else False
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'services': {
                'mistral_ocr': mistral_status,
                'gemini_generator': gemini_status,
                'groq_grading': groq_status,
                'tesseract_ocr': tesseract_status,
                'simple_ocr': simple_ocr_status
            },
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Health check failed',
            'message': str(e)
        }), 500

# OCR Text Extraction Endpoint
@app.route('/api/ocr/extract', methods=['POST'])
def extract_text():
    """Extract text from uploaded document using OCR (Mistral with Tesseract fallback)"""
    try:
        # Check if file is uploaded
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        # Validate file type
        allowed_extensions = {'pdf', 'png', 'jpg', 'jpeg', 'avif'}
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_extension not in allowed_extensions:
            return jsonify({
                'success': False,
                'error': f'Unsupported file type: {file_extension}',
                'supported_types': list(allowed_extensions)
            }), 400

        extracted_text = None
        ocr_method = None
        
        # Try Mistral OCR first
        if mistral_client:
            try:
                extracted_text = mistral_client.process_uploaded_file(file)
                if extracted_text:
                    ocr_method = "mistral"
            except Exception as e:
                print(f"Mistral OCR failed: {e}")
        
        # If Mistral failed, try Tesseract as backup
        if not extracted_text and tesseract_client:
            try:
                file.seek(0)  # Reset file pointer
                extracted_text = tesseract_client.process_uploaded_file(file)
                if extracted_text:
                    ocr_method = "tesseract"
            except Exception as e:
                print(f"Tesseract OCR failed: {e}")
        
        # If both failed, try simple OCR as last resort
        if not extracted_text and simple_ocr:
            try:
                file.seek(0)  # Reset file pointer
                extracted_text = simple_ocr.process_uploaded_file(file)
                if extracted_text:
                    ocr_method = "simple"
            except Exception as e:
                print(f"Simple OCR failed: {e}")
        
        # Return result
        if extracted_text:
            return jsonify({
                'success': True,
                'data': {
                    'extracted_text': extracted_text,
                    'filename': file.filename,
                    'file_type': file_extension,
                    'ocr_method': ocr_method,
                    'extraction_timestamp': datetime.utcnow().isoformat()
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to extract text from document using all available OCR services'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'OCR extraction failed',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Document Generation Endpoint
@app.route('/api/generate/document', methods=['POST'])
def generate_document():
    """Generate educational document using Gemini AI"""
    try:
        if not gemini_client:
            return jsonify({
                'success': False,
                'error': 'Gemini client not initialized'
            }), 500

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        # Validate required fields
        prompt = data.get('prompt', '').strip()
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt is required'
            }), 400

        max_marks = data.get('max_marks', 100)
        days_until_due = data.get('days_until_due', 7)

        # Validate inputs
        if not isinstance(max_marks, int) or max_marks < 1 or max_marks > 1000:
            return jsonify({
                'success': False,
                'error': 'max_marks must be an integer between 1 and 1000'
            }), 400

        if not isinstance(days_until_due, int) or days_until_due < 1 or days_until_due > 365:
            return jsonify({
                'success': False,
                'error': 'days_until_due must be an integer between 1 and 365'
            }), 400

        # Calculate due date
        due_date = datetime.now() + timedelta(days=days_until_due)

        # Generate document
        generated_content = gemini_client.generate_document(
            prompt=prompt,
            max_marks=max_marks,
            due_date=due_date
        )

        if generated_content:
            return jsonify({
                'success': True,
                'data': {
                    'content': generated_content['content'],
                    'due_date': generated_content['due_date'].isoformat(),
                    'marks': generated_content['marks'],
                    'max_marks': generated_content['max_marks'],
                    'generated_at': generated_content['generated_at'].isoformat(),
                    'prompt_used': generated_content['prompt_used']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate document'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Document generation failed',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Grading Endpoint
@app.route('/api/grade/submission', methods=['POST'])
def grade_submission():
    """Grade submission using Groq AI"""
    try:
        if not groq_client:
            return jsonify({
                'success': False,
                'error': 'Groq client not initialized'
            }), 500

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        # Extract grading parameters
        grading_mode = data.get('grading_mode', 'Compare OCR\'d content with Generated document')
        ocr_text = data.get('ocr_text', '')
        generated_content = data.get('generated_content', {})
        grading_criteria = data.get('grading_criteria', '')
        custom_instructions = data.get('custom_instructions', '')

        # Validate grading mode
        valid_modes = [
            'Compare OCR\'d content with Generated document',
            'Grade OCR\'d content only',
            'Grade Generated content only'
        ]
        
        if grading_mode not in valid_modes:
            return jsonify({
                'success': False,
                'error': f'Invalid grading mode: {grading_mode}',
                'valid_modes': valid_modes
            }), 400

        # Validate required data based on mode
        if grading_mode == 'Grade OCR\'d content only' and not ocr_text.strip():
            return jsonify({
                'success': False,
                'error': 'OCR text is required for OCR-only grading'
            }), 400

        if grading_mode == 'Grade Generated content only' and not generated_content:
            return jsonify({
                'success': False,
                'error': 'Generated content is required for generated content grading'
            }), 400

        if grading_mode == 'Compare OCR\'d content with Generated document':
            if not ocr_text.strip() or not generated_content:
                return jsonify({
                    'success': False,
                    'error': 'Both OCR text and generated content are required for comparison grading'
                }), 400

        # Prepare grading parameters
        grading_params = {
            'mode': grading_mode,
            'criteria': grading_criteria if grading_criteria.strip() else None,
            'instructions': custom_instructions if custom_instructions.strip() else None
        }

        # Perform grading
        grading_result = groq_client.grade_submission(
            ocr_text=ocr_text,
            generated_content=generated_content,
            grading_params=grading_params
        )

        if grading_result:
            # Format the response
            response_data = {
                'final_marks': grading_result['final_marks'],
                'max_marks': grading_result['max_marks'],
                'percentage': round(grading_result['percentage'], 1),
                'grade_letter': grading_result['grade_letter'],
                'review': grading_result['review'],
                'graded_at': grading_result['graded_at'].isoformat(),
                'grading_mode': grading_mode
            }

            # Add improvement if available
            if 'improvement' in grading_result:
                response_data['improvement'] = grading_result['improvement']

            # Add breakdown if available
            if 'breakdown' in grading_result:
                response_data['breakdown'] = grading_result['breakdown']

            return jsonify({
                'success': True,
                'data': response_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to grade submission'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Grading failed',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

# API Information Endpoint
@app.route('/api/info', methods=['GET'])
def api_info():
    """Get API information and available endpoints"""
    return jsonify({
        'success': True,
        'api_info': {
            'name': 'OCR Document Processing & AI Grading API',
            'version': '1.0.0',
            'description': 'Backend API for OCR text extraction, document generation, and automated grading',
            'endpoints': {
                'health_check': {
                    'method': 'GET',
                    'path': '/health',
                    'description': 'Check API health and service status'
                },
                'ocr_extraction': {
                    'method': 'POST',
                    'path': '/api/ocr/extract',
                    'description': 'Extract text from uploaded documents using Mistral OCR',
                    'supported_formats': ['pdf', 'png', 'jpg', 'jpeg', 'avif']
                },
                'document_generation': {
                    'method': 'POST',
                    'path': '/api/generate/document',
                    'description': 'Generate educational documents using Gemini AI',
                    'required_fields': ['prompt'],
                    'optional_fields': ['max_marks', 'days_until_due']
                },
                'submission_grading': {
                    'method': 'POST',
                    'path': '/api/grade/submission',
                    'description': 'Grade submissions using Groq AI',
                    'grading_modes': [
                        'Compare OCR\'d content with Generated document',
                        'Grade OCR\'d content only',
                        'Grade Generated content only'
                    ]
                }
            },
            'services': {
                'mistral_ocr': 'mistral-ocr-latest model for document text extraction',
                'gemini_generator': 'gemini-2.5-flash for educational content generation',
                'groq_grading': 'llama-3.3-70b-versatile for fast submission grading'
            }
        }
    })

if __name__ == '__main__':
    print("Starting OCR Document Processing & AI Grading Backend...")
    print("Initializing AI clients...")
    
    if not initialize_clients():
        print("Warning: Some clients failed to initialize. Check your API keys.")
    
    print("Backend ready!")
    app.run(host='0.0.0.0', port=5001, debug=False)