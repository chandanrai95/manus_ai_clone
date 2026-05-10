import fs from 'fs';
import path from 'path';
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Thread } from '@/store/threadSlice';

const ROOT = process.cwd();
const THREAD_HISTORY_FILE = path.join(ROOT, "public", "threads");
const HISTORY_FOLDER = path.join(ROOT, "public", "chat-history");

if (!fs.existsSync(THREAD_HISTORY_FILE)) {
  fs.mkdirSync(THREAD_HISTORY_FILE, { recursive: true })
}

const THREAD_FILE = path.join(THREAD_HISTORY_FILE, 'threads.json');
const HISTORY_FILE = path.join(HISTORY_FOLDER, 'chat-history.json');

export const threadSchema = z.object({
  userId: z.string(),
  threadId: z.string(),
  title: z.string(),
  active: z.boolean(),
  createdAt: z.string()
})


export const updateThreadsList = (threads: Thread[]) => {
  fs.writeFileSync(
    THREAD_FILE,
    JSON.stringify(threads, null, 2),
    "utf-8"
  )
}

export const createThreadHistoryTool = tool(
  async ({ userId, title }: { userId: string, title?: string }) => {
    try {
      let threads: any[] = []

      //Load existing threads
      if (fs.existsSync(THREAD_FILE)) {
        const data = fs.readFileSync(THREAD_FILE, "utf-8");
        threads = JSON.parse(data)
      }

      (threads || []).map((t: any) => {
        if (t.userId === userId && t.active === true) {
          return { ...t, active: false }
        }

        return t
      })

      // Create new thread
      const newThread = {
        userId,
        threadId: uuidv4(),
        title: title || "New Thread",
        active: true,
        createdAt: new Date().toISOString()
      }

      threads.push(newThread)


      //Save thread
      fs.writeFileSync(
        THREAD_FILE,
        JSON.stringify(threads, null, 2),
        "utf-8"
      )

      return JSON.stringify(newThread)
    } catch (error) {
      console.error("Create thread error: ", error);
      return "Failed to create thread.";
    }
  },
  {
    name: "create_thread",
    description: "Create a new thread. If an active thread exists, deactivate it and create a new thread.",
    schema: z.object({
      userId: z.string(),
      title: z.string().optional()
    })
  }
)

export const readThreadTool = tool(
  async ({ userId, threadId }: { userId: string, threadId?: string }) => {
    try {
      if (!fs.existsSync(THREAD_FILE)) {
        return "[]"
      }

      let data = fs.readFileSync(THREAD_FILE, 'utf-8');
      let threads = JSON.parse(data) as any[]

      let threadFound = null;

      let updatedThreads = (threads || []).map((t: any) => {
        if (t.userId == userId && t.threadId == threadId) {
          threadFound = { ...t, active: true }
          return { ...t, active: true }
        }
        return { ...t, active: false }
      })

      if (!threadFound) {
        return "Thread not found"
      }

      //Save updated thread list
      fs.writeFileSync(
        THREAD_FILE,
        JSON.stringify(updatedThreads),
        "utf-8"
      );

      return JSON.stringify(threadFound)
    } catch (error) {
      console.error("Read thread error:", error);
      return "[]"
    }
  },
  {
    name: "read_threads",
    description: "Retreive all threads for a user and activate a specific thread",
    schema: z.object({
      userId: z.string(),
      threadId: z.string(),
    })
  }
)


export const updateThreadTitleTool = tool(
  async ({ userId, threadId, title }) => {
    try {
      if (!fs.existsSync(THREAD_FILE)) {
        return "Thread file not found.";
      }

      const data = fs.readFileSync(THREAD_FILE, 'utf-8');
      const threads = JSON.parse(data);

      let threadIndex = threads.findIndex((t: any) => t.userId == userId && t.threadId == threadId)

      if (threadIndex == -1) {
        return "Thread not found.";
      }

      threads[threadIndex].title = title

      fs.writeFileSync(
        THREAD_FILE,
        JSON.stringify(threads),
        'utf-8'
      )

      return "Thread title updated successfully.";
    } catch (error) {
      console.error('Updated title error:', error);
      return "Failed to update thread title.";
    }
  },
  {
    name: "update_thread_title",
    description: "Update the title of a specific thread using userId and threadId",
    schema: z.object({
      userId: z.string(),
      threadId: z.string(),
      title: z.string(),
    })
  }
)


