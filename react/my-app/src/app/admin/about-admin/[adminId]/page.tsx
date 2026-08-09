"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { AdminPageProps } from "@/app/admin/[adminId]/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";

export default function AboutAdminPage({
  params,
  searchParams,
}: AdminPageProps) {
  const [adminId, setAdminId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");

  useEffect(() => {
    const getParams = async () => {
      const { adminId } = await params;
      const { name } = await searchParams;
      console.log("Admin ID from params:", adminId);
      console.log("Name from searchParams:", name);
      setAdminId(adminId);
      setName(name);
    };

    getParams();
  }, [params, searchParams]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar
        navItems={[
          { label: "Home", href: `/admin/${adminId}?name=${name}` },
          {
            label: "Manage Course",
            href: `/admin/manage-course/${adminId}?name=${name}`,
          },
          {
            label: "Manage User",
            href: `/admin/manage-user/${adminId}?name=${name}`,
          },
          {
            label: "About Admin",
            href: `/admin/about-admin/${adminId}?name=${name}`,
          },
        ]}
      />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to the Admin Dashboard
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4"></div>
      </div>
    </div>
  );
}
