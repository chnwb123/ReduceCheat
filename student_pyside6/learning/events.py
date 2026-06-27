from PySide6.QtWidgets import QApplication, QHBoxLayout, QMainWindow, QLabel, QMessageBox, QWidget, QVBoxLayout, QPushButton, QLineEdit, QTextEdit, QSlider, QProgressBar, QComboBox, QListWidget, QRadioButton, QCheckBox
from PySide6.QtCore import Qt

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("Hello PySide6") 

        container = QWidget()

        # self.setFixedSize(400, 300)
        self.setCentralWidget(container)

        layout = QVBoxLayout(container)

        label = QLabel("Label")
        label.setAlignment(Qt.AlignCenter)

        button = QPushButton("Button")
        button.clicked.connect(lambda: print("Button clicked"))

        button2 = QPushButton("Show Choices")
        button2.clicked.connect(self.ask_choices)

        listwidget = QListWidget()
        listwidget.addItems(["Item 1", "Item 2", "Item 3"])

        listwidget.itemDoubleClicked.connect(lambda item: print(f"{item.text()} clicked"))
        
        inner_container = QWidget()
        inner_layout = QHBoxLayout(inner_container)

        radio1 = QRadioButton("Radio 1")
        radio2 = QRadioButton("Radio 2")
        radio3 = QRadioButton("Radio 3")

        for r in (radio1, radio2, radio3):
             r.toggled.connect(self.radio_changed)

        inner_layout.addWidget(radio1)
        inner_layout.addWidget(radio2)
        inner_layout.addWidget(radio3)

        layout.addWidget(label)
        layout.addWidget(button)
        layout.addWidget(listwidget)
        layout.addWidget(inner_container)
        layout.addWidget(button2)

    def radio_changed(self):
        r = self.sender()
        if r.isChecked():
            print(f"{r.text()} is checked")

    def ask_choices(self):
        msg = QMessageBox(self)

        msg.setWindowTitle("Choice")
        msg.setText("Choose an option")

        python = msg.addButton("Python", QMessageBox.AcceptRole)
        java = msg.addButton("Java", QMessageBox.AcceptRole)
        javascript = msg.addButton("JavaScript", QMessageBox.AcceptRole)

        msg.exec()

        if msg.clickedButton() == python:
            print("Python chosen")
        elif msg.clickedButton() == java:
            print("Java chosen")
        elif msg.clickedButton() == javascript:
            print("JavaScript chosen")

app = QApplication()

window = MainWindow()
window.show()

app.exec()