"use client";
import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";
import { ExamQuestionDB } from "@/app/api/mongodb/write/instructor/create-one-exam-question/route";
import { InvigilatorPageProps } from "@/app/invigilator/[invigilatorId]/page";
import { io, type Socket } from "socket.io-client";
import { Circle } from "lucide-react";
import { ObjectId } from "mongodb";

export const GreenDotCircle = () => {
  return <Circle className="h-4 w-4 fill-green-500 text-green-500" />;
};

export const RedDotCircle = () => {
  return <Circle className="h-4 w-4 fill-red-500 text-red-500" />;
};

export type UserAnalysisData = {
  user_role_id?: string,
  role_id?: string, // for EXAM_ANALYSIS db
  exam_session_id?: string,
  exam_question_id?: ObjectId, // for EXAM_ANALYSIS db
  yaw_angles_collection: number[],
  latest_yaw_angle: string,
  average_yaw_angle: number,
  yaw_angle_status: string,
  number_of_warnings: number,
  warnings_reasons: string[],
  number_of_violations: number,
  violations_reasons: string[],
  phone_detection_status: string
}

export default function InvigilatorPage({
  params,
  searchParams,
}: InvigilatorPageProps) {
  const [invigilatorId, setInvigilatorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [examSessionId, setExamSessionId] = useState<ExamQuestionDB["_id"]>("");
  const [backendData, setBackendData] = useState<UserAnalysisData[]>([]);
  const [status, setStatus] = useState("Disconnected");
  const socketRef = useRef<Socket | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isViewingWarnings, setIsViewingWarnings] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { invigilatorId } = await params;
      const { name, examSessionId } = await searchParams;
      console.log("Invigilator ID from params:", invigilatorId);
      console.log("Name from searchParams:", name);
      console.log("Exam Session ID from searchParams:", examSessionId);
      setInvigilatorId(invigilatorId);
      setName(name);
      setExamSessionId(examSessionId);
    };

    getParams();
  }, [params, searchParams]);

  useEffect(() => {
    // Connect directly to the FastAPI server port (e.g., 8000)
    const socket = io("http://localhost:8000", {
      transports: ["websocket"], // Forces WebSocket transport layer
    });

    socketRef.current = socket;

    // Listen for connection confirmation
    socket.on("connect", () => {
      setStatus("Connected");
    });

    // Listen for custom server status event from FastAPI
    socket.on("server_status", (data) => {
      console.log(data.data);
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("student_analysis_data", (data) => {
      setBackendData(data.student_analysis_data);
      console.log(
        "Received student analysis data:",
        data.student_analysis_data,
      );
    });

    // Cleanup connection when component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleViewWarnings = (userRoleId: string) => {
    setViewingUserId(userRoleId);
    setIsViewingWarnings(true);
  };

  const handleViewViolations = (userRoleId: string) => {
    setViewingUserId(userRoleId);
    setIsViewingWarnings(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar
        navItems={[
          { label: "Home", href: `/invigilator/${invigilatorId}?name=${name}` },
          {
            label: "Monitor Exams",
            href: `/invigilator/monitor-exams/${invigilatorId}?name=${name}`,
          },
        ]}
      />
      <div
        id="editModal"
        className={`${viewingUserId ? "block" : "hidden"} fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
      >
        <div className="relative w-full max-w-md rounded-xl bg-white px-4 py-1 shadow-2xl transition-all">
            <h1 className="mb-2 text-center text-xl font-bold tracking-tight text-black">
              Viewing {isViewingWarnings ? "Warnings" : "Violations"} for User
              ID: {viewingUserId}
            </h1>
            <ul>
              {isViewingWarnings
                ? backendData.find(
                    (studentData: UserAnalysisData) =>
                      studentData.user_role_id === viewingUserId,
                  )?.warnings_reasons.map((reason: string, index: number) => (
                    <li key={"warning-" + index}>{index + 1}. {reason}</li>
                  )) || []
                : (
                    backendData.find(
                      (studentData: UserAnalysisData) =>
                        studentData.user_role_id === viewingUserId,
                    )?.violations_reasons || []
                  ).map((reason: string, index: number) => (
                    <li key={"violation-" + index}>{index + 1}. {reason}</li>
                  ))}
            </ul>
        </div>

        <div className="ml-2 flex justify-end space-x-2 pt-2">
          <button
            type="button"
            id="closeModalBtn"
            className="text-md rounded-md border border-gray-300 px-4 py-2 font-medium text-white hover:bg-gray-50 hover:text-gray-700"
            onClick={() => setViewingUserId(null)}
          >
            Back
          </button>
        </div>
      </div>

      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Monitoring Exam Session: exam_{String(examSessionId)}
          </h1>
        </div>
        <div className="text-white">
          <h3>
            Connection to Server Status:{" "}
            <span
              className={
                status === "Connected" ? "text-green-500" : "text-red-500"
              }
            >
              {" "}
              {status == "Connected" ? "Connected" : "Disconnected"}{" "}
            </span>{" "}
          </h3>
          <h3>Student Analysis Data:</h3>
          {backendData && backendData.length == 0 ? (
            <p>No student analysis data available.</p>
          ) : (
            <div className="text-md grid grid-cols-5 gap-x-5 gap-y-2 p-2">
              {backendData.filter((studentData: UserAnalysisData) => studentData.exam_session_id === `exam_${examSessionId}`).map((studentData: UserAnalysisData, index: number) => (
                <div key={index} className="rounded bg-gray-300 p-2 text-black">
                  <p>Student ID: {studentData.user_role_id}</p>
                  <p>
                    Average Head Tilt Angle:{" "}
                    {studentData.average_yaw_angle.toFixed(2)}
                  </p>
                  <p>Head Tilt Status: {studentData.yaw_angle_status}</p>
                  <p>
                    Number of Warnings: {studentData.number_of_warnings}{" "}
                    {studentData.number_of_warnings > 0 && (
                      <button
                        className="ml-2 rounded text-orange-700 hover:text-orange-900"
                        onClick={() => {
                          handleViewWarnings(String(studentData.user_role_id));
                        }}
                      >
                        View Warnings
                      </button>
                    )}
                  </p>
                  <p>
                    Number of Violations: {studentData.number_of_violations}{" "}
                    {studentData.number_of_violations > 0 && (
                      <button
                        className="ml-2 rounded text-red-500 hover:text-red-700"
                        onClick={() => {
                          handleViewViolations(String(studentData.user_role_id));
                        }}
                      >
                        View Violations
                      </button>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
