"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";
import { ExamQuestionDB } from "../../../api/mongodb/write/instructor/create-one-exam-question/route";
import { StudentPageProps } from "../../[studentId]/page";
import { Loading } from "@/components/general/animation/loading/page";

export const formatDuration = (duration: number | undefined) => {
    if (duration === undefined) return "Duration not available";
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

export default function StudentViewExamPage({
  params,
  searchParams,
}: StudentPageProps) {
  const [studentId, setStudentId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [upcomingExams, setUpcomingExams] = useState<ExamQuestionDB[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { studentId } = await params;
      const { name } = await searchParams;
      console.log("Student ID from params:", studentId);
      console.log("Name from searchParams:", name);
      setStudentId(studentId);
      setName(name);
    };

    getParams();
  }, []);

  useEffect(() => {
    const getupcomingExams = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/student/get-upcoming-exams/${studentId}`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const upcomingExamsData = await response.json();
          setIsLoading(false);
          setUpcomingExams(upcomingExamsData);
          console.log("Fetched upcoming exams:", upcomingExamsData);
        }
      } catch (error) {
        console.error("Failed to fetch upcoming exams:", error);
      }
    };
    getupcomingExams();
  }, [studentId]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar
        navItems={[
          { label: "Home", href: `/student/${studentId}?name=${name}` },
          {
            label: "View Exam",
            href: `/student/view-exam/${studentId}?name=${name}`,
          },
          {
            label: "Documentation",
            href: `/student/view-documentation/${studentId}?name=${name}`,
          },
        ]}
      />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Upcoming Exams
          </h1>
        </div>
        <div className="h-100 w-full overflow-y-auto border p-4">
          {isLoading ? (
            <Loading />
          ) : (
            upcomingExams.map((exam, index) => (
              <div
                key={index}
                className={`${index !== 0 ? "mt-4" : ""} grid grid-cols-[auto_1fr] gap-x-5 rounded bg-gray-300 p-2 text-xl font-bold`}
              >
                <p>Exam Title:</p>
                <p>{exam.title}</p>
                <p>Exam Description:</p>
                <p>{exam.description}</p>
                <p>Exam Date:</p>
                <p>{exam.start_date_time?.slice(0, 10)}</p>
                <p>Exam Time:</p>
                <p>
                  {exam.start_date_time?.slice(11)} -{" "}
                  {exam.end_date_time?.slice(11)}
                </p>
                <p>Exam Duration:</p>
                <p>{formatDuration(exam.duration)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
