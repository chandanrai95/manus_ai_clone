import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    console.log('chat page', session)
    if (session?.redirectThreadId) {
        redirect(`/chat/${session.redirectThreadId}`)
    }

    return (
        <div>
            
        </div>
    )
}

