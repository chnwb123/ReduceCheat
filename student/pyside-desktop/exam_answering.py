import socketio
import requests 
from pathlib import Path
import subprocess
import sys
import json
from PySide6.QtWidgets import QApplication, QButtonGroup, QFormLayout, QListWidget, QMainWindow, QLabel, QScrollArea, QSizePolicy, QVBoxLayout, QWidget, QListWidgetItem, QHBoxLayout, QPushButton, QRadioButton, QPlainTextEdit
from PySide6.QtCore import Qt, QTimer, QDateTime, QEventLoop, QSize, QThread, Signal, QUrl
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply
from PySide6.QtGui import QFont, QLinearGradient, QColor, QPalette, QBrush

# 1. Background Worker to make network requests without freezing the UI
class FetchDataWorker(QThread):
    data_ready = Signal(object) # Signal to send data back to the main thread

    def __init__(self, url):
        super().__init__()
        self.url = url

    def run(self):
        self.manager = QNetworkAccessManager()
        request = QNetworkRequest(QUrl(self.url))
        
        # Synchronous-style blocking loop using Qt's local event loop for simplicity
        loop = QEventLoop()
        reply = self.manager.get(request)
        reply.finished.connect(loop.quit)
        loop.exec()

        if reply.error() == QNetworkReply.NetworkError.NoError:
            response_data = reply.readAll().data().decode('utf-8')
            json_data = json.loads(response_data)
            self.data_ready.emit(json_data)
        else:
            self.data_ready.emit({"error": "Failed to load data"})
            
        reply.deleteLater()
        self.manager.deleteLater()

