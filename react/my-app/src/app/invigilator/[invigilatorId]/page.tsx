"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../api/mongodb/write/admin/create-one-user/route";
import Link from "next/link";

export interface InvigilatorPageProps {
  params: Promise<{ invigilatorId: UserDB["role_id"] }>;
  searchParams: Promise<{ name: UserDB["name"] }>;
}

export default function InvigilatorPage({
  params,
  searchParams,
}: InvigilatorPageProps) {
  const [invigilatorId, setInvigilatorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");

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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar
        navItems={[
          { label: "Home", href: `/invigilator/${invigilatorId}?name=${name}` },
          {
            label: "Monitor Exams",
            href: `/invigilator/monitor-exams/${invigilatorId}?name=${name}`,
          }
        ]}
      />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to the Invigilator Dashboard, {name}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Link href={`/invigilator/monitor-exams/${invigilatorId}?name=${name}`}>
            <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              Monitor Exams
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
