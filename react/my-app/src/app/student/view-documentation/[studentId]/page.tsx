"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";
import { StudentPageProps } from "../../[studentId]/page";

export default function StudentViewDocumentationPage({
  params,
  searchParams,
}: StudentPageProps) {
  const [studentId, setStudentId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");

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
            Student Documentation
          </h1>
          <p className="mt-4 text-xl text-white">
            1. Download the ReduceCheat desktop app from the link below for your upcoming exams.
          </p>
          <p className="mt-4 text-xl text-white">
            https://ReduceCheat.com
          </p>
          <p className="mt-4 text-xl text-white">
            2. Login to the ReduceCheat using the same credentials for this website.
          </p>
        </div>
      </div>
    </div>
  );
}
