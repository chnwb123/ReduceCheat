import sys
import json
import requests
from PySide6.QtCore import QThread, Signal
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, 
    QLineEdit, QPushButton, QLabel, QFrame
)
from PySide6.QtGui import QLinearGradient, QPalette, QBrush, QColor, QFont, QPixmap
from main_menu import HomePage


# Thread to handle the network request
class LoginWorker(QThread):
    success = Signal(str, dict)
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
                body = response.json()
                self.success.emit(body.get("message"), body.get("user", {}))
            else:
                self.error.emit(f"{response.json().get('detail')}")
        except requests.exceptions.ConnectionError:
            self.error.emit("Connection Error: Could not reach the server.")
        except Exception as e:
            self.error.emit(f"An error occurred: {str(e)}")
            print(f"Exception in LoginWorker: {str(e)}")
    
class LoginForm(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        # Set up core window geometry
        self.setWindowTitle("Secure Login")
        self.setFixedSize(500, 550)
        self.setWindowFlags(Qt.Window | Qt.CustomizeWindowHint | Qt.WindowTitleHint | Qt.WindowCloseButtonHint)
        
        # 1. Apply a beautiful dark gradient background to the entire window
        gradient = QLinearGradient(0, 0, 0, self.height())
        gradient.setColorAt(0.0, QColor("#1e1e2f"))
        gradient.setColorAt(1.0, QColor("#111119"))
        
        palette = self.palette()
        palette.setBrush(QPalette.Window, QBrush(gradient))
        self.setPalette(palette)
        self.setAutoFillBackground(True)

        # 2. Main layout mapping
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(40, 50, 40, 50)
        main_layout.setSpacing(0)

        image_label = QLabel(self)
        pixmap = QPixmap("student/pyside/img/ReduceCheat_Logo.png")
        image_label.setScaledContents(True)
        image_label.setPixmap(pixmap)
        main_layout.addWidget(image_label)

        # 3. Logo/Header Label
        title_label = QLabel("Welcome to ReduceCheat")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setObjectName("TitleLabel")
        title_label.setFont(QFont("Segoe UI", 24, QFont.Bold))
        main_layout.addWidget(title_label)

        subtitle_label = QLabel("Please sign in to continue")
        subtitle_label.setAlignment(Qt.AlignCenter)
        subtitle_label.setObjectName("SubtitleLabel")
        subtitle_label.setFont(QFont("Segoe UI", 10))
        main_layout.addWidget(subtitle_label)
        
        main_layout.addSpacing(40)

        # 4. Input Fields Setup
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("Username or Email")
        self.username_input.setObjectName("InputField")
        main_layout.addWidget(self.username_input)
        
        main_layout.addSpacing(16)

        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Password")
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.setObjectName("InputField")
        main_layout.addWidget(self.password_input)
        
        main_layout.addSpacing(12)

        # 5. Forgot Password Link
        forgot_layout = QHBoxLayout()
        forgot_layout.addStretch()
        forgot_btn = QPushButton("Forgot Password?")
        forgot_btn.setObjectName("LinkButton")
        self.status_label = QLabel("")
        self.status_label.setObjectName("LoginStatusLabel")
        forgot_layout.addWidget(forgot_btn)
        forgot_layout.addWidget(self.status_label)
        main_layout.addLayout(forgot_layout)
        main_layout.addSpacing(28)

        # 6. Primary Action Login Button
        self.login_btn = QPushButton("LOG IN")
        self.login_btn.setObjectName("PrimaryButton")
        self.login_btn.setCursor(Qt.PointingHandCursor)
        self.login_btn.clicked.connect(self.handle_login)
        main_layout.addWidget(self.login_btn)

        main_layout.addStretch()

        # 7. Signup Row Footer
        footer_layout = QHBoxLayout()
        footer_layout.setAlignment(Qt.AlignCenter)
        
        footer_text = QLabel("Don't have an account?")
        footer_text.setObjectName("FooterText")
        
        signup_btn = QPushButton("Sign Up")
        signup_btn.setObjectName("LinkButton")
        signup_btn.setCursor(Qt.PointingHandCursor)
        
        footer_layout.addWidget(footer_text)
        footer_layout.addWidget(signup_btn)
        main_layout.addLayout(footer_layout)

        # Apply Global Component Styling via QSS
        self.apply_styles()

    def handle_login(self):
        username = self.username_input.text()
        password = self.password_input.text()
        print(f"Attempting login for: {username}")

        self.status_label.setText("Logging in...")
        self.login_btn.setEnabled(False)
        
        self.worker = LoginWorker(username, password, None)
        self.worker.success.connect(self.on_login_success)
        self.worker.error.connect(self.on_login_error)
        self.worker.start()

    def on_login_success(self, message, user):
        self.status_label.setText(f"{message}")
        self.login_btn.setEnabled(True)
        student_role_id = user.get("role_id")
        if not student_role_id:
            self.status_label.setText("Login ok, but no student role id returned.")
            return
        self.navigate_to_student_main_menu_window(student_role_id)
    
    def navigate_to_student_main_menu_window(self, role_id):
        print("Navigating to student main menu window with role_id:", role_id)
        # Close the current window
        self.close()

        # Open the Exam Answering Window
        self.main_menu = HomePage(student_role_id=role_id)
        self.main_menu.show()


    def on_login_error(self, error_msg):
        self.status_label.setText(error_msg)
        self.login_btn.setEnabled(True)

    def apply_styles(self):
        self.setStyleSheet("""
            /* Typography & General Colors */
            QLabel#TitleLabel {
                color: #ffffff;
                margin-bottom: 5px;
            }
            QLabel#SubtitleLabel {
                color: #a0a0b2;
            }
            QLabel#FooterText {
                color: #7e7e8f;
                font-size: 11px;
            }
            QLabel#LoginStatusLabel {
                color: #ffffff;
                font-family: 'Segoe UI';
                font-size: 12px;
                font-weight: bold;
                margin-left: 10px;
            }

            /* Modern Input Fields styling */
            QLineEdit#InputField {
                background-color: #252538;
                border: 2px solid #2b2b3d;
                border-radius: 8px;
                padding: 12px 16px;
                color: #ffffff;
                font-family: 'Segoe UI';
                font-size: 13px;
            }
            QLineEdit#InputField:focus {
                border: 2px solid #6366f1; /* Neon Purple focus ring */
                background-color: #2a2a3f;
            }

            /* Primary Action Button (Call-To-Action) */
            QPushButton#PrimaryButton {
                background-color: #6366f1;
                color: #ffffff;
                border: none;
                border-radius: 8px;
                padding: 14px;
                font-family: 'Segoe UI';
                font-size: 13px;
                font-weight: bold;
                letter-spacing: 1px;
            }
            QPushButton#PrimaryButton:hover {
                background-color: #4f46e5;
            }
            QPushButton#PrimaryButton:pressed {
                background-color: #4338ca;
            }

            /* Flat Link Button Style */
            QPushButton#LinkButton {
                background: none;
                border: none;
                color: #6366f1;
                font-family: 'Segoe UI';
                font-size: 12px;
                font-weight: bold;
                padding: 0px;
            }
            QPushButton#LinkButton:hover {
                color: #818cf8;
                text-decoration: underline;
            }
        """)        

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LoginForm()
    window.show()
    sys.exit(app.exec())
