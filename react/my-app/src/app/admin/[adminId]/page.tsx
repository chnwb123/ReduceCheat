"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../api/mongodb/write/admin/create-one-user/route";
import { motion } from "motion/react";
import Link from "next/link";

export interface AdminPageProps {
  params: Promise<{ adminId: UserDB["role_id"] }>;
  searchParams: Promise<{ name: UserDB["name"] }>;
}

export function AttentionGetter({ newCount, countName }: { newCount: number; countName: string }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      {newCount > 0 && (
        <span className="ml-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
          {newCount} {countName}{newCount > 1 ? "s" : ""}!
        </span>
      )}
    </motion.div>
  );
}

export default function AdminPage({ params, searchParams }: AdminPageProps) {
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [adminId, setAdminId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");

  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-users`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const now = new Date();
          const malaysiaTime = now.toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
          });
          // extract the date part from the ISO string (DD-MM-YYYY)
          // from 09/08/2026, 7:45:05 pm, only extract 09/08/2026
          const malaysiaDate = malaysiaTime.split(",")[0];
          console.log("Malaysia Date:", malaysiaDate);
          const usersData = await response.json();
          setNewUsersCount(
            usersData.filter(
              (user: UserDB) =>
                user.authenticated === "false" &&
                user.created_at.split(",")[0] === malaysiaDate,
            ).length,
          );
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    const getParams = async () => {
      const { adminId } = await params;
      const { name } = await searchParams;
      console.log("Admin ID from params:", adminId);
      console.log("Name from searchParams:", name);
      setAdminId(adminId);
      setName(name);
    };

    getParams();
    getUsers();
  }, [newUsersCount, params, searchParams]);

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
          }
        ]}
      />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to the Admin Dashboard, {name}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/admin/manage-user/${adminId}?name=${name}`}>
            <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              {newUsersCount > 0 && (
                <div className="mb-2 text-sm font-bold text-white">
                  <AttentionGetter newCount={newUsersCount} countName="new user" />
                </div>
              )}
              Manage User
            </div>
          </Link>
          <Link href={`/admin/manage-course/${adminId}?name=${name}`}>
            <div className="h-full rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
              Manage Course
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
