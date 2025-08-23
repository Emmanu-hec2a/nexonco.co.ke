from flask import Flask, request, jsonify, render_template_string, render_template
from flask_cors import CORS
from datetime import datetime
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from functools import wraps
import sqlite3
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration - replace with your actual values
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    
    # Email configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')  # Use app password for Gmail
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # Admin email to receive contact form submissions
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')
    
    # Database
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'contact_submissions.db'

app.config.from_object(Config)

# Rate limiting decorator (simple in-memory implementation)
submission_counts = {}

def rate_limit(max_requests=5, window_minutes=60):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            current_time = datetime.now()
            
            # Clean old entries
            cutoff_time = current_time.timestamp() - (window_minutes * 60)
            if client_ip in submission_counts:
                submission_counts[client_ip] = [
                    timestamp for timestamp in submission_counts[client_ip] 
                    if timestamp > cutoff_time
                ]
            
            # Check rate limit
            if client_ip in submission_counts:
                if len(submission_counts[client_ip]) >= max_requests:
                    return jsonify({
                        'success': False,
                        'error': 'Too many requests. Please try again later.',
                        'code': 'RATE_LIMIT_EXCEEDED'
                    }), 429
            
            # Add current request
            if client_ip not in submission_counts:
                submission_counts[client_ip] = []
            submission_counts[client_ip].append(current_time.timestamp())
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Database setup
def init_db():
    """Initialize the database with contact submissions table"""
    conn = sqlite3.connect(app.config['DATABASE_URL'])
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            organization TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            interest TEXT NOT NULL,
            message TEXT,
            ip_address TEXT,
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'new'
        )
    ''')
    
    conn.commit()
    conn.close()

def save_submission(data, request_info):
    """Save contact submission to database"""
    conn = sqlite3.connect(app.config['DATABASE_URL'])
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO contact_submissions 
        (full_name, organization, email, phone, interest, message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['fullName'],
        data['organization'],
        data['email'],
        data.get('phone', ''),
        data['interest'],
        data.get('message', ''),
        request_info['ip'],
        request_info['user_agent']
    ))
    
    submission_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return submission_id

# Validation functions
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    if not phone:  # Phone is optional
        return True
    pattern = r'^\(\d{3}\)\s\d{3}-\d{4}$'
    return re.match(pattern, phone) is not None

def validate_name(name):
    """Validate name format"""
    if not name or len(name.strip()) < 2:
        return False
    pattern = r'^[a-zA-Z\s\'-]+$'
    return re.match(pattern, name.strip()) is not None

def validate_contact_form(data):
    """Validate all contact form fields"""
    errors = {}
    
    # Required fields
    required_fields = ['fullName', 'organization', 'email', 'interest']
    for field in required_fields:
        if not data.get(field) or not data[field].strip():
            errors[field] = f'{field.replace("fullName", "Full Name").replace("organization", "Organization").replace("email", "Email").replace("interest", "Interest")} is required.'
    
    # Specific validations
    if data.get('fullName') and not validate_name(data['fullName']):
        errors['fullName'] = 'Please enter a valid name.'
    
    if data.get('email') and not validate_email(data['email']):
        errors['email'] = 'Please enter a valid email address.'
    
    if data.get('phone') and not validate_phone(data['phone']):
        errors['phone'] = 'Please enter a valid phone number format: (123) 456-7890'
    
    if data.get('organization') and len(data['organization'].strip()) < 2:
        errors['organization'] = 'Organization name must be at least 2 characters long.'
    
    # Interest validation
    valid_interests = ['pilot', 'investment', 'partnership', 'licensing', 'demo', 'research']
    if data.get('interest') and data['interest'] not in valid_interests:
        errors['interest'] = 'Please select a valid interest option.'
    
    # Message length validation
    if data.get('message') and len(data['message']) > 500:
        errors['message'] = 'Message must be 500 characters or less.'
    
    return errors

def send_notification_email(submission_data, submission_id):
    """Send notification email to admin"""
    try:
        if not all([app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'], app.config['ADMIN_EMAIL']]):
            logger.warning("Email configuration incomplete. Skipping email notification.")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = app.config['MAIL_DEFAULT_SENDER'] or app.config['MAIL_USERNAME']
        msg['To'] = app.config['ADMIN_EMAIL']
        msg['Subject'] = f"New Contact Form Submission #{submission_id}"
        
        # Interest mapping for better readability
        interest_mapping = {
            'pilot': 'Pilot Program for Healthcare System',
            'investment': 'Investment Opportunity',
            'partnership': 'Strategic Partnership',
            'licensing': 'Technology Licensing',
            'demo': 'Product Demo',
            'research': 'Research Collaboration'
        }
        
        # Email body
        body = f"""
New contact form submission received:

Submission ID: {submission_id}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Contact Information:
- Name: {submission_data['fullName']}
- Organization: {submission_data['organization']}
- Email: {submission_data['email']}
- Phone: {submission_data.get('phone', 'Not provided')}

Interest: {interest_mapping.get(submission_data['interest'], submission_data['interest'])}

Message:
{submission_data.get('message', 'No message provided')}

---
This is an automated notification from your contact form.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'])
        server.starttls()
        server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Notification email sent for submission #{submission_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send notification email: {str(e)}")
        return False

def send_confirmation_email(email, name, submission_id):
    """Send confirmation email to the person who submitted the form"""
    try:
        if not all([app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD']]):
            logger.warning("Email configuration incomplete. Skipping confirmation email.")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = app.config['MAIL_DEFAULT_SENDER'] or app.config['MAIL_USERNAME']
        msg['To'] = email
        msg['Subject'] = "Thank you for contacting us!"
        
        # Email body
        body = f"""
Dear {name},

Thank you for reaching out to us! We have received your inquiry and will get back to you within 24 hours.

Your submission reference number is: #{submission_id}

Our team will review your request and contact you soon with more information.

Best regards,
The Team

---
This is an automated confirmation email.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'])
        server.starttls()
        server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Confirmation email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
        return False

@app.route('/api/contact', methods=['POST'])
@rate_limit(max_requests=5, window_minutes=60)
def contact_form():
    """Handle contact form submissions"""
    try:
        # Get JSON data
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json',
                'code': 'INVALID_CONTENT_TYPE'
            }), 400
        
        data = request.get_json()
        
        # Validate required data
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'code': 'NO_DATA'
            }), 400
        
        # Validate form fields
        validation_errors = validate_contact_form(data)
        if validation_errors:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'code': 'VALIDATION_ERROR',
                'details': validation_errors
            }), 400
        
        # Collect request information
        request_info = {
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        # Save to database
        submission_id = save_submission(data, request_info)
        
        # Send notification email (non-blocking)
        try:
            send_notification_email(data, submission_id)
        except Exception as e:
            logger.error(f"Email notification failed: {str(e)}")
        
        # Send confirmation email (non-blocking)
        try:
            send_confirmation_email(data['email'], data['fullName'], submission_id)
        except Exception as e:
            logger.error(f"Confirmation email failed: {str(e)}")
        
        logger.info(f"Contact form submission #{submission_id} processed successfully")
        
        return jsonify({
            'success': True,
            'message': 'Your message has been received successfully!',
            'submission_id': submission_id
        }), 200
        
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error. Please try again later.',
            'code': 'INTERNAL_ERROR'
        }), 500

@app.route('/api/contact/status/<int:submission_id>', methods=['GET'])
def get_submission_status(submission_id):
    """Get status of a contact form submission"""
    try:
        conn = sqlite3.connect(app.config['DATABASE_URL'])
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, full_name, email, submitted_at, status
            FROM contact_submissions 
            WHERE id = ?
        ''', (submission_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'Submission not found',
                'code': 'NOT_FOUND'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': result[0],
                'name': result[1],
                'email': result[2],
                'submitted_at': result[3],
                'status': result[4]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'code': 'INTERNAL_ERROR'
    }), 500

@app.route('/')
def index():
    return render_template("nexonco.html")

# Initialize database on startup
with app.app_context():
    init_db()

if __name__ == '__main__':
    # For development only
    app.run(debug=True, host='0.0.0.0', port=5000)