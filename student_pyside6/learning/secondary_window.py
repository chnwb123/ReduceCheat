from PySide6.QtWidgets import QApplication, QLabel, QMainWindow, QPushButton
from PySide6.QtCore import Qt

class SecondaryWindow(QMainWindow):
    def __init__(self, n):
        super().__init__()

        self.setWindowTitle(f"Secondary Window {n}")

        label = QLabel(f"Secondary Window {n}")
        label.setAlignment(Qt.AlignCenter)

        self.setCentralWidget(label)
        
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("Hello PySide6") 

        button = QPushButton("Open Secondary Window")
        button.clicked.connect(self.open_secondary_window)

        self.setCentralWidget(button)

        self.count = 1
        self.windows = []

    def open_secondary_window(self):
        w = SecondaryWindow(self.count)
        self.count += 1
        self.windows.append(w)

        w.show()






app = QApplication()

window = MainWindow()
window.show()

app.exec()