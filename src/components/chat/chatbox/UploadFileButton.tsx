"use client";

import { cn } from "@/lib/utils";
import { Loader2, Paperclip } from "lucide-react";
import { useRef, useState } from "react"

const UploadFileButton = ({ pdfId }: { pdfId: string }) => {
  const [uploadPdfLoading, setUploadPdfLoading] = useState(false);
  const [uploadImgLoading, setUploadImgLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3 text-slate-500">
      {/* Hidden file input */}
      <input type="file" className="hidden" ref={fileInputRef} />

      <button
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
      </button>
    </div>

  )
}

export default UploadFileButton