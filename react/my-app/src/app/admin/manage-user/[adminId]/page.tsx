"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "@/app/api/mongodb/write/admin/create-one-user/route";
import { AdminPageProps } from "@/app/admin/[adminId]/page";
import { Loading } from "@/components/general/animation/loading/page";
import Swal from "sweetalert2";

export type Student = {
  id?: string;
  name: string;
  dob: string;
  email: string;
};

export type Instructor = {
  id?: string;
  name: string;
  dob: string;
  email: string;
};

export type Admin = {
  id?: string;
  name: string;
  dob: string;
  email: string;
};

export type Invigilator = {
  id?: string;
  name: string;
  dob: string;
  email: string;
};

export type Role = Student | Instructor | Admin | Invigilator;

export type RoleType = "" | "Student" | "Instructor" | "Admin" | "Invigilator";

export type User = {
  id?: number;
  role: Role;
  roleType: RoleType;
  roleId?: string;
  username?: string;
  password: string;
  reenterPassword?: string;
};

export const userTypes: RoleType[] = [
  "Student",
  "Instructor",
  "Admin",
  "Invigilator",
];

export default function AdminCreateUserPage({
  params,
  searchParams,
}: AdminPageProps) {
  const [adminId, setAdminId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [users, setUsers] = useState<UserDB[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<UserDB["_id"] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

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
          const usersData = await response.json();
          setUsers(usersData);
          console.log("Fetched users:", usersData);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    getUsers();
  }, [selectedUserId]);

  const handleSettleUserAccount = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    setIsLoading(true);
    e.preventDefault();
    console.log("Settling user account for ID:", selectedUserId);
    const detailsToBeSentEmail = {
      name: users.find((u) => u._id === selectedUserId)?.name || "",
      username: users.find((u) => u._id === selectedUserId)?.username || "",
      password: users.find((u) => u._id === selectedUserId)?.password || "",
      email: users.find((u) => u._id === selectedUserId)?.email || "",
    };
    console.log("Details to be sent in email:", detailsToBeSentEmail);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/update/admin/update-user-authentication`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload: selectedUserId }),
        },
      );

      if (response.ok) {
        const updatedData = await response.json();
        console.log("Updated user data:", updatedData);
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/resend`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ payload: detailsToBeSentEmail }),
            },
          );

          if (response.ok) {
            const sentData = await response.json();
            console.log("Email sent successfully:", sentData);
            const user = users.find((u) => u._id === selectedUserId);
            if (user) {
              setIsLoading(false);
              Swal.fire({
                title: "Successful Settled!",
                text: "You have settled " + user.name + "'s account.",
                icon: "success",
                confirmButtonText: "Cool",
                confirmButtonColor: "#3085d6",
              });
              setSelectedUserId(null);
            }
          }
        } catch (error) {
          setIsLoading(false);
          console.error("Failed to update course:", error);
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Failed to update user:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar navItems={[
          { label: "Home", href: `/admin/${adminId}?name=${name}` },
          {
            label: "Manage Course",
            href: `/admin/manage-course/${adminId}?name=${name}`,
          },
          {
            label: "Manage User",
            href: `/admin/manage-user/${adminId}?name=${name}`,
          }
        ]} />
        {/* Authenticating Modal */}
        <div
          id="editModal"
          className={`${selectedUserId ? "block" : "hidden"} fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
        >
          {/* <!-- Modal Content Box --> */}
          <div className="relative w-full max-w-md rounded-xl bg-white px-4 py-1 shadow-2xl transition-all">
            {/* <!-- View Form Body --> */}
            <form className="mt-4 space-y-4" onSubmit={handleSettleUserAccount}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.name || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="text"
                  value={users.find((u) => u._id === selectedUserId)?.dob || ""}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.email || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role Type
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.role_type || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role Id
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.role_id || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.username || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.password || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created At
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)?.created_at ||
                    ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Authentication Status
                </label>
                <input
                  type="text"
                  value={
                    users.find((u) => u._id === selectedUserId)
                      ?.authenticated || ""
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  readOnly
                />
              </div>
              {/* <!-- Action Buttons (Footer) --> */}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  id="closeModalBtn"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setSelectedUserId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  hidden={
                    users.find((u) => u._id === selectedUserId)
                      ?.authenticated === "true"
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Settle
                </button>
                {isLoading && <Loading />}
              </div>
            </form>
          </div>
        </div>
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Manage User
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {userTypes.map((userType) => (
            <div
              key={userType}
              className="rounded-lg border border-slate-600 bg-slate-800 p-2 shadow-lg"
            >
              <h2 className="text-lg font-bold text-white">{userType}</h2>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="mt-4 grid grid-cols-1 gap-2 text-center">
            {users
              .filter((user) => user.role_type === "Student")
              .map((user) => (
                <div
                  key={String(user._id)}
                  className={`${user.authenticated === "true" ? "bg-green-800" : "bg-slate-800"} rounded-lg border border-slate-600 p-4 shadow-lg`}
                >
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  <p className="text-gray-400">{user.email}</p>
                  <div>
                    <button
                      onClick={() => setSelectedUserId(user._id)}
                      className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-center">
            {users
              .filter((user) => user.role_type === "Instructor")
              .map((user) => (
                <div
                  key={String(user._id)}
                  className={`${user.authenticated === "true" ? "bg-green-800" : "bg-slate-800"} rounded-lg border border-slate-600 p-4 shadow-lg`}
                >
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  <p className="text-gray-400">{user.email}</p>
                  <div>
                    <button
                      onClick={() => setSelectedUserId(user._id)}
                      className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-center">
            {users
              .filter((user) => user.role_type === "Admin")
              .map((user) => (
                <div
                  key={String(user._id)}
                  className={`${user.authenticated === "true" ? "bg-green-800" : "bg-slate-800"} rounded-lg border border-slate-600 p-4 shadow-lg`}
                >
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  <p className="text-gray-400">{user.email}</p>
                  <div>
                    <button
                      onClick={() => setSelectedUserId(user._id)}
                      className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-center">
            {users
              .filter((user) => user.role_type === "Invigilator")
              .map((user) => (
                <div
                  key={String(user._id)}
                  className={`${user.authenticated === "true" ? "bg-green-800" : "bg-slate-800"} rounded-lg border border-slate-600 p-4 shadow-lg`}
                >
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  <p className="text-gray-400">{user.email}</p>
                  <div>
                    <button
                      onClick={() => setSelectedUserId(user._id)}
                      className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
