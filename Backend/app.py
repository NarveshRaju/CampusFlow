from bson import ObjectId
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime, timezone
import smtplib
from email.mime.text import MIMEText
import google.generativeai as genai
from dateutil import parser
from fpdf import FPDF
from google.cloud import language_v1
from io import BytesIO
import re
from werkzeug.utils import secure_filename # For secure filename handling

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)


app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
UPLOAD_FOLDER = 'uploads'  # Make sure this directory exists in your backend project
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'docx', 'doc', 'txt', 'jpg', 'jpeg', 'png'}
app.add_url_rule('/uploads/<filename>', 'uploaded_file', build_only=True)
from flask import send_from_directory
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def send_email(recipient_email, subject, body):
    try:
        message = MIMEText(body)
        message['Subject'] = subject
        message['From'] = EMAIL_SENDER
        message['To'] = recipient_email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, recipient_email, message.as_string())
        print(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending email to {recipient_email}: {str(e)}")
        return False

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-1.5-flash-latest')

def generate_ai_content(prompt):
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 1000,
                "temperature": 0.7
            }
        )
        if response.text:
            return response.text
        else:
            print(f"Error generating content: {response.prompt_feedback}")
            return None
    except Exception as e:
        print(f"Error generating content: {str(e)}")
        return None
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route('/api/assignments/class/<class_name>', methods=['GET'])
def get_assignments_by_class(class_name):
    try:
        assignments = list(db.assignments.find({"class": class_name}))
        for assignment in assignments:
            assignment['_id'] = str(assignment['_id'])
        return jsonify({"assignments": assignments}), 200
    except Exception as e:
        print(f"Error fetching assignments for class {class_name}: {str(e)}")
        return jsonify({"error": f"Error fetching assignments: {str(e)}"}), 500
@app.route('/api/assignments/teacher', methods=['GET'])
def get_teacher_assignments():
    faculty_id = request.args.get('facultyId')
    if not faculty_id:
        return jsonify({"error": "Faculty ID is required"}), 400
    try:
        assignments = list(db.assignments.find({"facultyId": faculty_id}))
        for assignment in assignments:
            assignment['_id'] = str(assignment['_id'])
        return jsonify({"assignments": assignments}), 200
    except Exception as e:
        print(f"Error fetching teacher assignments: {str(e)}")
        return jsonify({"error": f"Error fetching assignments: {str(e)}"}), 500
@app.route('/api/assignments/submit', methods=['POST'])
def submit_assignment():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    assignment_id = request.form.get('assignmentId')
    student_id = request.form.get('studentId')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Check if a submission already exists and has a grade
        existing_submission = db.submissions.find_one({'assignmentId': assignment_id, 'studentId': student_id})
        print(f"Existing submission found: {existing_submission}") # Debugging
        if existing_submission and existing_submission.get('grade') is not None:
            print(f"Grade of existing submission: {existing_submission.get('grade')}") # Debugging
            os.remove(filepath)
            return jsonify({'error': 'This assignment has already been graded and cannot be resubmitted.'}), 400

        # Store submission details in MongoDB
        submission_data = {
            'studentId': student_id,
            'assignmentId': assignment_id,
            'submissionDate': datetime.now(timezone.utc),
            'filePath': filepath, # Or URL if using cloud storage
            'originalFileName': file.filename
        }
        db.submissions.insert_one(submission_data)

        return jsonify({'message': 'Assignment submitted successfully!', 'filePath': filepath}), 201
    else:
        return jsonify({'error': 'Invalid file type'}), 400
