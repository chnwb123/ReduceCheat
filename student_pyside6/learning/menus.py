from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtCore import Qt

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("Hello PySide6") 

        menubar = self.menuBar()

        fileMenu = menubar.addMenu("File")
        editMenu = menubar.addMenu("Edit")
        helpMenu = menubar.addMenu("?")

        aboutAction = helpMenu.addAction("About")

        subMenu = fileMenu.addMenu("Submenu")
        exitAction = subMenu.addAction("Exit")

        exitAction.triggered.connect(self.close)
        aboutAction.triggered.connect(lambda: print("About menu clicked"))



app = QApplication()

window = MainWindow()
window.show()

app.exec()