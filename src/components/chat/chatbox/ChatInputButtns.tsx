"use client";

import { cn } from "@/lib/utils";
import { AppDispatch } from "@/store";
import { toggleChatPanlePadding, toggleLeftPanels } from "@/store/chatSlice";
import { Cpu, Loader2, Paperclip, ScreenShareIcon } from "lucide-react";
import { useRef, useState } from "react"
import { useDispatch } from "react-redux";

const ChatInputButtns = () => {
  const [uploadPdfLoading, setUploadPdfLoading] = useState(false);
  const [uploadImgLoading, setUploadImgLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>()

  return (
    <div className="flex items-center gap-3 text-slate-500">
      {/* Hidden file input */}
      <input type="file" className="hidden" ref={fileInputRef} />

      {/* <button
        onClick={() => {
          if (!uploadPdfLoading) {
            // triggerFileInput("pdf");
          }
        }}
        disabled={uploadPdfLoading}
        className={cn(
          "flex gap-2 relative items-center text-xs transition",
          uploadPdfLoading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:text-slate-700"
        )}
      >
        {false ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Embedding in progress…</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Paperclip size={16} />
            <span>Upload PDF</span>
          </div>
        )}
      </button> */}

      <button onClick={() => dispatch(toggleChatPanlePadding('computer'))}>
        <ScreenShareIcon size={15} />
      </button>

      <button onClick={() => dispatch(toggleLeftPanels())}>
        <Cpu size={15} />
      </button>
    </div>

  )
}

export default ChatInputButtns