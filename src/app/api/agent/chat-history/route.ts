import { LLM } from "@/lib/llm/LLM";
import { readChatHistoryTool } from "@/lib/tools/chathistoryTools";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') as string
    const threadId = searchParams.get('threadId') as string

    if (!userId || !threadId) {
      return NextResponse.json(
        { ok: false, message: "userId or threadId are required." },
        { status: 400 }
      )
    }

    const retreivedMessages = await readChatHistoryTool.invoke({ userId, threadId })
    const messages = JSON.parse(retreivedMessages)

    return NextResponse.json({ messages })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch chat history"},
      { status: 500}
    )
  }
}