import sys
import json
import requests
from PySide6.QtWidgets import (QApplication, QWidget, QVBoxLayout, 
                               QLineEdit, QPushButton, QLabel)
from PySide6.QtCore import QThread, Signal

# Thread to handle the network request
class LoginWorker(QThread):
    success = Signal(str)
    error = Signal(str)

    def __init__(self, username, password, user):
        super().__init__()
        self.username = username
        self.password = password
        self.user = user

    def run(self):
        url = "http://127.0.0.1:8000/login"  # FastAPI endpoint
        payload = {"username": self.username, "password": self.password}
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=5)
            if response.status_code == 200:
                self.success.emit(response.json().get("message"))
                self.user = response.json().get("user")  # Store the user data
                print("User data stored in the worker:", self.user)
            else:
                self.error.emit(f"Login failed: {response.json().get('detail')}")
        except requests.exceptions.ConnectionError:
            self.error.emit("Connection Error: Could not reach the server.")
        except Exception as e:
            self.error.emit(f"An error occurred: {str(e)}")

# Main Login UI
class LoginWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.setFixedSize(500, 300)

    def init_ui(self):
        layout = QVBoxLayout()
        
        self.user_input = QLineEdit()
        self.user_input.setPlaceholderText("Username")
        self.pass_input = QLineEdit()
        self.pass_input.setPlaceholderText("Password")
        self.pass_input.setEchoMode(QLineEdit.Password)
        
        self.login_btn = QPushButton("Login")
        self.login_btn.clicked.connect(self.start_login)
        
        self.status_label = QLabel("Enter your credentials")

        layout.addWidget(self.user_input)
        layout.addWidget(self.pass_input)
        layout.addWidget(self.login_btn)
        layout.addWidget(self.status_label)
        self.setLayout(layout)

    def start_login(self):
        self.status_label.setText("Logging in...")
        self.login_btn.setEnabled(False)
        
        self.worker = LoginWorker(self.user_input.text(), self.pass_input.text(), None)
        self.worker.success.connect(self.on_login_success)
        self.worker.error.connect(self.on_login_error)
        self.worker.start()

    def on_login_success(self, message):
        self.status_label.setText(f"Success: {message}")
        self.login_btn.setEnabled(True)

    def on_login_error(self, error_msg):
        self.status_label.setText(error_msg)
        self.login_btn.setEnabled(True)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LoginWindow()
    window.show()
    sys.exit(app.exec())
