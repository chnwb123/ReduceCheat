from datetime import datetime
from zoneinfo import ZoneInfo
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os
import socketio
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import bcrypt
from fastapi.encoders import jsonable_encoder
load_dotenv(r"c:\FY_FYP\ReduceCheat\backend\FastAPI\.env.local")

class LoginData(BaseModel):
    username: str
    password: str

class AIAnalysisData(BaseModel):
    yaw_angle: float

def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

MONGODB_URI = os.getenv("MONGODB_URI2")
client = AsyncIOMotorClient(MONGODB_URI)
db = client["reduceCheat"]

allowed_origins = [
    "http://localhost:3000",  # React local port
    "*"
]

api = FastAPI()

# Configure CORS for standard HTTP requests 
api.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dictionary to map exam users to exam rooms
sid_to_room_mapping = {}
user_to_room_mapping = {}
student_analysis_data = [] # List to store each student analysis data for the invigilator to monitor

# Create a Socket.IO Async Server allowing your React origin
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=allowed_origins)

# api.mount("socket.io", socketio.ASGIApp(sio))

# Wrap FastAPI app with Socket.IO ASGI application
socket_app = socketio.ASGIApp(sio, other_asgi_app=api)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    # Immediately send data to the connected client
    await sio.emit('server_status', {'data': 'Connected successfully!'}, to=sid)

@sio.event
async def request_data(sid, data):
    print(f"Received request from client: {data}")
    # Process data and broadcast/respond
    payload = {"message": "Here is your processed backend data"}
    await sio.emit('receive_data', payload, to=sid)

@sio.event
async def disconnect(sid):
    # Remove the client from the room mapping
    if sid in sid_to_room_mapping:
        room_id = sid_to_room_mapping[sid]
        print(f"Removed SID {sid} mapping to room {room_id}")
        del sid_to_room_mapping[sid]
        if room_id in user_to_room_mapping:
            user_id = user_to_room_mapping[room_id]
            del user_to_room_mapping[room_id]
            print(f"Removed User {user_id} mapping to room {room_id}")
            if student_analysis_data:
                # Remove the student analysis data for the disconnected user
                student_analysis_data[:] = [entry for entry in student_analysis_data if entry["user_role_id"] != user_id]
                print(f"Removed student analysis data for User {user_id}")
    print(f"Client disconnected: {sid}")

