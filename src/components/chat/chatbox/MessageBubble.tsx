import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { ConvertMarkdownToText } from "./ConvertToMarkdown";
import { ChatMessage } from "@/lib/api/thread";
import SubAgentVerticalUI from "./agent-ui/SubAgentVerticalUI";
import { useSelector } from "react-redux";
import { RootState } from "@/store";


const MessageBubble = memo(function MessageBubble({
  message,
  loading
}: {
  message: ChatMessage;
  loading: boolean
}) {


  const isUser = message.role === "user";
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div
      className={cn(
        "flex group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm relative",
          isUser
            ? "bg-slate-200 text-gray-900 rounded-br-sm"
            : "bg-white text-slate-800 rounded-bl-sm border"
        )}
      >
        {!isUser && (
          <p className="mb-1 text-[11px] font-semibold text-slate-500">
            AI
          </p>
        )}

        {/* THINKING TOGGLE (AI only) */}


        {!isUser && message?.thinking && (
          <div className="mb-2">
            <button
              onClick={() => setShowThinking((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              {showThinking ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}

              {loading && showThinking && (
                <Loader2 size={12} className="ml-1 animate-spin text-slate-400" />
              )}
              Thinking

            </button>

            {showThinking && (
              <div className="mt-2 rounded-lg bg-slate-50 border px-3 py-2 text-xs text-slate-600 whitespace-pre-line">
                {message?.thinking}
              </div>
            )}
          </div>
        )}

        {/* MESSAGE CONTENT */}
        {isUser ? (
          <p className="whitespace-pre-line leading-relaxed">
            {message?.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none leading-relaxed px-1">
            <SubAgentVerticalUI agents={message?.sub_agent} />
            <ConvertMarkdownToText text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble