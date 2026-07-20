from bson import ObjectId
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv(r"c:\FY_FYP\ReduceCheat\backend\FastAPI\.env.local")

MONGODB_URI = os.getenv("MONGODB_URI2")
client = AsyncIOMotorClient(MONGODB_URI)
db = client["reduceCheat"]

api = FastAPI()

class LoginData(BaseModel):
    username: str
    password: str

def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

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