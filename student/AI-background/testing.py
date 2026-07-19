import cv2
import mediapipe as mp
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os 
import math
import numpy as np

# 1. Path to your downloaded .task file
model_path = os.path.join(os.path.dirname(__file__), "model", "face_landmarker.task")

# Global variable to safely store the latest async prediction results
latest_result = None
last_print_time = 0
img_h, img_w = 0, 0  # Global variables to store image dimensions

def print_result_callback(result: vision.FaceLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    """
    Asynchronous callback function to retrieve face landmarker predictions.
    """
    global latest_result, last_print_time
    latest_result = result

    if timestamp_ms - last_print_time > 1000:  # Print results every 1 second
        last_print_time = timestamp_ms
        print_face_landmarker_result(result)

def print_face_landmarker_result(result: vision.FaceLandmarkerResult):
    print("FaceLandmarkerResult:")

    # print("  face_landmarks:")
    # for face_index, face_landmarks in enumerate(result.face_landmarks or []):
    #     print(f"    Face #{face_index}:")
    #     for i, landmark in enumerate(face_landmarks):
    #         print(f"      NormalizedLandmark #{i}:")
    #         print(f"        x: {landmark.x}")
    #         print(f"        y: {landmark.y}")
    #         print(f"        z: {landmark.z}")

    # print("  face_landmarks:")
    # for face_index, face_landmarks in enumerate(result.face_landmarks or []):
    #     print(f"    Face #{face_index}:")
    #     delta_x = 0
    #     delta_z = 0
    #     for i, landmark in enumerate(face_landmarks):
    #         if (i == 33):
    #             delta_x = landmark.x
    #             delta_z = landmark.z
            
    #         if (i == 263):
    #             delta_x = landmark.x - delta_x
    #             delta_z = landmark.z - delta_z
        
    #     yaw_radians = math.atan2(delta_z, delta_x)
    #     yaw_degrees = math.degrees(yaw_radians)
    #     print(f"     yaw_radians: {yaw_radians}")
    #     print(f"     yaw_degrees: {yaw_degrees}")

    # Generic 3D model coordinates of a standard face
    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nose tip (Landmark 1)
        (0.0, -330.0, -65.0),        # Chin (Landmark 152)
        (-225.0, 170.0, -135.0),     # Left eye left corner (Landmark 33)
        (225.0, 170.0, -135.0),      # Right eye right corner (Landmark 263)
        (-150.0, -150.0, -125.0),    # Left mouth corner (Landmark 61)
        (150.0, -150.0, -125.0)      # Right mouth corner (Landmark 291)
    ], dtype=np.float32)

    print("  face_landmarks:")
    for face_index, face_landmarks in enumerate(result.face_landmarks or []):
        print(f"    Face #{face_index}:")
        
        # Extract matching 2D pixel coordinates from MediaPipe
        # 'img_w' and 'img_h' are your image dimensions

        image_points = np.array([
            [face_landmarks[1].x * img_w, face_landmarks[1].y * img_h],     # Nose tip
            [face_landmarks[152].x * img_w, face_landmarks[152].y * img_h], # Chin
            [face_landmarks[33].x * img_w, face_landmarks[33].y * img_h],   # Left eye corner
            [face_landmarks[263].x * img_w, face_landmarks[263].y * img_h], # Right eye corner
            [face_landmarks[61].x * img_w, face_landmarks[61].y * img_h],   # Left mouth corner
            [face_landmarks[291].x * img_w, face_landmarks[291].y * img_h]  # Right mouth corner
        ], dtype=np.float32)

        print(f"      image_points: {image_points}")

        focal_length = img_w
        center = (img_w / 2, img_h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float32)

        dist_coeffs = np.zeros((4, 1)) # Assuming no lens distortion

        # Find rotation and translation vectors
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
        )

        # Convert rotation vector to a 3x3 Rotation Matrix
        rmat, _ = cv2.Rodrigues(rotation_vector)

        # Decompose rotation matrix into Euler angles (Yaw, Pitch, Roll)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

        # Extract Yaw (rotation around Y-axis)
        # Note: Check angle signs based on your coordinate convention mapping
        yaw = angles[1] 
        print(f"Face Yaw Angle: {yaw:.2f} degrees")


    # print("  face_blendshapes:")
    # for face_index, classifications in enumerate(result.face_blendshapes or []):
    #     print(f"    Face #{face_index}:")
    #     for category in classifications:
    #         # if (category.category_name == "eyeLookOutLeft" or category.category_name == "eyeLookOutRight"): 
    #             print(f"      {category.category_name}: {category.score}")

    # print("  facial_transformation_matrixes:")
    # for face_index, matrix in enumerate(result.facial_transformation_matrixes or []):
    #     print(f"    Face #{face_index}:")
    #     rows = matrix.tolist() if hasattr(matrix, "tolist") else matrix
    #     for row in rows:
    #         print(f"      {row}")

def main():
    global latest_result
    
    # 2. Configure MediaPipe Face Landmarker Options for LIVE_STREAM mode
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.LIVE_STREAM,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=True,
        result_callback=print_result_callback # Mandatory for LIVESTREAM mode
    )
    
    # 3. Initialize OpenCV Video Capture (0 is usually the default webcam)
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    # 4. Use the context manager to open the FaceLandmarker
    with vision.FaceLandmarker.create_from_options(options) as landmarker:
        print("Camera stream started. Press 'q' to exit.")
        
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            global img_h, img_w 
            img_h, img_w= frame.shape[:2]

            # Convert the BGR OpenCV image to RGB format required by MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Convert raw frame to a MediaPipe Image object
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Generate a monotonically increasing timestamp in milliseconds
            timestamp_ms = int(time.time() * 1000)
            
            # Send the frame to the landmarker for asynchronous processing
            landmarker.detect_async(mp_image, timestamp_ms)
            
            # 5. Draw the landmarks if a result has returned from the callback
            if latest_result is not None and latest_result.face_landmarks:
                for face_landmarks in latest_result.face_landmarks:
                    # Loop over all 478 detected landmarks
                    for landmark in face_landmarks:
                        # Convert normalized coordinates (0.0 to 1.0) to pixel coordinates
                        x = int(landmark.x * frame.shape[1])
                        y = int(landmark.y * frame.shape[0])
                        
                        # Draw a small circle on each landmark coordinate
                        cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)
            
            # Flip the image horizontally for a mirror-like selfie view
            display_frame = cv2.flip(frame, 1)

            # Display the processed window
            cv2.imshow('MediaPipe Face Landmarker Livestream', display_frame)
            
            # Break loop when 'q' key is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    # 6. Cleanup
    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()