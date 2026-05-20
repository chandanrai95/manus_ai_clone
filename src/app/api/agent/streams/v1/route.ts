import { graph } from "@/lib/graph/graph";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chathistoryTools";
import { generateThreadTitleTool } from "@/lib/tools/threadTools";
import { ok } from "assert";
import { createAgent } from "langchain";

export const POST = withErrorHandler(async (req: Request) => {
    try {
        const { message, userId, threadId }: { message: string, userId: string, threadId: string } = await req.json()
        const llm = LLM.getInstance('ollama')

        const { logLastAIMsg } = await createMemoryAgent({ model: llm, userId, threadId })

        const graphStream = await graph.stream(
            {
                messages: [{ role: "user", content: message }],
                userId, threadId
            },
            { streamMode: 'custom', subgraphs: true } //subgraphs is true because we want to interact with spawn sub-agents
        );

        const encoder = new TextEncoder();

        const sse = (event: string, data: any) =>
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

        await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, userId, threadId, sub_agent: [] }] })

        let streamingText = '';
        let thinkingBuffer = '';
        let inThinking = false;

        const subagentsTracker: any = [];

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const [array, chunk] of graphStream) {
                        
                        // write file
                        if ((chunk as any).write_file) {
                            const write_file = {
                                filename: chunk?.filename,
                                content: chunk?.content
                            }
                            console.log('write_file --', write_file)
                            controller.enqueue(sse("write_file", {
                                write_file
                            }))
                        }
                        // end write file


                        // read file
                        if ((chunk as any).read_file) {
                            const read_file = {
                                filename: chunk?.filename,
                                content: chunk?.content
                            }

                            controller.enqueue(sse("read_file", {
                                read_file
                            }))
                        }
                        // end read file

                        // update todos
                        if ((chunk as any).update_todos) {
                            const update_todo = {
                                todos: chunk?.todos,
                                updates: chunk?.updates
                            }

                            controller.enqueue(sse("update_todos", {
                                update_todo
                            }))
                        }
                        // end update todos


                        // todos
                        if ((chunk as any).todos) {
                            const todo_list = {
                                todos: chunk?.todos,
                                todoList: chunk?.todoList
                            }

                            controller.enqueue(sse("todo_list", {
                                todo_list
                            }))
                        }
                        // end todos

                        if ((chunk as any).subagent_name) {
                            const name = (chunk as any).subagent_name
                            const content = (chunk as any)?.content

                            const subAgentPayload = {
                                sub_agent_name: name,
                                content
                            }

                            updateSubAgentTracker(name, content, subagentsTracker);

                            controller.enqueue(sse("sub_agent", {
                                sub_agent: subAgentPayload
                            }))

                            continue;
                        }

                        if ((chunk as any).manager_name) {
                            // console.log('manager ============', chunk.manager_name)

                            const content = chunk.content;

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

                            // const modelMessages = chunk?.model_request?.messages ?? [];

                            // for (const msg of modelMessages) {
                            //     const reasoningContent =
                            //         msg?.additional_kwargs?.reasoning_content ?? "";

                            //     if (reasoningContent) {
                            //         thinkingBuffer += reasoningContent;
                            //         controller.enqueue(sse("thinking", { thinking: reasoningContent }));
                            //     }

                            //     const content =
                            //         typeof msg?.content === "string"
                            //             ? msg.content
                            //             : JSON.stringify(msg?.content ?? "");

                            //     const parts = content.split(/(<think>|<\/think>)/);

                            //     for (const part of parts) {
                            //         if (part === "<think>") {
                            //             inThinking = true;
                            //         } else if (part === "</think>") {
                            //             inThinking = false;
                            //         } else if (part.length > 0 && inThinking) {
                            //             thinkingBuffer += part;
                            //             controller.enqueue(sse("thinking", { thinking: part }));
                            //         } else if (part.length > 0) {
                            //             streamingText += part;
                            //             controller.enqueue(sse("message", { message: part }));
                            //         }
                            //     }
                            // }
                        }
                    }// end of chunks loop

                    const updateThread = await generateThreadTitleTool.invoke({ threadId, userId, llm })

                    if (updateThread) {
                        controller.enqueue(sse("updateThread", { ok: true }));
                    }

                    controller.enqueue(sse("end", { ok: true }));
                    await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, userId, threadId, sub_agent: subagentsTracker }] })
                    controller.close()

                } catch (error) {
                    console.log('Error', error)
                    controller.enqueue(sse("error", { error: (error as Error)?.message }))
                    controller.close();
                }
            }
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive"
            }
        })
    } catch (error: any) {
        console.log('stream v1 error', error)
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': "application/json" }
        })
    }
})


const updateSubAgentTracker = (name: string, newContent: string, tracker: any[]) => {
    try {
        const existing = tracker.find(s => s.sub_agent_name == name);
        if (existing) {
            existing.content += (newContent ?? "");
        } else {
            tracker.push({
                sub_agent_name: name,
                content: newContent ?? ""
            })
        }
    } catch (error) {
        console.error('updateSubAgentTracker', error)
    }


}