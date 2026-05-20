import { tool, createAgent, createMiddleware } from 'langchain'
import { z } from "zod";

import {
    SystemMessage,
    HumanMessage,
    AIMessageChunk
} from '@langchain/core/messages';

import { DEFAULT_SUBAGENT_PROMPT, getTaskToolDescription } from "./prompts";
import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware"

const taskToolDescription = getTaskToolDescription()


/** 
 * The Task Tool:  This is where the spawning happens.
*/
export const createTaskTool = (model: any, config: any = {}) => {
    return tool(
        async ({ task, sub_agent }, toolConfig: any) => {

            try {
                const subagent = createAgent({
                    model,
                    tools: [...config.tools],
                    systemPrompt: `${DEFAULT_SUBAGENT_PROMPT}\n\n
                
                Once you finish the research you should only return the name of the file that contains the final result or output.

                \n\nTask: ${task}`,
                    middleware: [toolMonitoringMiddleware]
                    // ToolOutputSummarizerMiddleware
                });

                // // 3. Execute and return onlyt the final result to the Parent
                // const result = await subagent.invoke({
                //     messages: [new HumanMessage(task)]
                // });

                // // Extract the last message as the report
                // const finalMessage = result.messages[result.messages.length - 1];
                // return typeof finalMessage.content === 'string'
                //     ? finalMessage.content
                //     : JSON.stringify(finalMessage.content);

                const subAgentStream = await subagent.stream(
                    { messages: [new HumanMessage(task)] },
                    { streamMode: ["messages", "custom"], recursionLimit: 50 }
                )

                let finalContent = "";

                for await (const [event, data] of subAgentStream) {
                    if (event === "messages") {
                        const [message] = data as [AIMessageChunk, Record<string, any>];
                        if (message.content) {
                            toolConfig.writer({
                                subagent_name: sub_agent,
                                content: message.content as string
                            });
                            finalContent += message.content;
                        }

                    } else if (event === "custom") {
                        console.log('received write_file --', data)
                        toolConfig.writer({
                            subagent_name: sub_agent,
                            content: typeof data === "string" ? data : JSON.stringify(data)
                        });
                    }
                }

                return finalContent;
            } catch (error: any) {
                return `Error while creating task tool: ${error.message}`
            }
        },
        {
            name: "task",
            description: taskToolDescription,
            schema: z.object({
                task: z.string().describe("Highly detailed instructions for the subagent."),
                sub_agent: z.string().describe("The name must be unique for each spawned sub-agent to help track execution and avoid conflicts between parallel tasks.")
            })
        }
    )
}