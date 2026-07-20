import sys
import json
from PySide6.QtWidgets import QApplication, QFormLayout, QListWidget, QMainWindow, QLabel, QVBoxLayout, QWidget, QListWidgetItem, QHBoxLayout, QPushButton
from PySide6.QtCore import QEventLoop, QSize, QThread, Signal, QUrl
from PySide6.QtNetwork import QNetworkAccessManager, QNetworkRequest, QNetworkReply
from PySide6.QtGui import QFont

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
    def __init__(self, exam_question_id=None):
        super().__init__()
        self.exam_question_id = exam_question_id
        print("Fetched exam_question_id: ", self.exam_question_id)
        self.setWindowTitle("Student Answering Page")
        # self.setGeometry(100, 100, 400, 200)
        self.setFixedSize(1200, 600)

        # UI Setup
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout = QVBoxLayout(self.central_widget)

        # Add a formLayout to the central widget for better alignment
        self.form_layout = QFormLayout()
        self.layout.addLayout(self.form_layout)

        # Fonts for labels and texts
        titleFont = QFont("Arial", 12, QFont.Bold)
        textFont = QFont("Arial", 12)

        # Exam Title
        examTitleLabel = QLabel("Exam Title: ")
        examTitleLabel.setFont(titleFont)
        self.examTitle = QLabel("")  
        self.examTitle.setFont(textFont)

        # Exam Description
        examDescriptionLabel = QLabel("Exam Description: ")
        examDescriptionLabel.setFont(titleFont)
        self.examDescription = QLabel("")  
        self.examDescription.setFont(textFont)

        # Exam Hour
        examHourLabel = QLabel("Exam Hour: ")
        examHourLabel.setFont(titleFont)
        self.examHour = QLabel("")  
        self.examHour.setFont(textFont)

        # Exam Hour
        numOfSectionLabel = QLabel("Number of Sections: ")
        numOfSectionLabel.setFont(titleFont)
        self.numOfSections = QLabel("")  
        self.numOfSections.setFont(textFont)

        self.form_layout.addRow(examTitleLabel, self.examTitle)
        self.form_layout.addRow(examDescriptionLabel, self.examDescription)
        self.form_layout.addRow(examHourLabel, self.examHour)
        self.form_layout.addRow(numOfSectionLabel, self.numOfSections)

        self.layout.addStretch()  # Add stretch to push the form layout to the top

        # 3. Start data fetch automatically
        self.load_data_from_fastapi()

    def load_data_from_fastapi(self):
        # Assuming your local FastAPI is running on http://127.0.0.1:8000
        self.worker = FetchDataWorker("http://127.0.0.1:8000/exam-questions/" + (self.exam_question_id if self.exam_question_id else ""))
        self.worker.data_ready.connect(self.update_ui)
        self.worker.start()

    def update_ui(self, data_dict):
        # Update the home page with the fetched data
        if "error" in data_dict:
            self.label.setText(data_dict["error"])
        else:
                # self.add_item_with_button(data_dict.get('_id', 'N/A'), data_dict.get('title', 'N/A'), data_dict.get('description', 'N/A'), data_dict.get('date', 'N/A'))
                print("Data fetched: ", data_dict)
                self.examTitle.setText(data_dict.get('title', ''))
                self.examDescription.setText(data_dict.get('description', ''))
                self.examHour.setText(data_dict.get('date', ''))
                self.numOfSections.setText(str(data_dict.get('number_of_section', '')))
                self.create_exam_section(data_dict.get('sections', []))
    
    def create_exam_section(self, section_data = []):
        for section in section_data:
            sectionId = section.get('id', 'N/A')
            sectionTitle = section.get('title', 'N/A')
            sectionDescription = section.get('description', 'N/A')

            titleFont = QFont("Arial", 12, QFont.Bold)
            textFont = QFont("Arial", 12)

            # Section Label and Text
            sectionLabel = QLabel("Section ")
            sectionLabel.setFont(titleFont)
            sectionText = QLabel(str(sectionId))  
            sectionText.setFont(textFont)

            # Section Title Label and Text
            sectionTitleLabel = QLabel("Section Title: ")
            sectionTitleLabel.setFont(titleFont)
            sectionTitleText = QLabel(sectionTitle)  
            sectionTitleText.setFont(textFont)

            # Section Description Label and Text
            sectionDescriptionLabel = QLabel("Section Description: ")
            sectionDescriptionLabel.setFont(titleFont)
            sectionDescriptionText = QLabel(sectionDescription)  
            sectionDescriptionText.setFont(textFont)

            self.form_layout.addRow(sectionLabel, sectionText)
            self.form_layout.addRow(sectionTitleLabel, sectionTitleText)
            self.form_layout.addRow(sectionDescriptionLabel, sectionDescriptionText)

            numberIncrementer = 1
            for objective in section.get('objective_questions', []):
                
                objectiveTitle = objective.get('title', 'N/A')
                objectiveNumOfOptions = objective.get('numOptions', 'N/A')
                objectiveCorrectAnswer = objective.get('correctAnswer', 'N/A')
                objectiveMarks = objective.get('marks', 'N/A')

                # Objective No. and Title
                objectiveLabel = QLabel("No. " + str(numberIncrementer))
                numberIncrementer += 1
                objectiveLabel.setFont(titleFont)
                objectiveText = QLabel(objectiveTitle)  
                objectiveText.setFont(textFont)

                self.form_layout.addRow(objectiveLabel, objectiveText)


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
        questionLabel = QLabel("Question:")
        questionLabel.setFont(font)
        questionText = QLabel(text)
        descriptionLabel = QLabel("Description:")
        descriptionLabel.setFont(font)
        descriptionText = QLabel(description)
        dateLabel = QLabel("Date:")
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

                
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ExamAnsweringWindow()
    window.show()
    sys.exit(app.exec())
