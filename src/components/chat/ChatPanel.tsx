"use client";

import { memo, useEffect, useRef, useState } from "react";
import {

  ThumbsUp,
  ThumbsDown,

  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn, showError } from "@/lib/utils";
// import ChatInput from "./chatbox/ChatInput";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/stores";
import { chatMessages } from "./chatbox/chat";
import MessageBubble from "./chatbox/MessageBubble";
import ChatInput from "./chatbox/ChatInput";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { addUsersAndAiPlaceholder, appendToAssistantThinking, appendToLastAiMessage, getChatHistory } from "@/store/chatSlice";
import { useSession } from "next-auth/react";
import { fetchThreads } from "@/store/threadSlice";


export default function ChatPanel({ threadId }: { threadId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, error } = useSelector((state: RootState) => state.chat)
  const { data: session } = useSession()

  // const [messages, setMessages] = useState(chatMessages)

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const queueRef = useRef<string[]>([]);
  const typingRef = useRef(false);


  const thinkingQueueRef = useRef<string[]>([]);
  const thinkingTypingRef = useRef(false);

  const userId = (session as any)?.user?.id


  useEffect(() => {
    if (userId) {
      dispatch(getChatHistory({ userId, threadId }))
    }
  }, [userId])

  useEffect(() => {

    if (messages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }

  }, [messages, loading])


  const typeNextThinking = () => {
    if (thinkingQueueRef.current.length == 0) {
      thinkingTypingRef.current = false
      return;
    }

    thinkingTypingRef.current = true

    const chunk = thinkingQueueRef.current
      .splice(0, 3)
      .join("");

    console.log('typeNextThinking', chunk)

    dispatch(appendToAssistantThinking(chunk))
    setTimeout(typeNextThinking, 12);
  }

  const typeNext = () => {
    if (queueRef.current.length == 0) {
      typingRef.current = false;
      return;
    }

    typingRef.current = true
    const chunk = queueRef.current
      .splice(0, 3)
      .join("")

    dispatch(appendToLastAiMessage(chunk))
    setTimeout(typeNext, 6);
  }

  const sendMessageApi = async (userMessage: string) => {
    try {
      setLoading(true)

      const res = await fetch("/api/agent/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          userId,
          threadId
        })
      })

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue;

          if (trimmed.startsWith("data:")) {
            const payload = trimmed.replace("data:", "").trim();
            if (!payload) continue;

            const data = JSON.parse(payload)

            if (data.message !== undefined && data.message !== null) {
              for (let char of data.message) {
                queueRef.current.push(char)
              }

              if (!typingRef.current) {
                typeNext()
              }
            }

            if (data.thinking !== undefined && data.thinking !== null) {
              for (let char of data.thinking) {
                console.log('---', char)
                thinkingQueueRef.current.push(char)
              }

              if (!thinkingTypingRef.current) {
                typeNextThinking()
              }
            }
          }

          if (trimmed.startsWith("event:")) {
            const eventType = trimmed.replace("event:", "").trim();
            
            if (eventType == "updateThread") {
              if (userId) {
                dispatch(fetchThreads(userId))
              }
            }

            if (eventType == "end" || eventType === "error") {
              setLoading(false);
              reader.cancel();
            }
          }
        }
      }

    } catch (error) {
      console.error('sendMessageApi', error)
      setLoading(false);
      // return Promise.reject(error)
    }
  }


  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim()
    queueRef.current = []
    setInput("")

    dispatch(
      addUsersAndAiPlaceholder({
        role: "ai",
        userId,
        thinking: "",
        threadId,
        content: userMessage
      })
    )
    sendMessageApi(userMessage)
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const scrollContainer = scrollContainerRef.current;
  //   if (!scrollContainer) return;

  //   // 2. Calculate if the user is near the bottom (within 100px)
  //   const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
  //   const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

  //   // 3. Only auto-scroll if the user is already near the bottom
  //   //    or if the AI is just starting to load (force snap on new message)
  //   if (isNearBottom) {
  //     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages, loading]);


  return (
    <div className="flex h-full w-full flex-col bg-white">

      {/* Messages area */}
      <div

        ref={scrollContainerRef}

        className="flex-1 overflow-y-auto px-10 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} loading={loading} />
        ))}


        <div ref={bottomRef} />
      </div>

      {/* Input (fixed bottom) */}
      <div className=" bg-white  px-10">
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          loading={loading}
          pdfId={""}
        />
      </div>
    </div>
  );
}
