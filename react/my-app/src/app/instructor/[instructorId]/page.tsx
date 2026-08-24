"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../api/mongodb/write/admin/create-one-user/route";
import { ExamQuestionDB } from "@/app/api/mongodb/write/instructor/create-one-exam-question/route";
import Link from "next/link";

export interface InstructorPageProps {
  params: Promise<{ instructorId: UserDB["role_id"] }>;
  searchParams: Promise<{ name: UserDB["name"], examSessionId: ExamQuestionDB["_id"], studentRoleId: UserDB["role_id"] }>;
}

export default function InstructorPage({
  params,
  searchParams,
}: InstructorPageProps) {
  const [instructorId, setInstructorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");

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
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to the Instructor Dashboard, {name}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/instructor/create-question/${instructorId}?name=${name}`}>
            <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              Create Exam
            </div>
          </Link>
          <Link href={`/instructor/view-student-performance/${instructorId}?name=${name}`}>
            <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              View Student Performance
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
