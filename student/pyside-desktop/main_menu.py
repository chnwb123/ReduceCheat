import sys
import json
from PySide6.QtWidgets import QApplication, QFormLayout, QListWidget, QMainWindow, QLabel, QVBoxLayout, QWidget, QListWidgetItem, QHBoxLayout, QPushButton
from PySide6.QtCore import QEventLoop, QSize, QThread, Signal, QUrl
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply
from PySide6.QtGui import QFont
from exam_answering import ExamAnsweringWindow

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
class HomePage(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Student Main Menu Page")
        # self.setGeometry(100, 100, 400, 200)
        self.setFixedSize(800, 400)

        # UI Setup
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout = QVBoxLayout(self.central_widget)
        
        self.label = QLabel("Select a exam session:")
        self.layout.addWidget(self.label)

        self.list_widget = QListWidget()
        self.layout.addWidget(self.list_widget)

        self.label2 = QLabel("Exam session found: ", self)
        self.layout.addWidget(self.label2)

        # 3. Start data fetch automatically
        self.load_data_from_fastapi()

    def load_data_from_fastapi(self):
        # Assuming your local FastAPI is running on http://127.0.0.1:8000
        self.worker = FetchDataWorker("http://127.0.0.1:8000/exam-questions")
        self.worker.data_ready.connect(self.update_ui)
        self.worker.start()

    def update_ui(self, data_dict):
        # Update the home page with the fetched data
        if "error" in data_dict:
            self.label.setText(data_dict["error"])
        else:
            for question in data_dict:
                self.add_item_with_button(question.get('_id', 'N/A'), question.get('title', 'N/A'), question.get('description', 'N/A'), question.get('date', 'N/A'))
                self.label2.setText(f"Exam session found: {len(data_dict)}")

    def add_item_with_button(self, exam_question_id, text, description, date):
        # 2. Create a base QListWidgetItem
        item = QListWidgetItem()
        self.list_widget.addItem(item)

        # 3. Create the custom container widget and horizontal layout
        row_widget = QWidget()
        layout = QFormLayout(row_widget)
        layout.setContentsMargins(5, 5, 5, 25)  # Tighten padding inside the row

        # Bold font for labels
        font = QFont("Arial", 8, QFont.Bold)

        # 4. Create row content (Label + Button)
        questionLabel = QLabel("Exam Title:")
        questionLabel.setFont(font)
        questionText = QLabel(text)
        descriptionLabel = QLabel("Exam Description:")
        descriptionLabel.setFont(font)
        descriptionText = QLabel(description)
        dateLabel = QLabel("Exam Date:")
        dateLabel.setFont(font)
        dateText = QLabel(date)
        button = QPushButton("Join Exam")
        button.setFont(font)
        
        # Connect button click event and pass the specific item context
        button.clicked.connect(lambda: self.handle_button_click(item, exam_question_id))

        # 5. Add elements to layout (with a stretch to push button to the right)
        layout.addRow(questionLabel, questionText)
        layout.addRow(descriptionLabel, descriptionText)
        layout.addRow(dateLabel, dateText)
        layout.addRow("", button)

        # 6. Adjust row size hint so the list widget wraps the custom container properly
        item.setSizeHint(row_widget.sizeHint())

        # 7. Associate the custom widget with the QListWidgetItem
        self.list_widget.setItemWidget(item, row_widget)

    def handle_button_click(self, item, exam_question_id):
        # Action to perform when the button is clicked (e.g., delete item)
        row_index = self.list_widget.row(item)
        print(f"Clicked button on row {row_index} for item: {item.text()}")
        print(f"Exam Question ID: {exam_question_id}")
        self.navigate_to_exam_answering_window(exam_question_id, exam_start="2026-08-07T00:30:00", exam_end="2026-08-07T00:30:10")  # Example start and end times

        # Safely remove the item from the list
        # self.list_widget.takeItem(row_index)

    def navigate_to_exam_answering_window(self, exam_question_id, exam_start, exam_end):
        # Close the current window
        self.close()

        # Open the Exam Answering Window
        self.exam_answering_window = ExamAnsweringWindow(exam_start, exam_end, exam_question_id)  
        self.exam_answering_window.show()
                
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = HomePage()
    window.show()
    sys.exit(app.exec())
