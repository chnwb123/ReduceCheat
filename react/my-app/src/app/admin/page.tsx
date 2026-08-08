"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../api/mongodb/write/admin/create-one-user/route";
import { motion } from "motion/react";

const navItems = [
  { label: "Home", href: "/admin" },
  { label: "Manage Course", href: "/admin/manage-course" },
  { label: "Manage User", href: "/admin/manage-user" },
  { label: "About Admin", href: "/admin/about-us" },
];

export function AttentionGetter({ newUsersCount }: { newUsersCount: number }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      {newUsersCount > 0 && (
        <span className="ml-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
          {newUsersCount} new user{newUsersCount > 1 ? "s" : ""}!
        </span>
      )}
    </motion.div>
  );
}

export default function AdminPage() {
  const [newUsersCount, setNewUsersCount] = useState(0);

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
          const malaysiaTime = now.toISOString();
          // extract the date part from the ISO string (YYYY-MM-DD)
          const malaysiaDate = malaysiaTime.split("T")[0];
          console.log("Malaysia Date:", malaysiaDate);
          const usersData = await response.json();
          setNewUsersCount(
            usersData.filter(
              (user: UserDB) =>
                user.authenticated === "false" &&
                user.created_at.split("T")[0] === malaysiaDate,
            ).length,
          );
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    getUsers();
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar navItems={navItems} />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to the Admin Dashboard
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
            <div className="mb-2 text-sm font-bold text-white">
              <AttentionGetter newUsersCount={newUsersCount} />
            </div>
            Manage User
          </div>
          <div className="rounded bg-white/10 px-4 py-4 text-center text-xl font-semibold text-white shadow-md transition hover:bg-white/20">
            Manage Course
          </div>
        </div>
      </div>
    </div>
  );
}
