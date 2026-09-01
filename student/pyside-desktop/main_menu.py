import sys
import json
from PySide6.QtWidgets import QApplication, QFormLayout, QListWidget, QMainWindow, QLabel, QVBoxLayout, QWidget, QListWidgetItem, QHBoxLayout, QPushButton
from PySide6.QtCore import QEventLoop, QThread, Signal, QUrl, QDateTime, QTimer
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply
from PySide6.QtGui import QLinearGradient, QPalette, QBrush, QColor, QFont
from exam_answering import ExamAnsweringWindow
from PySide6.QtCore import Qt, QLocale, QDate, QTime, QDateTime

# Background Worker to make network requests without freezing the UI
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

# Main PySide6 Window
class HomePage(QMainWindow):
    def __init__(self, student_role_id=None):
        super().__init__()
        self.student_role_id = student_role_id
        self.countDownTimerLabels = {}
        self.joinExamButtons = {}
        self.examDateTimes = {}
        print(f"HomePage initialized with student_role_id: {self.student_role_id}")
        self.setWindowTitle("Student Main Menu Page")
        # self.setGeometry(100, 100, 400, 200)
        self.setFixedSize(1300, 650)

        self.setWindowFlags(Qt.Window | Qt.CustomizeWindowHint | Qt.WindowTitleHint | Qt.WindowCloseButtonHint)
        gradient = QLinearGradient(0, 0, 0, self.height())
        gradient.setColorAt(0.0, QColor("#1e1e2f"))
        gradient.setColorAt(1.0, QColor("#111119"))

        palette = self.palette()
        palette.setBrush(QPalette.Window, QBrush(gradient))
        self.setPalette(palette)
        self.setAutoFillBackground(True)   

        headingFont = QFont("Segoe UI", 11, QFont.Bold)

        # UI Setup
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout = QVBoxLayout(self.central_widget)
        
        self.label = QLabel("Select an exam session:")
        self.label.setObjectName("Heading")
        self.label.setFont(headingFont)
        self.layout.addWidget(self.label)

        self.list_widget = QListWidget()
        self.layout.addWidget(self.list_widget)

        self.label2 = QLabel("Exam session found: ", self)
        self.label2.setObjectName("Heading")
        self.label2.setFont(headingFont)
        self.layout.addWidget(self.label2)

        self.refreshButton = QPushButton("Refresh Page", self)
        self.refreshButton.setObjectName("Heading")
        self.refreshButton.setFont(headingFont)
        self.refreshButton.setCursor(Qt.PointingHandCursor)
        self.refreshButton.clicked.connect(self.refreshPage)
        self.layout.addWidget(self.refreshButton)
        self.refreshButton.setMaximumWidth(150)

        self.countdownTimer = QTimer(self)
        self.countdownTimer.timeout.connect(self.update_all_countdowns)
        self.countdownTimer.start(1000)

        # 3. Start data fetch automatically
        self.load_data_from_fastapi()
        self.apply_styles()

    def refreshPage(self):
        # Clear existing items and reset labels
        self.list_widget.clear()
        self.countDownTimerLabels.clear()
        self.joinExamButtons.clear()
        self.examDateTimes.clear()
        self.label2.setText("Exam session found: ")
        
        # Reload data from FastAPI
        self.load_data_from_fastapi()

    def load_data_from_fastapi(self):
        # Assuming your local FastAPI is running on http://127.0.0.1:8000
        self.worker = FetchDataWorker(f"http://127.0.0.1:8000/get-upcoming-exams/{self.student_role_id}")
        self.worker.data_ready.connect(self.update_ui)
        self.worker.start()

    def update_ui(self, data_dict):
        # Update the home page with the fetched data
        if "error" in data_dict:
            self.label.setText(data_dict["error"])
        else:
            for question in data_dict:
                self.add_item_with_button(question.get('_id', 'N/A'), question.get('title', 'N/A'), question.get('description', 'N/A'), question.get('start_date_time', 'N/A'), question.get('end_date_time', 'N/A'), question.get('duration', 0))
                self.label2.setText(f"Exam session found: {len(data_dict)}")

    def add_item_with_button(self, exam_question_id, text, description, startDate, endDate, duration):
        # Create a base QListWidgetItem
        item = QListWidgetItem()
        self.list_widget.addItem(item)

        # Create the custom container widget and horizontal layout
        row_widget = QWidget()
        layout = QFormLayout(row_widget)
        layout.setContentsMargins(5, 5, 5, 25)  # Tighten padding inside the row

        # Bold font for labels
        headingFont = QFont("Segoe UI", 10, QFont.Bold)
        normalFont = QFont("Segoe UI", 10)

        # Create row content (Label + Button)
        questionLabel = QLabel("Exam Title:")
        questionLabel.setFont(headingFont)
        questionText = QLabel(text)
        questionText.setFont(normalFont)
        descriptionLabel = QLabel("Exam Description:")
        descriptionLabel.setFont(headingFont)
        descriptionText = QLabel(description)
        descriptionText.setFont(normalFont)
        dateTimeLabel = QLabel("Date Time:")
        dateTimeLabel.setFont(headingFont)
        dateTime = startDate + " - " + endDate[11:]
        dateTimeText = QLabel(dateTime)
        dateTimeText.setFont(normalFont)
        durationLabel = QLabel("Duration:")
        durationLabel.setFont(headingFont)
        duration = self.formatDuration(duration)
        formattedDuration = str(duration)
        durationText = QLabel(formattedDuration)
        durationText.setFont(normalFont)
        startsInLabel = QLabel("Starts In:")
        startsInLabel.setFont(headingFont)
        startsInText = QLabel("1 hr 40 mins")
        startsInText.setFont(normalFont)
        self.countDownTimerLabels[exam_question_id] = startsInText

        joinExamButton = QPushButton("Exam have not started yet.", self)
        joinExamButton.setEnabled(False)
        joinExamButton.setObjectName("Button")
        joinExamButton.setCursor(Qt.PointingHandCursor)
        self.joinExamButtons[exam_question_id] = joinExamButton

        # Connect button click event and pass the specific item context
        joinExamButton.clicked.connect(lambda: self.handle_button_click(item, exam_question_id, startDate, endDate, duration, dateTime, self.student_role_id))

        # Add elements to layout (with a stretch to push button to the right)
        layout.addRow(questionLabel, questionText)
        layout.addRow(descriptionLabel, descriptionText)
        layout.addRow(dateTimeLabel, dateTimeText)
        layout.addRow(durationLabel, durationText)
        layout.addRow(startsInLabel, startsInText)
        layout.addRow("", self.joinExamButtons[exam_question_id])

        # Adjust row size hint so the list widget wraps the custom container properly
        item.setSizeHint(row_widget.sizeHint())

        # Associate the custom widget with the QListWidgetItem
        self.list_widget.setItemWidget(item, row_widget)

        targetStartDateTime = self.parse_exam_datetime(startDate)
        targetEndDateTime = self.parse_exam_datetime(endDate)
        self.examDateTimes[exam_question_id] = (targetStartDateTime, targetEndDateTime)
        self.update_countdown(exam_question_id, targetStartDateTime, targetEndDateTime)

    def formatDuration(self, duration):
        print("duration value in exam answering: ", duration)
        total_minutes = duration
        hours = total_minutes // 60
        minutes = total_minutes % 60
        return f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

    @staticmethod
    def parse_exam_datetime(date_time):
        value = str(date_time).strip()
        parsed = QDateTime.fromString(value, Qt.ISODate)
        if not parsed.isValid():
            locale = QLocale(QLocale.Language.English, QLocale.Country.UnitedStates)
            parsed = locale.toDateTime(value, "yyyy-MM-dd h:mm AP")
        return parsed

    def update_all_countdowns(self):
        for exam_id, (start_time, end_time) in self.examDateTimes.items():
            self.update_countdown(exam_id, start_time, end_time)

    def update_countdown(self, exam_question_id, targetStartDateTime, targetEndDateTime):
        if not targetStartDateTime.isValid() or not targetEndDateTime.isValid():
            self.countDownTimerLabels[exam_question_id].setText("Invalid exam date/time.")
            self.joinExamButtons[exam_question_id].setEnabled(False)
            return

        current_datetime = QDateTime.currentDateTime()

        # Calculate difference in seconds
        seconds_remaining_for_start = current_datetime.secsTo(targetStartDateTime)
        seconds_remaining_for_end = current_datetime.secsTo(targetEndDateTime)

        if seconds_remaining_for_end <= 0:
            self.countDownTimerLabels[exam_question_id].setText("Exam ended.")
            self.joinExamButtons[exam_question_id].setText("Exam Ended")
            self.joinExamButtons[exam_question_id].setEnabled(False)
            return

        if seconds_remaining_for_start <= 0:
            self.countDownTimerLabels[exam_question_id].setText("Exam ongoing...")
            self.joinExamButtons[exam_question_id].setText("Join Exam")
            self.joinExamButtons[exam_question_id].setEnabled(True)
            return

        # Convert total seconds into Days, Hours, Minutes, and Seconds
        days = seconds_remaining_for_start // 86400
        seconds_remaining_for_start %= 86400

        hours = seconds_remaining_for_start // 3600
        seconds_remaining_for_start %= 3600

        minutes = seconds_remaining_for_start // 60
        seconds = seconds_remaining_for_start % 60

        # Format and display the text
        countdown_text = (
            f"{days}d {hours:02d}h {minutes:02d}m {seconds:02d}s"
        )
        countdownLabel = self.countDownTimerLabels[exam_question_id]
        countdownLabel.setText(countdown_text)

    def handle_button_click(self, item, exam_question_id, start_date_time, end_date_time, duration, date_time, role_id):
        # Action to perform when the button is clicked (e.g., delete item)
        row_index = self.list_widget.row(item)
        print(f"Clicked button on row {row_index} for item: {item.text()}")
        print(f"Exam Question ID: {exam_question_id}")
        print(f"Role ID: {role_id}")
        # self.navigate_to_exam_answering_window(exam_question_id, exam_start="2026-08-07T00:30:00", exam_end="2026-08-07T00:30:10")  # Example start and end times
        self.navigate_to_exam_answering_window(exam_question_id, start_date_time, end_date_time, duration, date_time, role_id)  # Example start and end times

    # def navigate_to_exam_answering_window(self, exam_question_id, exam_start, exam_end):
    def navigate_to_exam_answering_window(self, exam_question_id, start_date_time, end_date_time, duration, date_time, role_id):
        # Close the current window
        self.close()

        # Open the Exam Answering Window
        self.exam_answering_window = ExamAnsweringWindow(exam_question_id, start_date_time, end_date_time, duration, date_time, role_id)    
        self.exam_answering_window.show()

    def apply_styles(self):
            self.setStyleSheet("""
                QLabel#Heading {
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
    window = HomePage()
    window.show()
    sys.exit(app.exec())
