"use client";
import { useState } from "react";

export type Student = {
  name: string;
  dob: string;
  email: string;
};

export type Instructor = {
  name: string;
  dob: string;
  email: string;
};

export type Admin = {
  name: string;
  dob: string;
  email: string;
};

export type Invigilator = {
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
  username: string;
  password: string;
};

export default function AdminCreateUserPage() {
  const userTypes: RoleType[] = [
    "Student",
    "Instructor",
    "Admin",
    "Invigilator",
  ];

  const [userDetails, setUserDetails] = useState<User>({
    role: {
      name: "",
      dob: "",
      email: "",
    },
    roleType: "",
    username: "",
    password: "",
  });

  // console.log(userDetails);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      userDetails,
    };
    console.log("Full user payload:", payload);
    try {
      const response = await fetch("/api/mongodb/write/admin/create-one-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: payload }),
      });
      console.log("Response from backend:", await response.json());
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-4xl font-bold">Create User</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="userRealName" className="flex-none text-lg font-bold">
            User Type:
          </label>

          <select
            id="userType"
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
            value={userDetails.roleType}
            onChange={(e) =>
              setUserDetails({
                ...userDetails,
                roleType: e.target.value as RoleType,
              })
            }
            name={"userType"}
          >
            <option value="">Select User Type</option>
            {userTypes.map((userType) => (
              <option key={userType} value={userType}>
                {userType}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="userRealName" className="flex-none text-lg font-bold">
            User Real Name:
          </label>
          <input
            id="userRealName"
            type="text"
            placeholder="User Real Name"
            value={userDetails.role.name}
            onChange={(e) =>
              setUserDetails({
                ...userDetails,
                role: { ...userDetails.role, name: e.target.value },
              })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="userDob" className="flex-none text-lg font-bold">
            User Date of Birth:
          </label>
          <input
            id="userDob"
            type="date"
            value={userDetails.role.dob}
            onChange={(e) =>
              setUserDetails({
                ...userDetails,
                role: { ...userDetails.role, dob: e.target.value },
              })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="userEmail" className="flex-none text-lg font-bold">
            User Email:
          </label>
          <input
            id="userEmail"
            type="email"
            placeholder="User Email"
            value={userDetails.role.email}
            onChange={(e) =>
              setUserDetails({
                ...userDetails,
                role: { ...userDetails.role, email: e.target.value },
              })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="userUsername" className="flex-none text-lg font-bold">
            User Username:
          </label>
          <input
            id="userUsername"
            type="text"
            placeholder="User Username"
            value={userDetails.username}
            onChange={(e) =>
              setUserDetails({
                ...userDetails,
                username: e.target.value as string,
              })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="userPassword" className="flex-none text-lg font-bold">
            User Password:
          </label>
          <input
            id="userPassword"
            type="password"
            placeholder="User Password"
            value={userDetails.password}
            onChange={(e) =>
              setUserDetails({
                ...userDetails,
                password: e.target.value as string,
              })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          Submit User
        </button>
      </form>
    </div>
  );
}