export const getAllThreadsByUserTool = tool(
  async ({ userId }) => {
    try {
      if (!fs.existsSync(THREAD_FILE)) {
        return {
          threads: [],
          redirectThreadId: null
        }
      }

      const data = fs.readFileSync(THREAD_FILE, "utf-8");
      const threads = JSON.parse(data)

      let userThreads = threads.filter((t: any) => t.userId == userId || t.googleId == userId)
      let activeThread = null as any;
      
      if (userThreads.length == 0) {
        const newThread = {
          userId,
          threadId: uuidv4(),
          title: "New Thread",
          active: true,
          createdAt: new Date().toISOString()
        }

        userThreads = [...threads, newThread]
        updateThreadsList(userThreads)
        console.log({ userThreads, newThread })
        activeThread = newThread
      } else {
        activeThread = userThreads.find((t: any) => t.active == true)
        if (!activeThread) {
          activeThread = userThreads[0]
          activeThread.active = true;

          let activeThreadIndex = threads.findIndex((t: any) => t.threadId == activeThread.id)
          threads[activeThreadIndex] = activeThread
          updateThreadsList(threads)
        }
      }

      console.log({ userThreads, activeThread })
      return {
        threads: userThreads,
        redirectThreadId: activeThread.threadId
      }
    } catch (error) {
      console.error("Get threads error:", error);
      return {
        threads: [],
        redirectThreadId: null
      };
    }
  },
  {
    name: "get_all_threads_by_user",
    description: "Return all threads belonging to a specific user without modifying their active status.",
    schema: z.object({
      userId: z.string()
    })
  }
)

export const generateThreadTitleTool = tool(
  async ({ userId, threadId, llm }) => {
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return false
      }

      const historyRaw = fs.readFileSync(HISTORY_FILE, "utf-8");
      const history = JSON.parse(historyRaw);

      // FIlter messages for this thread
      const historyMessages = history.filter(
        (m: any) => m.userId == userId && m.threadId == threadId
      );

      if (historyMessages.length == 3) {
        const firstTwo = historyMessages
          .slice(0, 2)
          .map((m: any) => `role:${m.role} content: ${m.content}`)
          .join("\n")

        if (!firstTwo) {
          return false
        }

        // Ask LLM to generate short title
        const response = await llm.invoke([
          {
            role: "system",
            content: "Generate a very short (3-6 words) title summarizing this conversation."
          },
          {
            role: "user",
            content: firstTwo
          }
        ])

        const generatedTitle = response.content.trim();

        const threadsRaw = fs.readFileSync(THREAD_FILE, "utf-8");
        const threads = JSON.parse(threadsRaw);
        console.log(`updating thread title`)
        const updatedThreads = threads.map((t: any) => {
          if (t.threadId == threadId && t.userId == userId) {
            return { ...t, title: generatedTitle }
          }
          return t
        });

        // Save updated threads
        fs.writeFileSync(
          THREAD_FILE,
          JSON.stringify(updatedThreads, null, 2),
          "utf-8"
        );
        console.log(`Thread title updated to: ${generatedTitle}`)

        return true
      }

      return false;
    } catch (err) {
      console.error("Title generation error:", err);
      return "Failed to generate thread title."
    }
  }, {
    name: 'GenerateThreadTitle',
    description:"Generate a short conversation title based on first two user messages and update thread title.",
    schema: z.object({
      userId: z.string(),
      threadId: z.string(),
      llm: z.any()
    })
  }
)