@app.route('/api/teacher/submissions/<assignment_id>', methods=['GET'])
def get_assignment_submissions(assignment_id):
    try:
        submissions = list(db.submissions.find({'assignmentId': assignment_id}))
        submissions_list = []
        for submission in submissions:
            submission['_id'] = str(submission['_id'])
            print(f"Submission studentId: {submission['studentId']}") # Debugging line
            # Query the users collection using the studentId (which is the Firebase UID) in the 'name' field
            student = db.users.find_one({'firebaseUid': submission['studentId']}, {'name': 1})
            print(f"Found student in users: {student}") # Debugging line
            student_name = student['name'] if student and 'name' in student else 'Unknown Student'
            submission_data = {
                '_id': submission['_id'],
                'studentId': submission['studentId'],
                'studentName': student_name,
                'submissionDate': submission['submissionDate'],
                'filePath': submission['filePath'],
                'originalFileName': submission['originalFileName'],
                'grade': submission.get('grade'),
                'feedback': submission.get('feedback')
            }
            submissions_list.append(submission_data)
        print(f"Submissions list being sent: {submissions_list}") # Debugging line
        return jsonify({'submissions': submissions_list}), 200
    except Exception as e:
        print(f"Error fetching submissions: {str(e)}")
        return jsonify({'error': f'Error fetching submissions: {str(e)}'}), 500

@app.route('/api/student/submission/<assignment_id>', methods=['GET'])
def get_student_submission_details(assignment_id):
    # Assuming you can identify the student from the session or a token
    # For simplicity, let's assume you pass studentId as a query parameter for now
    student_id = request.args.get('studentId')
    if not student_id:
        return jsonify({"error": "Student ID is required"}), 400

    try:
        submission = db.submissions.find_one({'assignmentId': assignment_id, 'studentId': student_id})
        if submission:
            submission['_id'] = str(submission['_id'])
            return jsonify({'submission': submission}), 200
        else:
            return jsonify({'message': 'No submission found for this assignment by this student'}), 404
    except Exception as e:
        print(f"Error fetching submission details: {str(e)}")
        return jsonify({'error': f'Error fetching submission details: {str(e)}'}), 500

@app.route('/')
def hello_world():
    return 'Hello from the backend!'

