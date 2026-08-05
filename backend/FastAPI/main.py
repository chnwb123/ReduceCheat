from bson import ObjectId
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os
import socketio
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
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

    if user.get("password") != data.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful", "user": serialize_doc(user)}

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