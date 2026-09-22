"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#072419] text-[#e3f4e9] flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-[#0b3324] border border-[#164b36] rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block w-10 h-10 rounded-full bg-[#facc15] text-[#072419] font-black text-xl leading-10 mb-3">
            E
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Sign In to ECHO</h1>
          <p className="text-xs text-[#8abfa4] mt-1">Access your meeting transcripts and summaries</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8abfa4] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full bg-[#08281c] border border-[#174e38] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#457860] focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8abfa4] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#08281c] border border-[#174e38] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#457860] focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#facc15] hover:bg-[#ebd052] text-[#072419] font-bold py-3 rounded-xl text-sm transition mt-2 shadow-md shadow-[#facc15]/10"
          >
            Enter Dashboard
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#71ab8f] hover:text-[#facc15] transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
