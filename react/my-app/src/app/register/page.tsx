"use client";
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Users,
  Pen,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/app/admin/manage-user/page";
import { RoleType, userTypes } from "@/app/admin/manage-user/page";
import Link from "next/link";
import { Loading } from "@/components/general/animation/loading/page";

export default function RegisterPage() {
  const [userDetails, setUserDetails] = useState<User>({
    role: {
      name: "",
      dob: "",
      email: "",
    },
    password: "",
    reenterPassword: "",
    roleType: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);
  const [errors, setErrors] = useState({
    emailError: "",
    nameError: "",
    passwordError: "",
    reenterPasswordError: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // function to validate name
  const validateName = (name: string) => {
    if (!name.trim()) {
      return "Name is required.";
    }
    if (/\d/.test(name)) {
      return "Name cannot contain numbers.";
    }
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return "Password is required.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character.";
    }
    return "";
  };

  const validateReenterPassword = (password: string, reenterPassword?: string) => {
    if (!reenterPassword || !reenterPassword.trim()) {
      return "Please re-enter your password.";
    }
    if (password !== reenterPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      userDetails,
    };
    console.log("Full user payload:", payload);

    const nameError = validateName(userDetails.role.name);
    const passwordError = validatePassword(userDetails.password);
    const reenterPasswordError = validateReenterPassword(userDetails.password, userDetails.reenterPassword);
    setErrors({
      emailError: "",
      nameError,
      passwordError,
      reenterPasswordError,
    });

    if (nameError || passwordError || reenterPasswordError) {
      return;
    }

    try {
      const response = await fetch(
        "/api/mongodb/read/react/get-email-by-register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload: userDetails.role.email }),
        },
      );
      const result = await response.json();

      if (result.exists) {
        setErrors((prev) => ({
          ...prev,
          emailError: "Email already registered",
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        emailError: "",
      }));

      console.log("Response from backend:", result);
    } catch (error) {
      console.error("Error creating user:", error);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/mongodb/write/admin/create-one-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: payload }),
      });
      console.log("Response from backend:", await response.json());
      if (response.ok) {
        router.push("/?registered=true&name=" + encodeURIComponent(userDetails.role.name));
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 px-8 py-2 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center">
            <Image
              src="/ReduceCheat_Logo.png"
              alt="ReduceCheat Logo"
              width={150}
              height={150}
              style={{ width: "100%", height: "auto" }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Register your details
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              User Type
            </label>
            <div className="relative">
              <Users className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <select
                required
                id="userType"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-4 pl-11 text-white"
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
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={userDetails.role.email}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    role: { ...userDetails.role, email: e.target.value },
                  })
                }
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-4 pl-11 text-white"
              />
            </div>
          </div>
          {errors.emailError && (
            <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
              {errors.emailError}
            </p>
          )}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Name
            </label>
            <div className="relative">
              <Pen className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={userDetails.role.name}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    role: { ...userDetails.role, name: e.target.value },
                  })
                }
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-4 pl-11 text-white"
              />
            </div>
          </div>
          {errors.nameError && (
            <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
              {errors.nameError}
            </p>
          )}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="date"
                required
                value={userDetails.role.dob}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    role: { ...userDetails.role, dob: e.target.value },
                  })
                }
                placeholder="Enter your date of birth"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-4 pl-11 text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={userDetails.password}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    password: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-11 pl-11 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {errors.passwordError && (
            <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
              {errors.passwordError}
            </p>
          )}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Re-enter Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type={showReenterPassword ? "text" : "password"}
                required
                value={userDetails.reenterPassword}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    reenterPassword: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pr-11 pl-11 text-white"
              />
              <button
                type="button"
                onClick={() => setShowReenterPassword(!showReenterPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
              >
                {showReenterPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {errors.reenterPasswordError && (
            <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
              {errors.reenterPasswordError}
            </p>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-3 font-medium text-white"
          >
            Register <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <Link href="/">
          <p className="mt-2 text-sm font-semibold tracking-wider text-slate-400 hover:text-slate-200">
            Go back to login page
          </p>
        </Link>
        {isLoading && <Loading />}
      </div>
    </div>
  );
}
