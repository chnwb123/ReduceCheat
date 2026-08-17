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

api = FastAPI()

# Configure CORS for standard HTTP requests 
api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # React local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a Socket.IO Async Server allowing your React origin
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='http://localhost:3000')

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
    print(f"Client disconnected: {sid}")

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
    
@api.get("/exam-questions/{exam_question_id}")
async def get_exam_question(exam_question_id: str):
    try:
        question = await db["EXAM_QUESTION_T"].find_one({"_id": ObjectId(exam_question_id)})
        if not question:
            raise HTTPException(status_code=404, detail="Exam question not found")
        return serialize_doc(question)
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
        for exam in exams:
            print(f"Exam ID: {exam['_id']}, Course ID: {exam['course_id']}, Exam Details: {exam.get('course_plus_exam_details', [])}")
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