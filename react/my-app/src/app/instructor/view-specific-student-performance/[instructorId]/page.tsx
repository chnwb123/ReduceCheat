"use client";
import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";
import { ExamQuestionDB } from "@/app/api/mongodb/write/instructor/create-one-exam-question/route";
import { InstructorPageProps } from "@/app/instructor/[instructorId]/page";
import { UserAnalysisData } from "@/app/invigilator/monitor-specific-exam/[invigilatorId]/page";
import { Loading } from "@/components/general/animation/loading/page";
import { ObjectId } from "mongodb";
import Link from "next/link";

export default function InstructorPage({
  params,
  searchParams,
}: InstructorPageProps) {
  const [instructorId, setInstructorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [examSessionId, setExamSessionId] = useState<ExamQuestionDB["_id"]>("");
  const [studentAnalysisPerformance, setStudentAnalysisPerformance] = useState<
    UserAnalysisData[]
  >([]);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isViewingWarnings, setIsViewingWarnings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { instructorId } = await params;
      const { name, examSessionId } = await searchParams;
      console.log("Instructor ID from params:", instructorId);
      console.log("Name from searchParams:", name);
      console.log("Exam Session ID from searchParams:", examSessionId);
      setInstructorId(instructorId);
      setName(name);
      setExamSessionId(examSessionId);
    };

    getParams();
  }, []);

  useEffect(() => {
    const getStudentAnalysisPerformance = async () => {
      if (examSessionId === "") {
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/instructor/get-student-analysis-performance/${examSessionId}`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const studentAnalysisData = await response.json();
          setIsLoading(false);
          setStudentAnalysisPerformance(studentAnalysisData);
          console.log("Fetched student analysis data:", studentAnalysisData);
        }
      } catch (error) {
        console.error("Failed to fetch student analysis data:", error);
      }
    };
    getStudentAnalysisPerformance();
  }, [examSessionId]);

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
          { label: "Home", href: `/instructor/${instructorId}?name=${name}` },
          {
            label: "Create Exam",
            href: `/instructor/create-question/${instructorId}?name=${name}`,
          },
          {
            label: "View Student Performance",
            href: `/instructor/view-student-performance/${instructorId}?name=${name}`,
          },
        ]}
      />
      <div
        id="editModal"
        className={`${viewingUserId ? "block" : "hidden"} fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
      >
        <div className="relative w-full max-w-md rounded-xl bg-white px-4 py-1 shadow-2xl transition-all">
          <h1 className="mb-2 text-center text-xl font-bold tracking-tight text-black">
            Viewing {isViewingWarnings ? "Warnings" : "Violations"} for User ID:{" "}
            {viewingUserId}
          </h1>
          <ul>
            {isViewingWarnings
              ? studentAnalysisPerformance
                  .find(
                    (studentData: UserAnalysisData) =>
                      studentData.role_id === viewingUserId,
                  )
                  ?.warnings_reasons.map((reason: string, index: number) => (
                    <li key={"warning-" + index}>
                      {index + 1}. {reason}
                    </li>
                  )) || []
              : (
                  studentAnalysisPerformance.find(
                    (studentData: UserAnalysisData) =>
                      studentData.role_id === viewingUserId,
                  )?.violations_reasons || []
                ).map((reason: string, index: number) => (
                  <li key={"violation-" + index}>
                    {index + 1}. {reason}
                  </li>
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
          <h3>Student Analysis Data:</h3>
          {studentAnalysisPerformance &&
          studentAnalysisPerformance.length == 0 ? (
            <p>No student analysis data available.</p>
          ) : (
            <div className="text-md grid grid-cols-5 gap-x-5 gap-y-2 p-2">
              {studentAnalysisPerformance
                .filter(
                  (studentData: UserAnalysisData) =>
                    String(studentData.exam_question_id) === examSessionId,
                )
                .map((studentData: UserAnalysisData, index: number) => (
                  <div
                    key={index}
                    className="rounded bg-gray-300 p-2 text-black"
                  >
                    <p className="font-bold">Student ID: {studentData.role_id}</p>
                    <p>
                      Average Head Tilt Angle:{" "}
                      {studentData.average_yaw_angle.toFixed(2)}
                    </p>
                    {/* <p>Head Tilt Status: {studentData.yaw_angle_status}</p> */}
                    <p>
                      Number of Warnings: {studentData.number_of_warnings}{" "}
                      {studentData.number_of_warnings > 0 && (
                        <button
                          className="ml-2 rounded text-orange-700 hover:text-orange-900"
                          onClick={() => {
                            handleViewWarnings(String(studentData.role_id));
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
                            handleViewViolations(String(studentData.role_id));
                          }}
                        >
                          View Violations
                        </button>
                      )}
                    </p>
                    <p className="font-bold">Cheating Suspicion Score: {studentData.cheating_suspicion_score?.toFixed(2)}%</p>
                    {/* <p>
                      Phone Detection Status:{" "}
                      {studentData.phone_detection_status === "not_detected"
                        ? "Not Detected"
                        : "Detected"}
                    </p> */}
                    <Link
                      href={`/instructor/view-specific-student-answer/${instructorId}?name=${name}&examSessionId=${examSessionId}&studentRoleId=${studentData.role_id}`}
                    >
                      <div className="text-md mt-4 rounded border border-slate-800 bg-slate-800 px-4 py-2 text-center font-semibold text-white shadow-md transition hover:bg-white/20 hover:text-black">
                        View Student&apos;s Exam Answer
                      </div>
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
