"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Welcome Back
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Login to continue to your account
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-8 w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          <Image src="/icons/google.png" alt="Google" width={30} height={30}/>
          
          Continue with Google
        </button>
      </div>
    </div>
  );
}