// "use client"

import ChatPanel from "@/components/chat/ChatPanel";
import Sidebar from "@/components/chat/SideBar";
// import { useSession } from "next-auth/react";

export default async function Page({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        <ChatPanel threadId={threadId} />
      </main>
    </div>
  );
}
