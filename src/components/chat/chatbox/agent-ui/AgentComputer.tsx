"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  X,
} from "lucide-react";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AppDispatch, RootState } from "@/store";
import { modifyReportModalContent, toggleChatPanlePadding, toggleViewReportModal } from "@/store/chatSlice";

function AgentComputer() {
  const [menuOpen, setMenuOpen] = useState(true);

  //runAgentSimulation
  const { chatPanelPadding } = useSelector((state: RootState) => state.chat)

  useEffect(() => {
    if (chatPanelPadding == 'chat') {
      setMenuOpen(false)
    } else {
      setMenuOpen(true)
    }
  }, [chatPanelPadding])

  const [activeIndex, setActiveIndex] = useState(0);

  const [media, setMedia] = useState<any[]>([]);
  const [displayedContent, setDisplayedContent] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [currentlyTypingIndex, setCurrentlyTypingIndex] = useState<number | null>(1);

  const queueRef = useRef<string[]>([]);
  const taskQueueRef = useRef<any[]>([]);
  const isProcessingQueue = useRef(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastFileIndexRef = useRef(0);
  const lastImageIndexRef = useRef(0);

  const MAX_TYPING_TIME = 6000;

  const agentFiles = useSelector((state: any) => state.chat.agent_files);
  const agentImages = useSelector((state: any) => state.chat.agent_images);

  const dispatch = useDispatch<AppDispatch>()

  const stopTyping = () => {
    setIsTyping(false);
    setCurrentlyTypingIndex(null);
    queueRef.current = [];

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null;
    }
  };

  const goToPrev = () => {
    stopTyping();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))
  }

  const goToNext = () => {
    stopTyping();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length + 1))
  }

  const typeNext = () => {
    if (queueRef.current.length === 0) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      setCurrentlyTypingIndex(null);

      setTimeout(() => {
        processTaskQueue();
      }, 300)

      return;
    }

    const chunk = queueRef.current.splice(0, 1).join("");
    setDisplayedContent((prev) => prev + chunk);

    setTimeout(typeNext, 6);
  };

  const startTypingEffect = (content: string, index: number) => {
    setCurrentlyTypingIndex(index);
    setDisplayedContent("");
    setIsTyping(true);

    queueRef.current = content.split("");

    typingTimeoutRef.current = setTimeout(() => {
      setDisplayedContent(content);
      setIsTyping(false);
      setCurrentlyTypingIndex(null);

      processTaskQueue();
    }, MAX_TYPING_TIME);

    typeNext();
  }

  const processTaskQueue = async () => {
    if (taskQueueRef.current.length == 0) {
      isProcessingQueue.current = false;
      return;
    }

    isProcessingQueue.current = true;

    const task = taskQueueRef.current.shift();

    if (task.type == "image") {
      setMedia((prev) => {
        const newMedia = [...prev, task.image];
        setActiveIndex(newMedia.length - 1);
        return newMedia
      });
      setTimeout(processTaskQueue, 1500);
      return;
    }

    if (task.type === 'file') {
      setMedia((prev) => {
        const newMedia = [...prev, task.file];
        let index = newMedia.length - 1

        setActiveIndex(index);
        startTypingEffect(task.file.content, index);

        return newMedia
      });
    }

  }

  useEffect(() => {
    if (!agentFiles) return;
    const newFiles = agentFiles.slice(lastFileIndexRef.current);

    newFiles.forEach((file: any) => {
      taskQueueRef.current.push({
        type: "file",
        file: {
          type: "file",
          name: file.filename,
          content: file.content
        }
      });
    });

    lastFileIndexRef.current = agentFiles.length;

    if (!isProcessingQueue.current) processTaskQueue();

  }, [agentFiles])


  useEffect(() => {
    if (!agentImages) return;

    const newImages = agentImages.slice(lastImageIndexRef.current);

    newImages.forEach((img: any) => {
      taskQueueRef.current.push({
        type: "image",
        image: {
          type: "image",
          src: img.src
        }
      });
    });

    lastImageIndexRef.current = agentImages.length;

    if (!isProcessingQueue.current) processTaskQueue();

  }, [agentImages])

  function displayReport(item: { content: string, name: string }) {
    if (item?.name?.includes('.md')) {
      dispatch(toggleViewReportModal())
      dispatch(modifyReportModalContent(item?.content))
    }

  }


  const renderContent = (item: any, index: number) => {
    if (!item) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-dashed">
            <FileText className="text-gray-300" />
          </div>
          <p className="text-sm font-medium">Waiting for AI actions...</p>
        </div>
      );
    }

    if (item.type === "image") {
      return (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200">
          <img
            src={item.src}
            alt="AI Vision"
            className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
          />
        </div>
      )
    }

    if (item.type == "file") {
      const isCurrentlyTyping = index === currentlyTypingIndex && isTyping;

      const contentToShow =
        index = currentlyTypingIndex && isTyping
          ? displayedContent
          : item.content;

      return (
        <div className="flex flex-col h-full w-full animate-in slide-in-from-bottom-2 duration-300">

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 gap-2">
                <FileText size={14} className="text-blue-600" />
              </div>
              <span className="text-gray-800 text-sm font-bold">
                {item.name}
              </span>
            </div>

            {isCurrentlyTyping && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                Writing...
              </span>
            )}
            {
              isTyping ? "" : (
                <span onClick={() => displayReport(item)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                  <Eye size={15} /> View
                </span>
              )
            }
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white">
            <SyntaxHighlighter
              language={item.language}
              style={oneLight}
              className="p-5 m-0 text-sm"
            >
              {contentToShow}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }

    return null;
  }


  console.log({ currentlyTypingIndex, isTyping })

  return (
    <div className="relative flex h-screen p-3 bg-gray-50/50">
      <aside
        className={cn(
          "flex flex-col bg-white transition-all duration-500 shadow-sm overflow-hidden rounded-xl border border-gray-100",
          menuOpen ? "w-[700px] mx-auto" : "w-0 opacity-0 invisible"
        )}
      >
        <div className="px-6 py-4 flex justify-between items-center bg-gray-50/50 gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>

          <button onClick={() => dispatch(toggleChatPanlePadding('chat'))}>
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={goToPrev}
              disabled={media.length <= 1}
              className="p-1.5 hover:bg-gray-200 rounded-md disbaled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={goToNext}
              disabled={media.length <= 1}
              className="p-1.5 hover:bg-gray-200 rounded-md disbaled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 bg-white px-4 py-2 rounded-xl border border-gray-200 mr-2">
            <Globe size={14} className="text-gray-400" />
            <span className="text-[11px] text-gray-400 font-mono truncate">
              {media[activeIndex]
                ? media[activeIndex].type === "image"
                  ? "manus.ai/vision/output"
                  : `manus.ao=i/workspace/${media[activeIndex].name}`
                : "Awaiting AI instruction..."}
            </span>
          </div>
          <ExternalLink size={16} className="text-gray-300" />
        </div>

        <div className="flex-1 p-8 overflow-hidden flex flex-col ">
          {renderContent(media[activeIndex], activeIndex)}
        </div>

        {
          media.length > 0 && (
            <div className="px-8 py-3 bg-gray-50 border-t border-gray-100 flex justify-between textx-[10px] text-gray-400 font-black uppercase text-xs">
              <span>
                Entry {activeIndex + 1} of {media.length}
              </span>
              <span>Agent Computer</span>
            </div>
          )
        }
      </aside>
    </div>
  )
}

export default AgentComputer