@app.route('/api/test_mongodb')
def test_mongodb_connection():
    try:
        client.admin.command('ping')
        return jsonify({"message": "Successfully connected to MongoDB Atlas!"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to connect to MongoDB: {str(e)}"}), 500

@app.route('/api/classes')
def get_classes():
    try:
        classes_data = db.classes.find({}, {"_id": 0, "name": 1})
        classes_list = [cls['name'] for cls in classes_data]
        return jsonify({"classes": classes_list}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching classes: {str(e)}"}), 500

@app.route('/api/activities/schedule', methods=['POST'])
def schedule_activity():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    required_fields = ["activity_type", "title", "date", "start_time", "end_time", "location", "selected_class", "organizer_id"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        organizer_id = data.get('organizer_id')
        selected_class = data.get('selected_class')
        participants = []
        student_emails = []

        if selected_class:
            students = db.users.find({"class": selected_class}, {"_id": 1, "email": 1})
            for student in students:
                participants.append(str(student['_id']))
                student_emails.append(student['email'])

        data['date'] = datetime.strptime(data['date'], '%Y-%m-%d')
        data['created_at'] = datetime.now(timezone.utc)
        data['updated_at'] = datetime.now(timezone.utc)
        data['participants'] = participants
        data['organizer_id'] = organizer_id

        result = db.activities.insert_one(data)
        new_activity_id = str(result.inserted_id)

        activity_title = data.get('title', 'New Activity')
        activity_date = data.get('date').strftime('%Y-%m-%d')
        activity_time = f"{data.get('start_time')} - {data.get('end_time')}"
        activity_location = data.get('location', 'To be determined')

        subject = f"New Activity Scheduled: {activity_title}"
        body = f"""
        A new activity has been scheduled for {selected_class}:

        Title: {activity_title}
        Date: {activity_date}
        Time: {activity_time}
        Location: {activity_location}

        Please check your schedule for more details.
        """

        for email in student_emails:
            send_email(email, subject, body)

        return jsonify({"message": "Activity scheduled successfully and emails sent", "activity_id": new_activity_id}), 201
    except ValueError:
        return jsonify({"error": "Invalid date format (YYYY-MM-DD expected)"}), 400
    except Exception as e:
        return jsonify({"error": f"Error scheduling activity: {str(e)}"}), 500

@app.route('/api/ai/schedule', methods=['POST'])
def ai_schedule_activity():
    data = request.get_json()
    prompt = data.get('prompt')
    organizer_id = data.get('organizer_id')

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        generated_content = generate_ai_content(prompt)
        if not generated_content:
            return jsonify({"error": "Failed to generate activity details from prompt"}), 500

        lines = generated_content.split('\n')
        activity_data = {
            "organizer_id": organizer_id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "activity_type": "From AI Prompt",
        }
        student_emails = []

        for line in lines:
            if line.startswith("Title:"):
                activity_data["title"] = line.split(":", 1)[1].strip()
            elif line.startswith("Date:"):
                try:
                    activity_data["date"] = parser.parse(line.split(":", 1)[1].strip()).strftime('%Y-%m-%d')
                except ValueError as e:
                    print(f"Error parsing date from AI output: {e}")
            elif line.startswith("Time:"):
                time_str = line.split(":", 1)[1].strip()
                try:
                    start_end_time = time_str.split(" - ")
                    if len(start_end_time) == 2:
                        activity_data["start_time"] = parser.parse(start_end_time[0]).strftime('%H:%M')
                        activity_data["end_time"] = parser.parse(start_end_time[1]).strftime('%H:%M')
                    else:
                        activity_data["start_time"] = parser.parse(time_str).strftime('%H:%M')
                except ValueError as e:
                    print(f"Error parsing time from AI output: {e}")
            elif line.startswith("Location:"):
                activity_data["location"] = line.split(":", 1)[1].strip()
            elif line.startswith("Class:"):
                activity_data["selected_class"] = line.split(":", 1)[1].strip()
                students = db.users.find({"class": activity_data["selected_class"]}, {"email": 1})
                student_emails.extend([student['email'] for student in students])

        print("Activity Data from AI:", activity_data)

        result = db.activities.insert_one(activity_data)
        new_activity_id = str(result.inserted_id)

        selected_class = activity_data.get('selected_class')
        if selected_class:
            activity_title = activity_data.get('title', 'New Activity')
            activity_date = activity_data.get('date', 'To be determined')
            activity_time = f"{activity_data.get('start_time', 'N/A')} - {activity_data.get('end_time', 'N/A')}"
            activity_location = activity_data.get('location', 'To be determined')

            subject = f"New Activity Scheduled: {activity_title}"
            body = f"""
            A new activity has been scheduled for {selected_class}:

            Title: {activity_title}
            Date: {activity_date}
            Time: {activity_time}
            Location: {activity_location}

            Please check your schedule for more details.
            """

            for email in student_emails:
                send_email(email, subject, body)
            print(f"Emails will be sent to: {student_emails}")
        else:
            print("No class specified in AI output, so no emails will be sent.")

        response_data = {
            "message": "Activity scheduled via AI successfully!",
            "activity_id": new_activity_id,
            "generated_content": generated_content,
            "activity_data": {k: str(v) if isinstance(v, ObjectId) else v for k, v in activity_data.items()}
        }
        return jsonify(response_data), 201

    except Exception as e:
        print(f"Error processing AI prompt: {str(e)}")
        return jsonify({"error": f"Error processing AI prompt: {str(e)}"}), 500
@app.route('/api/student/assignments', methods=['GET'])
def get_student_assignments():
    student_class = request.args.get('class')
    print(f"Backend received student_class for fetching assignments: {student_class}")
    if not student_class:
        return jsonify({"error": "Student class is required"}), 400
    try:
        assignments = list(db.assignments.find({"class": student_class}))
        print(f"Backend found assignments for class {student_class}: {assignments}")
        # Convert ObjectId to string for JSON serialization
        assignments_list = []
        for assignment in assignments:
            assignment['_id'] = str(assignment['_id'])
            assignments_list.append(assignment)
        return jsonify({"assignments": assignments_list}), 200
    except Exception as e:
        print(f"Error fetching student assignments: {str(e)}")
        return jsonify({"error": f"Error fetching student assignments: {str(e)}"}), 500
@app.route('/api/timetable/generate', methods=['POST'])
def generate_timetable():
    data = request.get_json()
    return jsonify({"message": "Timetable generation endpoint hit!"}), 200

@app.route('/api/assignments/create', methods=['POST'])
def create_assignment():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    facultyId = data.get('facultyId')
    class_name = data.get('class')
    title = data.get('title')
    description = data.get('description')
    assignedDate = data.get('assignedDate')
    dueDate = data.get('dueDate')
    evaluationCriteria = data.get('evaluationCriteria')

    if not all([facultyId, class_name, title, description, assignedDate, dueDate, evaluationCriteria]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        assigned_date = datetime.strptime(assignedDate, '%Y-%m-%d')
        due_date = datetime.strptime(dueDate, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    assignment_data = {
        "facultyId": facultyId,
        "class": class_name,
        "title": title,
        "description": description,
        "assignedDate": assigned_date,
        "dueDate": due_date,
        "evaluationCriteria": evaluationCriteria,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = db.assignments.insert_one(assignment_data)
    new_assignment_id = str(result.inserted_id)


    return jsonify({"message": "Assignment created successfully!", "assignmentId": new_assignment_id}), 201

@app.route('/api/content/create', methods=['POST'])
def create_content():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    faculty_id = data.get('facultyId')
    title = data.get('title')
    content = data.get('content')
    tags = data.get('tags', [])
    content_type = data.get('contentType', 'general')
    visible_to_classes = data.get('visibleToClasses', [])

    if not all([faculty_id, title, content]):
        return jsonify({"error": "Missing required fields"}), 400

    content_data = {
        "facultyId": faculty_id,
        "title": title,
        "content": content,
        "tags": tags,
        "contentType": content_type,
        "visibleToClasses": visible_to_classes,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = db.content.insert_one(content_data)
    content_id = str(result.inserted_id)

    return jsonify({"message": "Content created successfully!", "contentId": content_id}), 201

@app.route('/api/content/fetch', methods=['GET'])
def fetch_content():
    faculty_id = request.args.get('facultyId')

    if not faculty_id:
        return jsonify({"error": "Faculty ID is required"}), 400

    try:
        content_list = list(db.content.find({"facultyId": faculty_id}, {"_id": 0}))
        return jsonify({"content": content_list}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching content: {str(e)}"}), 500

@app.route('/api/content/ai_generate', methods=['POST'])
def ai_generate_content():
    data = request.get_json()
    prompt = data.get('prompt')
    faculty_id = data.get('facultyId')
    title = data.get('title', "AI-Generated Content")
    visible_to_classes = data.get('visibleToClasses', [])

    if not prompt or not faculty_id:
        return jsonify({"error": "Prompt and Faculty ID are required"}), 400

    try:
        generated_content = generate_ai_content(prompt)

        if not generated_content:
            return jsonify({"error": "Failed to generate content"}), 500

        return jsonify({
            "message": "AI-generated content successfully!",
            "generatedContent": generated_content,
            "title": title,
            "visibleToClasses": visible_to_classes
        }), 200

    except Exception as e:
        print(f"AI Content Generation Error: {str(e)}")
        return jsonify({"error": "AI content generation failed"}), 500

@app.route('/api/student/notes', methods=['GET'])
def get_student_notes():
    student_class = request.args.get('class')
    print(f"Backend received student_class for fetching notes: {student_class}")
    if not student_class:
        return jsonify({"error": "Student class is required"}), 400
    try:
        notes_cursor = db.content.find({"visibleToClasses": student_class}, {"_id": 1, "title": 1})
        notes_list = []
        for note in notes_cursor:
            notes_list.append({"_id": str(note['_id']), "title": note['title']})
        print(f"Backend found notes: {notes_list}")
        return jsonify({"notes": notes_list}), 200
    except Exception as e:
        print(f"Error fetching student notes: {str(e)}")
        return jsonify({"error": f"Error fetching student notes: {str(e)}"}), 500

@app.route('/api/content/download/<content_id>', methods=['GET'])
def download_content(content_id):
    try:
        content = db.content.find_one({"_id": ObjectId(content_id)})

        if not content:
            return jsonify({"error": "Content not found"}), 404

        # --- Process Markdown to remove/replace unwanted characters ---
        processed_content = []
        for line in content["content"].splitlines():
            # Remove leading '#' for headings and add extra spacing
            line = re.sub(r'^#+\s*', '', line)
            # Remove '*' for emphasis (you might want more sophisticated handling later)
            line = line.replace('*', '')
            processed_content.append(line)

        final_content = "\n".join(processed_content)

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(200, 10, content["title"], ln=True, align='C')

        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 10, final_content)

        pdf_filename = f"downloads/{content['title'].replace(' ', '_')}.pdf"
        os.makedirs("downloads", exist_ok=True)
        pdf.output(pdf_filename)

        return send_file(pdf_filename, as_attachment=True)

    except Exception as e:
        return jsonify({"error": f"Error generating PDF: {str(e)}"}), 500

@app.route('/api/content/ai_generate/download_pdf', methods=['POST'])
def download_ai_generated_pdf():
    try:
        data = request.get_json()
        generated_content = data.get('generatedContent')
        title = data.get('title', 'Generated Notes')

        print("Generated Content received for PDF download:")
        print(generated_content)

        if not generated_content:
            return jsonify({"error": "No content to generate PDF from"}), 400

        processed_content = []
        for line in generated_content.splitlines():
            line = re.sub(r'^#+\s*', '', line)
            line = line.replace('*', '')
            processed_content.append(line)

        final_content = "\n".join(processed_content)

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(200, 10, title, ln=True, align='C')

        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 10, final_content)

        pdf_bytes = pdf.output(dest='S').encode('latin1')

        buffer = BytesIO(pdf_bytes)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{title.replace(' ', '_')}.pdf"
        )

    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return jsonify({"error": "Failed to generate PDF"}), 500

# --- Newly added APIs ---
@app.route('/api/submissions/grade/<submission_id>', methods=['POST'])
def save_submission_grade(submission_id):
    data = request.get_json()
    grade = data.get('grade')
    feedback = data.get('feedback')

    try:
        result = db.submissions.update_one(
            {'_id': ObjectId(submission_id)},
            {'$set': {'grade': grade, 'feedback': feedback, 'gradedDate': datetime.now(timezone.utc)}}
        )
        if result.modified_count > 0:
            return jsonify({'message': 'Grade and feedback saved successfully'}), 200
        else:
            return jsonify({'error': 'Submission not found or no changes made'}), 404
    except Exception as e:
        print(f"Error saving grade: {str(e)}")
        return jsonify({'error': f'Error saving grade: {str(e)}'}), 500

@app.route('/api/user/create', methods=['POST'])
def create_user():
    data = request.get_json()
    firebase_uid = data.get('firebaseUid')
    name = data.get('name')
    username = data.get('username') # Expecting username (rollNumber) during user creation

    if not firebase_uid or not name or not username:
        return jsonify({'error': 'Firebase UID, name, and username are required'}), 400

    if db.users.find_one({'firebaseUid': firebase_uid}):
        return jsonify({'message': 'User with this Firebase UID already exists'}), 200
    if db.users.find_one({'username': username}):
        return jsonify({'message': 'User with this username already exists'}), 200

    user_data = {
        'firebaseUid': firebase_uid,
        'name': name,
        'username': username,
        'role': 'student'  # Assuming it's a student
        # You can add other fields like email if needed
    }
    db.users.insert_one(user_data)
    return jsonify({'message': 'User created successfully'}), 201

if __name__ == '__main__':
    app.run(debug=True)