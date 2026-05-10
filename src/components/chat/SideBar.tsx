"use client"
import { createThread } from "@/lib/api/thread";
import { cn } from "@/lib/utils";
import { AppDispatch, RootState } from "@/store";
import { fetchThreads } from "@/store/threadSlice";

import { FileInput, FileText, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AccountButton from "../accounts/AccountButton";

export default function Sidebar() {
  const { data: session } = useSession();
  const dispatch = useDispatch<AppDispatch>();

  const { threads } = useSelector((state: RootState) => state.thread)
  const router = useRouter()
  const params = useParams()

  const [menuOpen, setMenuOpen] = useState(true);
  // const [chatList, setChatList] = useState([
  //   { pdfId: "ddd", title: "Casual conversation" },
  //   { pdfId: "ddd", title: "Motivational Letter" },
  // ])


  console.log('session --', session)  
  const userId = (session as any)?.user?.id;
  const activeThreadId = params?.threadId as string

  const selectThread = (threadId: string) => {
    router.push(`/chat/${threadId}`)
  } 

  const refetchThreads = () => {
      if (userId) {
      dispatch(fetchThreads(userId))
    }
  }

  useEffect(() => {
    refetchThreads()
  }, [userId])


  const createNewThread = async () => {
    console.log("Creating new chat...")
    await createThread(userId)
    refetchThreads()
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      <aside
        className={cn(
          "flex flex-col border-r bg-slate-50 transition-all duration-300 ease-in-out",
          menuOpen ? "w-65" : "w-0"
        )}
      >
        <div className={cn("flex h-full flex-col p-3", !menuOpen && "hidden")}>
          <div className="mb-4 mt-3">
            <button
              onClick={createNewThread}
              className="flex items-center gap-3 rounded-full bg-slate-200 px-4 py-3 w-full"
            >
              <Plus size={18} />
              <span className="truncate">New Chat</span>
            </button>
          </div>
          <div className="mb-2 px-2 text-xs font-semibold text-slate-500">
            Recent
          </div>
          <nav className="space-y-1 px-2 py-3 text-sm">
            {threads.length === 0 ? (
              <MenuItem icon={<FileText size={16} />} label="No threads yet" />
            ) : (
              threads?.map((thread) => {
                const _onClick = () => selectThread(thread.threadId)
                return (<MenuItem
                  onClick={_onClick}
                  key={thread.userId}
                  icon={<FileText size={16} />}
                  label={thread.title}
                  active={activeThreadId == thread.threadId}
                />)
              })
            )}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-4">
              <AccountButton />
          </div>
        </div>
      </aside>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode
  label: string,
  active?: boolean,
  onClick?: () => void
}) {


  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 cursor-pointer text-slate-600 ",
        active ? "bg-slate-200 font-medium text-slate-900 font-semibold" : "hover:bg-slate-200"
      )}
    >
      {icon}
      <span className="truncate">{label} </span>
    </button>
  )
}

