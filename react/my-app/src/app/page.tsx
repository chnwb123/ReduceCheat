"use client";
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    console.log({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <Image src="/ReduceCheat_Logo.png" alt="ReduceCheat Logo" width={150} height={150} style={{ width: '100%', height: 'auto' }} priority />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to ReduceCheat</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 pl-11 pr-11 text-white" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl">
            Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
