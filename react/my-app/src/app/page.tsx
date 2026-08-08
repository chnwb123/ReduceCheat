"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/app/admin/manage-user/page";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState<User["username"]>("");
  const [password, setPassword] = useState<User["password"]>("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    console.log({ username, password });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 px-8 py-4 shadow-2xl backdrop-blur-xl">
        <div>
          {isRegistered === "true" && (
            <div className="bg-green-500/20 border border-green-500/50 p-2 rounded-lg">
              <p className="text-md font-bold tracking-tight text-white text-center">
                Registration successful! Please wait for email confirmation.
              </p>
            </div>
          )}
        </div>
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
            Welcome to ReduceCheat
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Username
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          {error && (
            <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-3 font-medium text-white"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <Link href="/register">
          <p className="mt-2 text-sm font-semibold tracking-wider text-slate-400 hover:text-slate-200">
            Register here
          </p>
        </Link>
      </div>
    </div>
  );
}
