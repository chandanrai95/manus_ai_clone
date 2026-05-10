import { createThreadHistoryTool, getAllThreadsByUserTool, updateThreadTitleTool } from "@/lib/tools/threadTools";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 }
      );
    }

    const result = await createThreadHistoryTool.invoke({
      userId,
      title
    })

    return NextResponse.json(JSON.parse(result))
  } catch (error) {
    console.error("Create thread API error:", error)
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, threadId, title } = body;

    if (!userId || !threadId || !title) {
      return NextResponse.json(
        { error: "userId, threadId and title are required." },
        { status: 400 }
      );
    }

    const result = await updateThreadTitleTool.invoke({
      userId,
      threadId,
      title
    })

    return NextResponse.json({ message: result });
  } catch (error) {
    console.error("Update thread API error:", error)
    return NextResponse.json(
      { error: "Failed to update thread title" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 }
      );
    }

    const { threads } = await getAllThreadsByUserTool.invoke({
      userId
    })

    return NextResponse.json(threads);
  } catch (error) {
    console.error("Get all threads API error:", error)
    return NextResponse.json(
      { error: "Failed to retreive threads" },
      { status: 500 }
    )
  }
}