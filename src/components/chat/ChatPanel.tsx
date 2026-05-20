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
import { addAgentFile, addAgentImage, addTodos, addUsersAndAiPlaceholder, appendToAssistantThinking, appendToLastAiMessage, appendToLastAiMessageSubAgent, clearTodos, getChatHistory, updateTodos } from "@/store/chatSlice";
import { useSession } from "next-auth/react";
import { fetchThreads } from "@/store/threadSlice";
import { ViewReportModal } from "../modal/ViewReportModal";


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

  const subAgentQueueRef = useRef<Record<string, any>[]>([]);
  const subAgentTypingRef = useRef(false);

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

  const typeSubAgentNextContent = () => {
    if (subAgentQueueRef.current.length == 0) {
      subAgentTypingRef.current = false;
      return;
    }

    subAgentTypingRef.current = true

    const chunk = subAgentQueueRef.current
      .splice(0, 1)

    const obj = chunk.pop()

    dispatch(appendToLastAiMessageSubAgent(obj))
    setTimeout(typeSubAgentNextContent, 6);
  }

  const sendMessageApi = async (userMessage: string) => {
    try {
      setLoading(true)

      const res = await fetch("/api/agent/streams/v1", {
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



            // queue sub agents
            if (data.sub_agent != undefined && data.sub_agent !== null) {
              console.log('data.sub_agent ===========', data.sub_agent)
              const jsonPayload = data?.sub_agent
              subAgentQueueRef.current.push(jsonPayload)
              if (!subAgentTypingRef.current) {
                typeSubAgentNextContent()
              }
            }

            // write file
            if (data.write_file !== undefined && data.write_file !== null) {
              const jsonPayload = data?.write_file
              dispatch(addAgentFile(jsonPayload))
            }

            // read file
            if (data.read_file !== undefined && data.read_file !== null) {
              const jsonPayload = data?.read_file
              dispatch(addAgentFile(jsonPayload))
            }

            // image

            // todos
            if (data.todo_list !== undefined && data.todo_list !== null) {
              try {
                const jsonPayload = JSON.parse(data?.todo_list?.todoList) as any

                dispatch(clearTodos())
                dispatch(addTodos(jsonPayload))
              } catch (error) {
                console.log('Failed to parse todos')
              }
            }

            // update todos
            if (data.update_todo !== undefined && data.update_todo !== null) {
              try {
                const jsonPayload = data?.update_todo
                console.log("update todos :: ", jsonPayload)
                dispatch(updateTodos(jsonPayload))
              } catch (error) {
                console.log('Failed to parse todos')
              }
            }

            if (data.thinking !== undefined && data.thinking !== null) {
              for (let char of data.thinking) {
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

  const runSimulation = (dispatch: any) => {

    const events = [
      () => dispatch(addAgentImage({
        src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80"
      })),

      () => dispatch(addAgentFile({
        filename: "server.js",
        content: `const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from AI Server');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`
      })),

      () => dispatch(addAgentFile({
        filename: "package.json",
        content: `{
  "name": "basic-node-app",
  "version": "1.0.0",
  "description": "Basic Node.js Express app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}`
      })),

      () => dispatch(addAgentFile({
        filename: ".env",
        content: `PORT=3000`
      })),

      () => dispatch(addAgentImage({
        src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=80"
      })),

      () => dispatch(addAgentImage({
        src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80"
      })),

      () => dispatch(addAgentFile({
        filename: ".gitignore",
        content: `node_modules
.env
.DS_Store
npm-debug.log`
      })),

      () => dispatch(addAgentImage({
        src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80"
      })),

      () => dispatch(addAgentFile({
        filename: "README.md",
        content: `# Basic Node.js App

## Install dependencies

\`\`\`bash
npm install
\`\`\`

## Run in development

\`\`\`bash
npm run dev
\`\`\`

## Run in production

\`\`\`bash
npm start
\`\`\`

## API Routes

### GET /
Returns a basic hello message.

### GET /health
Returns server health status.`
      })),
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index >= events.length) {
        clearInterval(interval);
        return;
      }
      events[index++]();
    }, 600);

  };


  return (
    <div className="flex h-full w-full flex-col bg-white">

      {/* Messages area */}
      <div

        ref={scrollContainerRef}

        className="flex-1 overflow-y-auto px-10 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={`${msg.role}_${i}`} message={msg} loading={loading} />
        ))}


        <div ref={bottomRef} />
      </div>

      {/* Input (fixed bottom) */}
      <div className="flex  flex-col bg-white  px-10">
        <button onClick={() => runSimulation(dispatch)}>Test Simulation</button>
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          loading={loading}
          pdfId={""}
        />
      </div>
      <ViewReportModal />
    </div>
  );
}