# 2. Main PySide6 Window
class ExamAnsweringWindow(QMainWindow):
    def __init__(self, exam_question_id=None, start_date_time=None, end_date_time=None, duration=None, date_time=None, role_id=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.student_answers = [] # Store student answers
        self.exam_locked = False
        self.monitor_process = None # student/AI-background/main.py AI analysis program
        self.currentTime = QDateTime.currentDateTime()
        self.examStartDateTime = self.formatDateTime(start_date_time)
        self.examEndDateTime = self.formatDateTime(end_date_time)
        print("Exam Start DateTime: ", self.examStartDateTime)
        print("Exam End DateTime: ", self.examEndDateTime)
        self.exam_question_id = exam_question_id
        print("Fetched exam_question_id in exam answering: ", self.exam_question_id)
        self.user_role_id = role_id
        print("Fetched user_role_id in exam answering: ", self.user_role_id)
        self.sio = socketio.Client()
        self.run_AI_background()
        self.join_socketio_room()
        self.setWindowTitle("Student Answering Page")
        # self.setGeometry(100, 100, 400, 200)
        self.setFixedSize(1200, 850)

        self.countdownTimer = QTimer(self)
        self.countdownTimer.timeout.connect(self.updateTimeRemaining)
        self.countdownTimer.start(1000)

        # self.setWindowFlags(
        #     Qt.Window |
        #     Qt.FramelessWindowHint |
        #     Qt.WindowStaysOnTopHint
        # )
        
        # self.setWindowState(Qt.WindowFullScreen)

        gradient = QLinearGradient(0, 0, 0, self.height())
        gradient.setColorAt(0.0, QColor("#1e1e2f"))
        gradient.setColorAt(1.0, QColor("#111119"))

        palette = self.palette()
        palette.setBrush(QPalette.Window, QBrush(gradient))
        self.setPalette(palette)
        self.setAutoFillBackground(True)

        self.lock_timer = QTimer(self)
        self.lock_timer.timeout.connect(self.check_exam_time)
        self.lock_timer.start(1000)

        # UI Setup
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout = QVBoxLayout(self.central_widget)

        # Add a formLayout to the central widget for better alignment
        formLayout = QFormLayout()
        self.layout.addLayout(formLayout)

        # Fonts for labels and texts
        titleFont = QFont("Segoe UI", 12, QFont.Bold)
        textFont = QFont("Segoe UI", 12)

        # Exam Title
        examTitleLabel = QLabel("Exam Title: ")
        examTitleLabel.setFont(titleFont)
        examTitleLabel.setObjectName("HeadingColor")
        self.examTitle = QLabel("")  
        self.examTitle.setObjectName("HeadingColor")
        self.examTitle.setFont(textFont)

        # Exam Description
        examDescriptionLabel = QLabel("Exam Description: ")
        examDescriptionLabel.setFont(titleFont)
        examDescriptionLabel.setObjectName("HeadingColor")
        self.examDescription = QLabel("")  
        self.examDescription.setObjectName("HeadingColor")
        self.examDescription.setFont(textFont)

        # Exam Date and Time
        examDateTimeLabel = QLabel("Exam Date and Time: ")
        examDateTimeLabel.setFont(titleFont)
        examDateTimeLabel.setObjectName("HeadingColor")
        self.examDateTime = QLabel(date_time)  
        self.examDateTime.setObjectName("HeadingColor")
        self.examDateTime.setFont(textFont)

        # Exam Duration
        examDurationLabel = QLabel("Exam Duration: ")
        examDurationLabel.setFont(titleFont)
        examDurationLabel.setObjectName("HeadingColor")
        self.examDuration = QLabel(duration)
        self.examDuration.setObjectName("HeadingColor") 
        self.examDuration.setFont(textFont)

        # Number of Sections
        numOfSectionLabel = QLabel("Number of Sections: ")
        numOfSectionLabel.setFont(titleFont)
        numOfSectionLabel.setObjectName("HeadingColor")  
        self.numOfSections = QLabel("")  
        self.numOfSections.setObjectName("HeadingColor")
        self.numOfSections.setFont(textFont)

        # Time Remaining
        timeRemainingLabel = QLabel("Time Remaining: ")
        timeRemainingLabel.setFont(titleFont)
        timeRemainingLabel.setObjectName("HeadingColor")
        self.timeRemaining = QLabel("")  
        self.timeRemaining.setObjectName("HeadingColor")    
        self.timeRemaining.setFont(textFont)

        # Scroll Area for Exam Question Sections
        self.scrollArea = QScrollArea()
        self.scrollArea.setWidgetResizable(True) 
        self.scrollArea.setFocusPolicy(Qt.StrongFocus)
        self.scrollWidget = QWidget()
        self.scrollLayout = QVBoxLayout(self.scrollWidget)
        self.scrollArea.setWidget(self.scrollWidget)
        self.layout.addWidget(self.scrollArea, 1)

        formLayout.addRow(examTitleLabel, self.examTitle)
        formLayout.addRow(examDescriptionLabel, self.examDescription)
        formLayout.addRow(examDateTimeLabel, self.examDateTime)
        formLayout.addRow(examDurationLabel, self.examDuration)
        formLayout.addRow(numOfSectionLabel, self.numOfSections)
        formLayout.addRow(timeRemainingLabel, self.timeRemaining)

        # 3. Start data fetch automatically
        self.load_data_from_fastapi()
        self.apply_styles()   
        
    def join_socketio_room(self):
        @self.sio.event
        def connect():
            print(f"{self.user_role_id} is connecting to Socket.IO server room exam_{self.exam_question_id}")
            # Join a room based on exam_question_id and user_role_id dict
            room_details = {
                "room_id": f"exam_{self.exam_question_id}",
                "user_id": self.user_role_id
            }
            self.sio.emit('join_exam_room', room_details)

        @self.sio.on('room_joined')
        def on_room_joined(data):
            print(f"Room joined successfully: {data.get('message')}")

        # @self.sio.event
        # def disconnect():
        #     print(f"{self.user_role_id} has been disconnected from exam answering page.") 

        # @self.sio.on('server_status')
        # def on_server_status(data):
        #     print("Server status:", data)

        # @self.sio.on('receive_data')
        # def on_receive_data(data):
        #     print("Received data from server:", data)

        try:
            self.sio.connect('http://127.0.0.1:8000')  # Adjust the URL if needed
        except Exception as e:
            print(f"Failed to connect to Socket.IO server: {e}")

    def run_AI_background(self):
        currentFilePath = Path(__file__).resolve().parent
        targetAIfilePath = currentFilePath.parent / "AI-background" / "main.py"

        self.monitor_process = subprocess.Popen(
            [sys.executable, str(targetAIfilePath), str(self.user_role_id), str(self.exam_question_id)],
        )

    def updateTimeRemaining(self):
        now = QDateTime.currentDateTime()
        endDateTime = QDateTime.fromString(self.examEndDateTime, Qt.DateFormat.ISODate)
        remaining = now.secsTo(endDateTime)

        if remaining > 0:
            hours = remaining // 3600
            minutes = (remaining % 3600) // 60
            seconds = remaining % 60
            self.timeRemaining.setText(f"{hours:02d}:{minutes:02d}:{seconds:02d}")
        else:
            self.timeRemaining.setText("00:00:00")
            self.end_exam()  # End the exam when time is up

    def formatDateTime(self, dateTimeStr):
        qdt = QDateTime.fromString(
            dateTimeStr,
            "yyyy-MM-dd h:mm AP"
        )  
        formattedDateTime = qdt.toString(Qt.ISODate)
        return formattedDateTime

    def check_exam_time(self):
        now = QDateTime.currentDateTime()
        startDateTime = QDateTime.fromString(self.examStartDateTime, Qt.DateFormat.ISODate)
        endDateTime = QDateTime.fromString(self.examEndDateTime, Qt.DateFormat.ISODate)

        if now < startDateTime:
            # exam not started yet
            return

        if now >= endDateTime:
            self.end_exam()

    def keyPressEvent(self, event):
        if self.exam_locked:
            blocked = {
                Qt.Key_Escape,
                Qt.Key_Alt,
                Qt.Key_Tab,
            }
            if event.key() in blocked:
                return
        super().keyPressEvent(event)

    def closeEvent(self, event):
        if self.exam_locked:
            event.ignore()
        else:
            if self.monitor_process is not None:
                self.monitor_process.terminate()
            try:
                self.monitor_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.monitor_process.kill()
            event.accept()

    def end_exam(self):
        room_details = {
            "room_id": f"exam_{self.exam_question_id}",
            "user_id": self.user_role_id
        }
        self.sio.emit('exam_ended', room_details)

        try:
            response = requests.post(f"http://127.0.0.1:8000/handle-student-answers", json={"exam_question_id": self.exam_question_id, "role_id": self.user_role_id, "student_answer": self.student_answers}) 
        except requests.RequestException as e:
            print(f"Error sending student answers to FastAPI: {e}")

        self.close()

        print("Exam ended")

    def load_data_from_fastapi(self):
        # Assuming your local FastAPI is running on http://127.0.0.1:8000
        self.worker = FetchDataWorker("http://127.0.0.1:8000/exam-question/" + (self.exam_question_id if self.exam_question_id else ""))
        self.worker.data_ready.connect(self.update_ui)
        self.worker.start()

    def update_ui(self, data_dict):
        # Update the home page with the fetched data
        if "error" in data_dict:
            self.clear_scroll_content()
            self.scrollLayout.addWidget(QLabel(f"Failed to load exam: {data_dict['error']}"))
        else:
            # self.add_item_with_button(data_dict.get('_id', 'N/A'), data_dict.get('title', 'N/A'), data_dict.get('description', 'N/A'), data_dict.get('date', 'N/A'))
            # print("Data fetched: ", data_dict)
            self.examTitle.setText(data_dict.get('title', ''))
            self.examDescription.setText(data_dict.get('description', ''))
            self.numOfSections.setText(str(data_dict.get('number_of_section', '')))
            self.create_exam_section(data_dict.get('sections', []))
    
    def create_exam_section(self, section_data=None):
        # Put every section inside QScrollArea.
        self.clear_scroll_content()

        if not section_data:
            self.scrollLayout.addWidget(QLabel("This exam has no sections."))
            self.scrollLayout.addStretch()
            return

        for section in section_data:
            self.student_answers.append({section.get('id', 'N/A'): {"objective_answers": [], "subjective_answers": []}})
            row_widget = self.create_section_widget(section)
            self.scrollLayout.addWidget(row_widget)

        self.scrollLayout.addStretch()

    def clear_scroll_content(self):
        while self.scrollLayout.count():
            item = self.scrollLayout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

    def create_section_widget(self, section):
        row_widget = QWidget()
        formLayout = QFormLayout(row_widget)
        formLayout.setContentsMargins(5, 5, 5, 25)

        sectionId = section.get('id', 'N/A')
        sectionTitle = section.get('title', 'N/A')
        sectionDescription = section.get('description', 'N/A')

        titleFont = QFont("Segoe UI", 12, QFont.Bold)
        textFont = QFont("Segoe UI", 12)

        # Section Label and Text
        sectionLabel = QLabel("Section " + str(sectionId))
        sectionLabel.setFont(titleFont)

        # Section Title Label and Text
        sectionTitleLabel = QLabel("Section Title: ")
        sectionTitleLabel.setFont(titleFont)
        sectionTitleText = QLabel(sectionTitle)  
        sectionTitleText.setFont(textFont)
        sectionTitleText.setWordWrap(True)

        # Section Description Label and Text
        sectionDescriptionLabel = QLabel("Section Description: ")
        sectionDescriptionLabel.setFont(titleFont)
        sectionDescriptionText = QLabel(sectionDescription)  
        sectionDescriptionText.setFont(textFont)
        sectionDescriptionText.setWordWrap(True)

        # Objective Question Label
        ObjectiveSectionLabel = QLabel("Objective Questions: ")
        ObjectiveSectionLabel.setFont(titleFont)

        # Subjective Question Label
        SubjectiveSectionLabel = QLabel("Subjective Questions: ")
        SubjectiveSectionLabel.setFont(titleFont)

        formLayout.addRow(sectionLabel)
        formLayout.addRow(sectionTitleLabel, sectionTitleText)
        formLayout.addRow(sectionDescriptionLabel, sectionDescriptionText)
        formLayout.addRow(ObjectiveSectionLabel)

        sectionTitleText.setSizePolicy(
            QSizePolicy.Expanding,
            QSizePolicy.Minimum
        )

        sectionDescriptionText.setSizePolicy(
            QSizePolicy.Expanding,
            QSizePolicy.Minimum
        )

        # Objective Questions
        objectiveNumberIncrementer = 1
        
        for objective in section.get('objective_questions', []):
            self.student_answers[-1][sectionId]["objective_answers"].append({"question_number": objectiveNumberIncrementer, "selected_option": None})
            objectiveTitle = objective.get('title', 'N/A')
            objectiveNumOfOptions = objective.get('numOptions', 'N/A')
            objectiveOptions = objective.get('options', [])
            objectiveCorrectAnswer = objective.get('correctAnswer', 'N/A')
            objectiveMarks = objective.get('marks', 'N/A')

            # Objective Index and Title
            objectiveText = QLabel(str(objectiveNumberIncrementer) + ". " + objectiveTitle + " (Marks: " + str(objectiveMarks) + ")")
            objectiveText.setFont(textFont)
            objectiveText.setWordWrap(True)

            objectiveText.setSizePolicy(
                QSizePolicy.Expanding,
                QSizePolicy.Minimum
            )

            formLayout.addRow(objectiveText)

            # Unique group for radio buttons to ensure only one can be selected
            group = QButtonGroup(row_widget)
            group.setExclusive(True)  # Ensure only one radio button can be selected at a time

            # Objective Options
            for idx, option in enumerate(objectiveOptions):
                optionText = chr(65 + idx) + ". " + option # A. Option, B. Option, etc.
                optionInChar = chr(65 + idx)  # A, B, C, D, etc.
                radioButton = QRadioButton(optionText)
                radioButton.setFont(textFont)
                radioButton.setSizePolicy(
                    QSizePolicy.Expanding,
                    QSizePolicy.Minimum
                )   
                radioButton.toggled.connect(lambda checked, index=idx+1, optInChar=optionInChar, opt=option, objQuesNumber=objectiveNumberIncrementer, sectionNum=sectionId: self.on_radio_button_toggled(checked, index, opt, optInChar, objQuesNumber, sectionNum))
                group.addButton(radioButton)
                formLayout.addRow(radioButton)  # Display the option text

            objectiveNumberIncrementer += 1

        # Subjective Questions
        subjectiveNumberIncrementer = 1
        formLayout.addRow(SubjectiveSectionLabel)
        for subjective in section.get('subjective_questions', []):
            self.student_answers[-1][sectionId]["subjective_answers"].append({"question_number": subjectiveNumberIncrementer, "typed_answer": None})
            subjectiveTitle = subjective.get('title', 'N/A')
            subjectiveCorrectAnswer = subjective.get('correctAnswer', 'N/A')
            subjectiveMarks = subjective.get('marks', 'N/A')

            # Subjective Index and Title
            subjectiveText = QLabel(str(subjectiveNumberIncrementer) + ". " + subjectiveTitle + " (Marks: " + str(subjectiveMarks) + ")")
            subjectiveText.setFont(textFont)
            subjectiveText.setWordWrap(True)
            subjectiveText.setSizePolicy(
                QSizePolicy.Expanding,
                QSizePolicy.Minimum
            )
            formLayout.addRow(subjectiveText)
            textArea = QPlainTextEdit()
            textArea.setFont(textFont)
            textArea.setPlaceholderText("Write your answer here...")
            textArea.textChanged.connect(lambda textArea=textArea, subQuesNumber=subjectiveNumberIncrementer, sectionNum=sectionId: self.on_text_changed(textArea.toPlainText(), subQuesNumber, sectionNum))
            formLayout.addRow(textArea)  # Display the text area for answer
            subjectiveNumberIncrementer += 1

        return row_widget
            
    def on_radio_button_toggled(self, checked, index, option, optionInChar, objQuesNumber, sectionNum):
        if checked:
            print(f"Selected option: {index}. ({optionInChar}) {option} for Objective Question Number: {objQuesNumber} in Section: {sectionNum}")
            for section in self.student_answers:
                if sectionNum in section:
                    for obj_answer in section[sectionNum]["objective_answers"]:
                        if obj_answer["question_number"] == objQuesNumber:
                            obj_answer["selected_option"] = optionInChar
                            break
                    break

            for section in self.student_answers:
                if sectionNum in section:
                    for obj_answer in section[sectionNum]["objective_answers"]:
                        print(f"Objective Question {obj_answer['question_number']} in Section {sectionNum} has selected option: {obj_answer['selected_option']}")

    def on_text_changed(self, text, subQuesNumber, sectionNum):
        print(f"Text changed for Subjective Question {subQuesNumber} in Section {sectionNum}: {text}")
        for section in self.student_answers:
            if sectionNum in section:
                for subj_answer in section[sectionNum]["subjective_answers"]:
                    if subj_answer["question_number"] == subQuesNumber:
                        subj_answer["typed_answer"] = text
                        break
                break

        for section in self.student_answers:
            if sectionNum in section:
                for subj_answer in section[sectionNum]["subjective_answers"]:
                    print(f"Subjective Question {subj_answer['question_number']} in Section {sectionNum} has typed answer: {subj_answer['typed_answer']}")

    def apply_styles(self):
                self.setStyleSheet("""
                    QLabel#HeadingColor {
                        color: #ffffff;
                    }
                    QPushButton#Button {
                        padding: 2px;
                        font-family: 'Segoe UI';
                        font-size: 13px;
                        font-weight: bold;
                    }
                    QPushButton#Button:hover {
                        color: #818cf8;
                    }
                """)  
              
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ExamAnsweringWindow()
    window.show()
    sys.exit(app.exec())
