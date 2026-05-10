import fs from 'fs';
import path from 'path';
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const ROOT = process.cwd();
const CHAT_HISTORY_DIR = path.join(ROOT, "public", "chat-history");

if (!fs.existsSync(CHAT_HISTORY_DIR)) {
  fs.mkdirSync(CHAT_HISTORY_DIR, { recursive: true })
}

const HISTORY_FILE = path.join(CHAT_HISTORY_DIR, 'chat-history.json');

export const messageSchema = z.object({
  role: z.enum(["user", 'ai']),
  userId: z.string(),
  threadId: z.string(),
  content: z.string(),
  thinking: z.string().optional()
})


export const writeToChatHistoryTool = tool(
  async ({ messages }) => {
    try {

      let history: any[] = []
      
      //Load old history if exists
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, "utf-8")
        history = JSON.parse(data)
      }

      history.push(...messages)

      fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(history, null, 2),
        "utf-8"
      );

      return "Chat history written successfully."
    } catch (error) {
      return "Failed to chat history"
    }
  }, 
  {
    name: "write_chat_history",
    description: "Write conversation to chat-history",
    schema: z.object({
      messages: z.array(messageSchema)
    })
  }
)

export const readChatHistoryTool = tool(
  async ({ userId, threadId }) => {
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return "[]";
      }

      //Read memory file

      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      const history = JSON.parse(data);

      const filtered = history.filter((h: any) => h.threadId == threadId && h.userId == userId)
 
      return JSON.stringify(filtered)
    } catch (error) {
      console.error("Memory read error:", error)
      return "[]";
    }
  }, 
  {
    name: "read_chat_history",
    description: "Retreive chat history entries for a given user ",
    schema: z.object({
      userId: z.string(),
      threadId: z.string()
    })
  }
)


// export const writeToChatHistoryTool = tool(
//   async ({ messages }) => {
//     try {

//       let history: any[] = []
 
//       return "Chat history written successfully."
//     } catch (error) {
//       return "Failed to chat history"
//     }
//   }, 
//   {
//     name: "write_memory",
//     description: "Write conversation to chat-history",
//     schema: z.object({
//       messages: messageSchema
//     })
//   }
// )