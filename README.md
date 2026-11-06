## React Website for Student, Admin, Instructor, and Invigilator

react/my-app

## FastAPI sever with Socket.IO

backend/FastAPI/main.py

## PySide6 Desktop App for Student's Browser Lockdown + AI Face Landmarks + Mobile Phone Detection AI Analysis

student/pyside-desktop/login.py
student/pyside-desktop/main_menu.py
student/pyside-desktop/exam_answering.py

## Python Mediapipe + cv2 AI Face Landmarks + Mobile Phone Detection AI Analysis

student/AI-background/main.py

## How to run each app

## -- Run FastAPI + Socket.IO Server --

cd backend/FastAPI
python -m uvicorn main:socket_app --reload --port 8000

## -- Run PySide6 Student Desktop App --

cd student/pyside-desktop/login.py
python .\login.py

## -- Run React App --

cd reacy/my-app
pnpm install OR npm install to install the package.json dependencies, node_modules file is not included, must install the dependencies
pnpm dev OR npm run dev
