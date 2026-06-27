import Link from "next/link";
import { ExamQuestionDB } from "@/app/api/mongodb/write/instructor/create-one-exam-question/route";

type InstructorCreateQuestionPageProps = {
  params: Promise<{
    instructor_id?: string;
  }>;
};

export default async function InstructorCreateQuestionPage({
  params,
}: InstructorCreateQuestionPageProps) {
  const resolvedParams = await params;
  const instructorId = resolvedParams?.instructor_id ?? "";
  console.log("Instructor ID:", instructorId);

  let examQuestions: ExamQuestionDB[] = [];

  if (instructorId) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/instructor/get-exam-questions/${instructorId}`,
      {
        cache: "no-store",
      },
    );

    if (response.ok) {
      examQuestions = await response.json();
    }
  }

  return (
    <div>
      <h1>Instructor Create Question Page</h1>
      <p>Instructor ID: {instructorId || "missing"}</p>
      <p>Exam questions found: {examQuestions.length}</p>
      <ul>
        {examQuestions.map((question, index) => (
          <li
            key={
              String(question._id) ??
              `${question.question_id ?? "question"}-${index}`
            }
          >
            {question.title ?? question.question_id ?? "Untitled question"}
          </li>
        ))}
      </ul>
      <Link href="/instructor">Back</Link>
    </div>
  );
}