@sio.on("join_exam_room")
async def join_exam_room(sid, room_details: dict):
    room_id = room_details.get("room_id")
    room_user_id = room_details.get("user_id")
    user_to_room_mapping[room_id] = room_user_id  # Store the mapping of room_id to user_id
    sid_to_room_mapping[sid] = room_id  # Store the mapping of sid to room_id
    print(f"SID {sid} has been mapped to exam room: {room_id}")
    if not room_id or not room_user_id:
        raise HTTPException(status_code=400, detail="room_id and user_id are required")
    try: 
        print(f"User {room_user_id} is joining exam room: {room_id}")
        await sio.enter_room(sid=sid, room=room_id)
        # return {"message": f"User {room_user_id} joined exam room: room_{room_id}"}
        print (f"User {room_user_id} joined exam room: {room_id}")
        for room, user in user_to_room_mapping.items():
            print(f"Room: {room}, User: {user}")
        await sio.emit("room_joined", {"message": f"User {room_user_id} joined exam room: {room_id}"}, to=sid)
    except Exception as e:
        print(f"Error joining room: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Note: Run using the `socket_app` object instead of `app`


# FastAPI Server Endpoints
@api.get("/")
def index():
    return {"message": "Hello, This is my new FastAPI application!"}

@api.get("/students")
async def get_students():
    try:
        students = await db["USER_T"].find({"roleType": "Student"}).to_list(length=1000)
        return [serialize_doc(student) for student in students]
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    
@api.get("/exam-questions")
async def get_exam_questions():
    try:
        questions = await db["EXAM_QUESTION_T"].find().to_list(length=1000)
        return [serialize_doc(question) for question in questions]
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    
@api.get("/exam-question/{exam_question_id}")
async def get_exam_question(exam_question_id: str):
    try:
        question = await db["EXAM_QUESTION_T"].find_one({"_id": ObjectId(exam_question_id)})
        if not question:
            raise HTTPException(status_code=404, detail="Exam question not found")
        # return serialize_doc(question)
        return jsonable_encoder(question, custom_encoder={ObjectId: str})
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

@api.post("/login")
async def login(data: LoginData):
    # Fetch data from MongoDB
    user = await db["USER_T"].find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    hashed_password = user.get("password")
    user_input_bytes = data.password.encode('utf-8')
    stored_hash_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
    is_valid = bcrypt.checkpw(user_input_bytes, stored_hash_bytes)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful", "user": serialize_doc(user)}

@api.get("/get-upcoming-exams/{role_id}")
async def get_upcoming_exams(role_id: str):
    try:
        print(f"Fetched role_id: {role_id} from login")
        student = await db["USER_T"].find_one({"role_id": role_id})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        studentId = ObjectId(student["_id"])
        pipeline = [
            {
                "$lookup": {
                    "from": "COURSE_T",
                    "localField": "course_id",
                    "foreignField": "_id",
                    "as": "course_plus_exam_details"
                }
            },
            # {"$unwind": "$course_plus_exam_details"},
            {
                "$match": {
                    "course_plus_exam_details.student_ids": studentId,
                    # Optional upcoming filter if you have exam datetime field:
                    # "exam_datetime": {"$gte": datetime.now(timezone.utc)}
                }
            }
        ]
        exams = await db["EXAM_QUESTION_T"].aggregate(pipeline).to_list(length=1000)
        # print(exams)
        # for exam in exams:
        #     print(f"Exam ID: {exam['_id']}, Course ID: {exam['course_id']}, Exam Details: {exam.get('course_plus_exam_details', [])}")
        return jsonable_encoder(exams, custom_encoder={ObjectId: str})
    except Exception as error:
        print(f"Error fetching upcoming exams: {error}")
        raise HTTPException(status_code=500, detail=str(error))

@api.get("/exam/{exam_id}")
def index(exam_id: int):
    return {"message": f"Exam ID: {exam_id}"}

@api.post("/exam_ai")
async def receive_yaw_angle(data: AIAnalysisData):
    print(f"Received Yaw Angle: {data.yaw_angle} degrees")

    await sio.emit(
        "yaw_angle_update",
        {
            "yaw_angle": data.yaw_angle,
        },
    )

    return {"message": "Yaw angle received and broadcast successfully."}

def process_yaw_angle(yaw_angle):
    if yaw_angle is None:
        return 0
    elif float(yaw_angle) < 0:
        formattedYawAngle = float(yaw_angle) * -1
        return float(formattedYawAngle)
    else:
        return float(yaw_angle)

@api.post("/ai_analysis")
async def receive_ai_analysis(data: dict):
    yaw_angle = process_yaw_angle(data.get("yaw_angle"))
    # yaw_angle = data.get("yaw_angle")
    exam_question_id = data.get("exam_question_id")
    role_id = data.get("role_id")
    mobile_phone_detected = data.get("phone_detected", False)
    print(f"Received Mobile Phone Detection Status: {mobile_phone_detected}")
    date_time = data.get("date_time")

    print(f"Received Yaw Angle: {yaw_angle} degrees for Exam Question ID: {exam_question_id} and Role ID: {role_id}")
    if not student_analysis_data:
        student_analysis_data.append({
            "user_role_id": role_id,
            "exam_session_id": f"exam_{exam_question_id}",
            "yaw_angles_collection": [yaw_angle],
            "latest_yaw_angle": yaw_angle,
            "average_yaw_angle": 0,
            "yaw_angle_status": "normal",
            "number_of_warnings": 0,
            "warnings_reasons": [],
            "number_of_violations": 0,
            "violations_reasons": [],
            "phone_detection_status": "detected" if mobile_phone_detected else "not_detected"
        }) 
    else:
        # Update existing entry for the same role_id and exam_question_id
        updated = False
        for entry in student_analysis_data:
            if entry["user_role_id"] == role_id and entry["exam_session_id"] == f"exam_{exam_question_id}":
                entry["yaw_angles_collection"].append(yaw_angle)
                entry["latest_yaw_angle"] = yaw_angle
                entry["phone_detection_status"] = "detected" if mobile_phone_detected else "not_detected"
                updated = True
                break
        if not updated:
            student_analysis_data.append({
                "user_role_id": role_id,
                "exam_session_id": f"exam_{exam_question_id}",
                "yaw_angles_collection": [yaw_angle],
                "latest_yaw_angle": yaw_angle,
                "average_yaw_angle": 0,
                "yaw_angle_status": "normal",
                "number_of_warnings": 0,
                "warnings_reasons": [],
                "number_of_violations": 0,
                "violations_reasons": [],
                "phone_detection_status": "detected" if mobile_phone_detected else "not_detected"
            })

        # Processing yaw angle & phone detection status to determine warnings and violations
        for entry in student_analysis_data:
            if entry["user_role_id"] == role_id and entry["exam_session_id"] == f"exam_{exam_question_id}":
                latest_yaw_angles = entry["yaw_angles_collection"]
                avg_yaw_angle = sum(latest_yaw_angles) / len(latest_yaw_angles)
                print(f"Average Yaw Angle for student {role_id}: {avg_yaw_angle} degrees")
                entry["average_yaw_angle"] = avg_yaw_angle

                # Process the latest 4 yaw angles to determine if the student is looking away
                if len(latest_yaw_angles) >= 4:
                    last_consecutive_angles = latest_yaw_angles[-4:]
                    if all(abs(angle) >= 70 for angle in last_consecutive_angles):
                        entry["number_of_violations"] += 1
                        entry["violations_reasons"].append(f"Looking away from screen with head tilt angle >= 70 degrees at {date_time}")
                    elif all(abs(angle) >= 40 for angle in last_consecutive_angles):
                        entry["number_of_warnings"] += 1
                        entry["warnings_reasons"].append(f"Looking away from screen with head tilt angle >= 40 degrees at {date_time}")
                    elif all(abs(angle) == 0 for angle in last_consecutive_angles):
                        entry["number_of_violations"] += 1
                        entry["violations_reasons"].append(f"Student's head is not detected for 3 seconds at {date_time}")

                # Process mobile phone detection status
                if entry["phone_detection_status"] == "detected":
                    entry["number_of_violations"] += 1
                    entry["violations_reasons"].append(f"Mobile phone detected in the frame at {date_time}")

        await sio.emit(
            "student_analysis_data",
            {
                "student_analysis_data": student_analysis_data
            },
        )

    # await sio.emit(
    #     "ai_analysis_update",
    #     {
    #         "yaw_angle": yaw_angle,
    #         "exam_question_id": exam_question_id,
    #         "role_id": role_id
    #     },
    # )

    # return {"message": "AI analysis data received and broadcast successfully."}