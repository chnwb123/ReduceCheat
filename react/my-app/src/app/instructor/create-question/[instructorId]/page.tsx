"use client";
import { useState, useEffect } from "react";
import { ExamQuestionDB } from "@/app/api/mongodb/write/instructor/create-one-exam-question/route";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import CreateQuestionForm from "@/components/instructor/form/create-question/page";
import { InstructorPageProps } from "@/app/instructor/[instructorId]/page";
import { UserDB } from "@/app/api/mongodb/write/admin/create-one-user/route";
import { Loading } from "@/components/general/animation/loading/page";
import { formatDuration } from "@/app/student/view-exam/[studentId]/page";

export default function InstructorCreateQuestionPage({
  params,
  searchParams,
}: InstructorPageProps) {
  const [instructorId, setInstructorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [examQuestions, setExamQuestions] = useState<ExamQuestionDB[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { instructorId } = await params;
      const { name } = await searchParams;
      console.log("Instructor ID from params:", instructorId);
      console.log("Name from searchParams:", name);
      setInstructorId(instructorId);
      setName(name);
    };

    getParams();
  }, []);

  useEffect(() => {
    const getExamQuestions = async () => {
      if (instructorId != "") {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/instructor/get-exam-questions/${instructorId}`,
            {
              cache: "no-store",
            },
          );

          if (response.ok) {
            const examQuestionsData = await response.json();
            setIsLoading(false);
            setExamQuestions(examQuestionsData);
            console.log("Fetched exam questions:", examQuestionsData);
          }
        } catch (error) {
          console.error("Failed to fetch exam questions:", error);
        }
      }
    };
    getExamQuestions();
  }, [instructorId, isSubmitted]);

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
          }
        ]}
      />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className=" text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Exam Questions
          </h1>
        </div>
        <CreateQuestionForm
          instructorId={String(instructorId)}
          setIsSubmitted={setIsSubmitted}
          isSubmitted={isSubmitted}
        />

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Exam Questions Created
          </h1>
        </div>

        <div className="h-100 w-full overflow-y-auto border p-4">
          {isLoading ? (
            <Loading />
          ) : (
            examQuestions.map((question, index) => (
              <div
                key={index}
                className={`${index !== 0 ? "mt-4" : ""} grid grid-cols-[auto_1fr] gap-x-5 rounded bg-gray-300 p-2 text-xl font-bold`}
              >
                <p>Question Title:</p>
                <p>{question.title}</p>
                <p>Question Description:</p>
                <p>{question.description}</p>
                <p>Question Date:</p>
                <p>{question.start_date_time?.slice(0, 10)}</p>
                <p>Question Time:</p>
                <p>
                  {question.start_date_time?.slice(11, -3)} -{" "}
                  {question.end_date_time?.slice(11)}
                </p>
                <p>Question Duration:</p>
                <p>{formatDuration(question.duration)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
