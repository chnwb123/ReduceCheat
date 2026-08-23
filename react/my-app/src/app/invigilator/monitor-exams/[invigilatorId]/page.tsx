"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";
import { ExamQuestionDB } from "../../../api/mongodb/write/instructor/create-one-exam-question/route";
import { Loading } from "@/components/general/animation/loading/page";
import { formatDuration } from "@/app/student/view-exam/[studentId]/page";
import { InvigilatorPageProps } from "@/app/invigilator/[invigilatorId]/page";
import Link from "next/link";

export default function InvigilatorPage({
  params,
  searchParams,
}: InvigilatorPageProps) {
  const [invigilatorId, setInvigilatorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [isLoading, setIsLoading] = useState(false);
  const [examSessions, setExamSessions] = useState<ExamQuestionDB[]>([]);

  useEffect(() => {
    const getParams = async () => {
      const { invigilatorId } = await params;
      const { name } = await searchParams;
      console.log("Invigilator ID from params:", invigilatorId);
      console.log("Name from searchParams:", name);
      setInvigilatorId(invigilatorId);
      setName(name);
    };

    getParams();
  }, [params, searchParams]);

  useEffect(() => {
    const getExamSession = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/invigilator/get-exam-sessions`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const examSessionData = await response.json();
          setIsLoading(false);
          setExamSessions(examSessionData);
          console.log("Fetched exam sessions:", examSessionData);
        }
      } catch (error) {
        console.error("Failed to fetch exam sessions:", error);
      }
    };
    getExamSession();
  }, []);

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
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Monitor Exams
          </h1>
        </div>
        <div className="tracking-tight">
          {isLoading ? (
            <Loading />
          ) : (
            <div
              className={`grid grid-cols-1 gap-x-5 gap-y-2 p-2 text-xl font-bold`}
            >
              <div className="text-white">
                Exam Sessions Found: {examSessions.length}
              </div>
              {examSessions.map((session, index) => (
                <div key={index} className="rounded bg-gray-300 p-2">
                  <p>Exam Session: {session.title}</p>
                  <p>Exam Session Description: {session.description}</p>
                  <p>
                    Exam Session Date: {session.start_date_time?.slice(0, 10)}
                  </p>
                  <p>
                    Exam Session Time: {session.start_date_time?.slice(11, -3)}{" "}
                    - {session.end_date_time?.slice(11)}
                  </p>
                  <p>
                    Exam Session Duration: {formatDuration(session.duration)}
                  </p>
                  <Link
                    href={`/invigilator/monitor-specific-exam/${invigilatorId}?name=${name}&examSessionId=${session._id}`}
                  >
                    <div className="rounded border border-slate-800 bg-slate-800 px-4 py-2 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20 hover:text-black">
                      View Exam Session
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
