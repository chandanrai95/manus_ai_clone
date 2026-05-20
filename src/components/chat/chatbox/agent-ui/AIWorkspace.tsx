"use client";

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  Sparkles
} from "lucide-react"
import TaskCard from "./TaskCard";
import SubAgentVerticalUI from "./SubAgentVerticalUI";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";

export interface AgentData {
  sub_agent_name: string;
  content?: string;
  loading?: boolean;
}

function AIWorkspace() {
  const { messages, todos, error, leftPanel } = useSelector((state: RootState) => state.chat)

  const [menuOpen, setMenuOpen] = useState(leftPanel === 'aiworkspace' ? true : false);

  useEffect(() => {
    if (leftPanel == 'aiworkspace') {
      setMenuOpen(true)
    } else {
      setMenuOpen(false)
    }
  }, [leftPanel])

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="relative flex h-full">
      {/* SIDEBAR */}
      <aside
        className={
          cn(
            "flex flex-col border-r bg-white transition-all duration-300 ease-in-out",
            menuOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full opacity-0"
          )
        }
      >
        <div className="flex h-full flex-col">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white ">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center">
              <Sparkles size={16} />
              AI Workspace
            </h2>
          </div>

          {/* THREAD LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">

            <div className="text-xs font-semibold text-slate-500 mb-2">
              Ongoing Tasks
            </div>

            <TaskCard todos={todos} />

            {/* AGENT SECTION */}
            <div className="mt-6 border-t pt-4">
              <div className="text-xs font-semibold text-slate-500 mb-2">
                Running Agents
              </div>

              <SubAgentVerticalUI agents={lastMessage?.sub_agent} />
            </div>
          </div>


        </div>

      </aside>

    </div>
  )
}

export default AIWorkspace