"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../api/mongodb/write/admin/create-one-user/route";
import { ExamQuestionDB } from "../../api/mongodb/write/instructor/create-one-exam-question/route";
import { AttentionGetter } from "../../admin/[adminId]/page"; 
import Link from "next/link";

export interface StudentPageProps {
  params: Promise<{ studentId: UserDB["role_id"] }>;
  searchParams: Promise<{ name: UserDB["name"] }>;
}

export default function StudentPage({
  params,
  searchParams,
}: StudentPageProps) {
  const [studentId, setStudentId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [upcomingExams, setUpcomingExams] = useState<ExamQuestionDB[]>([]);

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
  }, [params, searchParams]);

  useEffect(() => {
    if (studentId === "") return;
    const getupcomingExams = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/student/get-upcoming-exams/${studentId}`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const upcomingExamsData = await response.json();
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
            Welcome to the Student Dashboard, {name}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/student/view-exam/${studentId}?name=${name}`}>
            <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              {upcomingExams.length > 0 && (
                <div className="mb-2 text-sm font-bold text-white">
                  <AttentionGetter newCount={upcomingExams.length} countName="upcoming exam" />
                </div>
              )}
              View Exam
            </div>
          </Link>
          <Link href={`/student/view-documentation/${studentId}?name=${name}`}>
            <div className="h-full rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              View Documentation
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
