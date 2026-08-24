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
import { formatDuration } from "@/app/student/view-exam/[studentId]/page";

interface ObjectiveAnswer {
  question_number: number;
  selected_option: string | null;
}

interface SubjectiveAnswer {
  question_number: number;
  typed_answer: string | null;
}

interface SectionStudentAnswers {
  objective_answers: ObjectiveAnswer[];
  subjective_answers: SubjectiveAnswer[];
}

interface StudentAnswerSection {
  [sectionId: string]: SectionStudentAnswers;
}

interface StudentAnswer {
  _id: string;
  exam_question_id: string;
  role_id: string;
  student_answers: StudentAnswerSection[];
  timestamp: string;
}

export default function InstructorPage({
  params,
  searchParams,
}: InstructorPageProps) {
  const [instructorId, setInstructorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [examSessionId, setExamSessionId] = useState<ExamQuestionDB["_id"]>("");
  const [studentRoleId, setStudentRoleId] = useState<UserDB["role_id"]>("");
  const [studentAnswer, setStudentAnswer] = useState<StudentAnswer[]>([]);
  const [examQuestion, setExamQuestion] = useState<ExamQuestionDB | null>(null);
  const [ totalMarks, setTotalMarks ] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { instructorId } = await params;
      const { name, examSessionId, studentRoleId } = await searchParams;
      console.log("Instructor ID from params:", instructorId);
      console.log("Name from searchParams:", name);
      console.log("Exam Session ID from searchParams:", examSessionId);
      console.log("Student Role ID from searchParams:", studentRoleId);
      setInstructorId(instructorId);
      setName(name);
      setExamSessionId(examSessionId);
      setStudentRoleId(studentRoleId);
    };

    getParams();
  }, []);

  useEffect(() => {
    const getStudentAnswer = async () => {
      if (studentRoleId === "" || examSessionId === "") {
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/instructor/get-student-answer/${examSessionId}/${studentRoleId}`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const studentAnswerData = await response.json();
          setStudentAnswer(studentAnswerData);
          console.log("Fetched student answer data:", studentAnswerData);
        }
      } catch (error) {
        console.error("Failed to fetch student answer data:", error);
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/instructor/get-one-exam-question/${examSessionId}`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const examQuestionData = await response.json();
          setIsLoading(false);
          setExamQuestion(examQuestionData);
          console.log("Fetched exam question data:", examQuestionData);
        }
      } catch (error) {
        console.error("Failed to fetch exam question data:", error);
      }
    };
    getStudentAnswer();
  }, [studentRoleId, examSessionId]);

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
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <Link
            href={`/instructor/view-specific-student-performance/${instructorId}?name=${name}&examSessionId=${examSessionId}`}
          >
            <div className="mb-4 rounded border border-slate-800 bg-slate-800 px-4 py-2 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20 hover:text-black">
              Back
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Viewing {studentRoleId}&apos;s Exam Answer for Session: exam_
            {String(examSessionId)}
          </h1>
        </div>
        <div className="text-white">
          {isLoading ? (
            <Loading />
          ) : (
            <>
              <div className="text-md grid grid-cols-[auto_1fr] gap-x-5 font-bold">
                <h2>Exam Title:</h2>
                <p>{examQuestion?.title}</p>
                <h2>Exam Description:</h2>
                <p>{examQuestion?.description}</p>
                <h2>Exam Date:</h2>
                <p>{examQuestion?.start_date_time?.slice(0, 10)}</p>
                <h2>Exam Time:</h2>
                <p>
                  {examQuestion?.start_date_time?.slice(11)} -{" "}
                  {examQuestion?.end_date_time?.slice(11)}
                </p>
                <h2>Exam Duration:</h2>
                <p>{formatDuration(examQuestion?.duration)}</p>
              </div>

              <div className="text-md flex flex-col gap-2">
                {examQuestion?.sections.map((section, index) => {
                  const sectionAnswers =
                    studentAnswer?.[0]?.student_answers?.find(
                      (sectionAnswer) =>
                        Object.keys(sectionAnswer)[0] === String(section.id),
                    )?.[String(section.id)];

                  return (
                    <div key={index}>
                      <h2 className="mt-4 text-lg font-bold">
                        Section {section.id}
                      </h2>

                      <div className="grid grid-cols-[auto_1fr] gap-x-5">
                        <h2>Section Title:</h2>
                        <p>{section.title}</p>

                        <h2>Section Description:</h2>
                        <p>{section.description}</p>
                      </div>

                      <h2 className="mt-4 text-lg font-bold">Objective Question</h2>

                      {section.objective_questions.map((question, qIndex) => {
                        const studentQuestion =
                          sectionAnswers?.objective_answers?.find(
                            (answer) =>
                              answer.question_number === qIndex + 1,
                          );

                        return (
                          <div
                            key={`objective-${qIndex + 1}`}
                            className="mt-2 rounded bg-gray-300 p-2 text-black"
                          >
                            <p>
                              Question {qIndex + 1}: {question.title}{" "}
                              &nbsp;(Marks: {question.marks})
                            </p>

                            {question.options.map((option, oIndex) => (
                              <div
                                key={`option-${oIndex + 1}`}
                                className="ml-4"
                              >
                                <p>
                                  {String.fromCharCode(65 + oIndex)}. {option}
                                </p>
                              </div>
                            ))}

                            <p className="font-bold">Correct Answer: {question.correctAnswer}</p>

                            <p className="font-bold">
                              Student Answer:{" "}
                              {studentQuestion?.selected_option ??
                                "Not answered"}
                            </p>

                            {
                              studentQuestion?.selected_option !== question.correctAnswer && (
                                <p className="font-bold text-red-500">
                                  Incorrect
                                </p>
                              )
                            }
                          </div>
                        );
                      })}

                      <h2 className="mt-4 text-lg font-bold">Subjective Question</h2>

                      {section.subjective_questions.map((question, qIndex) => {
                        const studentQuestion =
                          sectionAnswers?.subjective_answers?.find(
                            (answer) =>
                              answer.question_number === qIndex + 1,
                          );

                        return (
                          <div
                            key={`subjective-${qIndex + 1}`}
                            className="mt-2 rounded bg-gray-300 p-2 text-black"
                          >
                            <p>
                              Question {qIndex + 1}: {question.title}{" "}
                              &nbsp;(Marks: {question.marks})
                            </p>

                            <p className="font-bold">Correct Answer: {question.correctAnswer}</p>

                            <p className="font-bold">
                              Student Answer:{" "}
                              {studentQuestion?.typed_answer ?? "Not answered"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
