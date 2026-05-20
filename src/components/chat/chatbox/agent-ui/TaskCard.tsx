import React, { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store"
import {
  Check,
  ChevronDown,
  Circle,
  Loader2,
  MonitorPlay
} from "lucide-react";
import { TodoListType, TodoStatus } from "@/store/chatSlice";


function TaskCard({ todos } : { todos: TodoListType}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // const todos = [
  //   {
  //     "id": "5155e96f-a03e-4e8e-ab34-b713f4b786bg",
  //     "task": "Reasearch LangChain",
  //     "status": "completed"
  //   },
  //   {
  //     "id": "5155e96f-a03e-4e8e-ab34-b713f4b786bm",
  //     "task": "Write Slides",
  //     "status": "in_progress"
  //   },
  //   {
  //     "id": "5155e96f-a03e-4e8e-ab34-b713f4b786bh",
  //     "task": "Generate presentation",
  //     "status": "pending"
  //   },
  //   {
  //     "id": "5155e96f-a03e-4e8e-ab34-b713f4b786b1",
  //     "task": "Review formatting",
  //     "status": "pending"
  //   }
  // ]

  // Count completed dynamically
  const completedtodos = useMemo(
    () => todos.filter((t) => t.status == "completed").length,
    [todos]
  )

  // Determine which task to show in collapsed mode
  const activeTask =
    todos.find((t) => t.status == "in_progress") ||
    todos.find((t) => t.status === "pending") ||
    todos[todos.length - 1]


  // Status Icon Renderer
  const StatusIcon = ({ status }: { status: TodoStatus}) => {
    if (status == "completed") {
      return (
        <Check
          size={15}
          strokeWidth={2.5}
          className="text-green-500 mt-0.5 shrink-0"
        />
      )
    }

    if (status === "in_progress") {
      return (
        <Loader2
          size={15}
          className="text-blue-500 animate-spin mt-0.5 shrink-0"
        />
      )
    }

    return <Circle size={15} className="text-gray-300 mt-0.5 shrink-0" />
  }

  // --------------------------- COLLAPSED ------------------------
  if (!isExpanded) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center gap-3 font-sans transition-all">

        <div
          onClick={() => setIsExpanded(true)}
          className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-md p-2 shadow-sm w-full"
        >
          <div className="flex items-center gap-3 overflow-hidden  w-full">
            <StatusIcon status={activeTask?.status} />
            <span className="text-gray-800 text-sm truncate font-medium">
              {activeTask?.task}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="text-gray-500 text-xs font-medium">
              {completedtodos} / {todos.length}
            </span>
            <ChevronDown
              size={16}
              className="text-gray-400 -rotate-90 group-hover:text-gray-600"
            />
          </div>
        </div>
      </div>
    )
  }

  // -------------------------- EXPANDED ----------------------------
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl p-5 border transition-all">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-gray-900 tracking-wide">
              Agent's Task
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-500">
          <button className="p-1.5 hover:bg-gray-100 hover:text-gray-700 rounded-md">
            <MonitorPlay size={20} />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <ChevronDown size={20}/>
          </button>
        </div>
      </div>
      <div className="rounded-xl border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-900 text-base">
            Task progress
          </h3>
          <span className="text-gray-500 text-sm font-medium">
            {completedtodos} / {todos.length}
          </span>
        </div>

        <ul className="space-y-3.5 max-h-[168px] overflow-y-auto pr-2">
          {todos.map((task) => {
            const isComplete = task.status === "completed";
            const isInProgress = task.status == "in_progress";

            return (
              <li key={task.id} className="flex items-start gap-3">
                <StatusIcon status={task.status}/>
                <span
                  className={`text-sm ${
                    isComplete 
                    ? "text-gray-800"
                    : isInProgress
                    ? "text-blue-600"
                    : "text-gray-400"
                  }`}
                >
                  {task?.task}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  )
}

export default TaskCard