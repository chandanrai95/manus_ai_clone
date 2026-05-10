import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chathistoryTools";
import { generateThreadTitleTool } from "@/lib/tools/threadTools";
import { createAgent } from "langchain";

// export const POST = withErrorHandler(async (req: Request) => {
//   try {
//     const { message, userId, threadId }: { message: string, userId: string, threadId: string } = await req.json()
//     const llm = LLM.getInstance('ollama')

//     const agent = createAgent({
//       model: llm,
//       systemPrompt: `You are a helpful AI assistant that chat with User in English.`
//     })

//     const encoder = new TextEncoder();

//     const sse = (event: string, data: any) =>
//       encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

//     await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, userId, threadId }] })

//     let streamingText = '';
//     let thinkingBuffer = "";
//     let inThinking = false;

//     const stream = new ReadableStream({
//       async start(controller) {
//         try {

//           for await (
//             const chunk of await agent.stream(
//               { messages: [{ role: "user", content: message }] },
//               { streamMode: "updates" }
//             )
//           ) {
//             console.log("chunk", chunk);

//             const updates = chunk?.tools?.messages ?? [];

//             for (const update of updates) {
//               const toolContent =
//                 typeof update?.content === "string"
//                   ? update.content
//                   : JSON.stringify(update?.content ?? "");

//               if (toolContent) {
//                 thinkingBuffer += toolContent;
//                 controller.enqueue(sse("thinking", { thinking: toolContent }));
//               }
//             }

//             const modelMessages = chunk?.model_request?.messages ?? [];

//             for (const msg of modelMessages) {
//               const reasoningContent =
//                 msg?.additional_kwargs?.reasoning_content ?? "";

//               if (reasoningContent) {
//                 thinkingBuffer += reasoningContent;
//                 controller.enqueue(sse("thinking", { thinking: reasoningContent }));
//               }

//               const content =
//                 typeof msg?.content === "string"
//                   ? msg.content
//                   : JSON.stringify(msg?.content ?? "");

//               const parts = content.split(/(<think>|<\/think>)/);

//               for (const part of parts) {
//                 if (part === "<think>") {
//                   inThinking = true;
//                 } else if (part === "</think>") {
//                   inThinking = false;
//                 } else if (part.length > 0 && inThinking) {
//                   thinkingBuffer += part;
//                   controller.enqueue(sse("thinking", { thinking: part }));
//                 } else if (part.length > 0) {
//                   streamingText += part;
//                   controller.enqueue(sse("message", { message: part }));
//                 }
//               }
//             }
//           }

//           controller.enqueue(sse("end", { ok: true }))
//           writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, userId, threadId }] })

//         } catch (err) {
//           console.error('Error ', (err as Error)?.message)
//           controller.enqueue(sse("error", { error: (err as Error)?.message }))
//         } finally {
//           controller.close()
//         }
//       }
//     });

//     return new Response(
//       stream, {
//       headers: {
//         "Content-Type": "text/event-stream; charset=utf-8",
//         "Cache-Control": "no-cache, no-transform",
//         "Connection": "keep-alive"
//       }
//     }
//     )

//   } catch (error: any) {
//     return new Response(
//       JSON.stringify({
//         ok: false, error: error.message
//       }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" }
//     }
//     )
//   }
// })


export const POST = withErrorHandler(async (req: Request) => {
  try {
    const { message, userId, threadId }: { message: string, userId: string, threadId: string } = await req.json()
    const llm = LLM.getInstance('ollama')

    const { streamAgent, logLastAIMsg } = await createMemoryAgent({
      model: llm,
      userId,
      threadId
    })

    const encoder = new TextEncoder();

    const sse = (event: string, data: any) =>
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, userId, threadId }] })

    let streamingText = '';
    let thinkingBuffer = "";
    let inThinking = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {

          for await (
            const chunk of (await streamAgent(message)).stream
          ) {
            console.log("chunk", chunk);

            const updates = chunk?.tools?.messages ?? [];

            for (const update of updates) {
              const toolContent =
                typeof update?.content === "string"
                  ? update.content
                  : JSON.stringify(update?.content ?? "");

              if (toolContent) {
                thinkingBuffer += toolContent;
                controller.enqueue(sse("thinking", { thinking: toolContent }));
              }
            }

            const modelMessages = chunk?.model_request?.messages ?? [];

            for (const msg of modelMessages) {
              const reasoningContent =
                msg?.additional_kwargs?.reasoning_content ?? "";

              if (reasoningContent) {
                thinkingBuffer += reasoningContent;
                controller.enqueue(sse("thinking", { thinking: reasoningContent }));
              }

              const content =
                typeof msg?.content === "string"
                  ? msg.content
                  : JSON.stringify(msg?.content ?? "");

              const parts = content.split(/(<think>|<\/think>)/);

              for (const part of parts) {
                if (part === "<think>") {
                  inThinking = true;
                } else if (part === "</think>") {
                  inThinking = false;
                } else if (part.length > 0 && inThinking) {
                  thinkingBuffer += part;
                  controller.enqueue(sse("thinking", { thinking: part }));
                } else if (part.length > 0) {
                  streamingText += part;
                  controller.enqueue(sse("message", { message: part }));
                }
              }
            }
          }
          const updateThread = await generateThreadTitleTool.invoke({ threadId, userId, llm })
          if (updateThread == true) {
            controller.enqueue(sse("updateThread", { ok: true }))
          }

          controller.enqueue(sse("end", { ok: true }))
          await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, userId, threadId }] })
          await logLastAIMsg(streamingText)
        } catch (err) {
          console.error('Error ', (err as Error)?.message)
          controller.enqueue(sse("error", { error: (err as Error)?.message }))
        } finally {
          controller.close()
        }
      }
    });

    return new Response(
      stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        ok: false, error: error.message
      }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }
    )
  }
})