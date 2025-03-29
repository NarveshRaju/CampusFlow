from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime, timezone
import smtplib
from email.mime.text import MIMEText
from google.cloud import language_v1  # Import for AI
from bson import ObjectId  # Import ObjectId
from dateutil import parser

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

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

def analyze_prompt(prompt):
    client = language_v1.LanguageServiceClient()
    document = language_v1.Document(content=prompt, type_=language_v1.Document.Type.PLAIN_TEXT)
    response = client.analyze_entities(request={'document': document})
    entities = {}
    for entity in response.entities:
        entities[entity.name] = entity.type_.name
    return entities

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
        entities = analyze_prompt(prompt)
        print("Extracted Entities:", entities)

        activity_data = {
            "organizer_id": organizer_id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "activity_type": "From AI Prompt", # You might want to improve this
        }

        from dateutil import parser

        for entity_name, entity_type in entities.items():
            print(f"Entity: {entity_name}, Type: {entity_type}") # For better debugging

            if entity_type == "WORK_OF_ART" or entity_type == "EVENT":
                activity_data["title"] = entity_name
            elif entity_type == "LOCATION":
                activity_data["location"] = entity_name
            elif entity_type == "DATE":
                try:
                    parsed_date = parser.parse(entity_name).strftime('%Y-%m-%d')
                    activity_data["date"] = parsed_date
                except ValueError as e:
                    print(f"Error parsing date: {entity_name} - {e}")
            elif entity_type == "TIME":
                try:
                    parsed_time = parser.parse(entity_name).strftime('%H:%M')
                    if "start_time" not in activity_data:
                        activity_data["start_time"] = parsed_time
                    else:
                        activity_data["end_time"] = parsed_time
                except ValueError as e:
                    print(f"Error parsing time: {entity_name} - {e}")
            elif "STUDENTS" in entity_name.upper():
                # Extract and standardize class name if "STUDENTS" is mentioned
                extracted_class = entity_name.replace(" STUDENTS", "").replace(" STUDENTS OF", "").strip().upper()
                activity_data["selected_class"] = f"Class {extracted_class}"
            elif "CLASS" in entity_name.upper():
                # Extract and standardize class name if "CLASS" is mentioned
                extracted_class = entity_name.upper().replace("CLASS", "").strip()
                activity_data["selected_class"] = f"Class {extracted_class}"
            elif entity_type == "OTHER" and "ACTIVITY" not in entity_name.upper():
                # If it's an "OTHER" type and not the generic "ACTIVITY"
                if "title" not in activity_data:
                    activity_data["title"] = entity_name
                elif "location" not in activity_data:
                    activity_data["location"] = entity_name

        # Final check and standardization for selected_class
        if "selected_class" in activity_data and activity_data["selected_class"].upper().startswith("CLASS "):
            activity_data["selected_class"] = activity_data["selected_class"].strip()
        elif "selected_class" in activity_data:
            activity_data["selected_class"] = f"Class {activity_data['selected_class'].strip().upper()}"

        print("Activity Data before insertion:", activity_data)

        result = db.activities.insert_one(activity_data)
        new_activity_id = str(result.inserted_id)

        # --- Email Sending Logic ---
        selected_class = activity_data.get('selected_class')
        if selected_class:
            students = db.users.find({"class": selected_class}, {"_id": 1, "email": 1})
            student_emails = [student['email'] for student in students]

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
            print(f"Emails will be sent to: {student_emails}") # Debugging line
        else:
            print("No class specified, so no emails will be sent.")

        # Ensure all data in the response is serializable
        response_data = {
            "message": "Activity scheduled via AI successfully!",
            "activity_id": new_activity_id,
            "extracted_data": {k: str(v) if isinstance(v, ObjectId) else v for k, v in entities.items()},
            "activity_data": {k: str(v) if isinstance(v, ObjectId) else v for k, v in activity_data.items()}
        }
        return jsonify(response_data), 201

    except Exception as e:
        print(f"Error processing AI prompt: {str(e)}")
        return jsonify({"error": f"Error processing AI prompt: {str(e)}"}), 500

@app.route('/api/timetable/generate', methods=['POST'])
def generate_timetable():
    data = request.get_json()
    return jsonify({"message": "Timetable generation endpoint hit!"}), 200

if __name__ == '__main__':
    app.run(debug=True)