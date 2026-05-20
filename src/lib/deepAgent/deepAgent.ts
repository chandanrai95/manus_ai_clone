import fs from "node:fs";
import path from "node:path";

import { tool, createAgent, createMiddleware } from "langchain";

import {
    SystemMessage,
    ToolMessage,
    HumanMessage
} from '@langchain/core/messages'

import { ChatOpenRouter } from "@langchain/openrouter";
import { think_tool } from "./thinkTool";
import { createTaskTool } from "./taskTool";
import { todoListTools } from "./todoTools";
import { basePrompt, TASK_SYSTEM_PROKMPT } from "./prompts";
import { fileSystemTools } from "./fsTools";
import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";
import { ChatOllama } from "@langchain/ollama";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { LLM } from "../llm/LLM";


// const client = new MultiServerMCPClient({
//     mcpServers: {
//         "opensandbox": {
//             transport: "http",
//             url: "http://127.0.0.1:8080/mcp" // MCP HTTP endpoint
//         }
//     }
// })

const client = new MultiServerMCPClient({
  mcpServers: {
    opensandbox: {
      transport: "stdio",
      command: "opensandbox-mcp",
      args: [
        "--domain",
        "localhost:8080",
        "--protocol",
        "http",
        "--api-key",
        "test",
      ],
      env: {
        OPEN_SANDBOX_API_KEY: "test",
        OPEN_SANDBOX_DOMAIN: "localhost:8080",
        OPEN_SANDBOX_PROTOCOL: "http",
      },
    },
  },
});

const mcpTools = await client.getTools();

// const mcpTools = await client.getTools()
// const mcpTools = [] as any[]

const managerLLM = new ChatOllama({
    model: 'nemotron-3-super:cloud',
    // model: 'gpt-oss:120b-cloud',
    // model: 'gpt-oss:20b',
    // model: 'gemma4',
    temperature: 0.7,
    think: true,
    // stop: ["</tool_call>", "Human:", "User:"],
})

const workerLLM = LLM.getInstance("openrouter_reactive")

const subagentConfigs = {
    tools: [
        ...fileSystemTools,
        ...mcpTools
    ]
}

const managerTools = [...fileSystemTools, ...mcpTools, ...todoListTools, think_tool, createTaskTool(workerLLM, subagentConfigs)]

export async function testDeepAgent(userInput: string, config: any) {
    try {
        // For the Main Manager Agent
        const agent = createAgent({
            model: managerLLM,
            tools: managerTools,
            systemPrompt: `
<system>
${basePrompt}
\n\n
${TASK_SYSTEM_PROKMPT}
</system>
    `,
            middleware: [toolMonitoringMiddleware],
            // ToolOutputSummarizerMiddleware
        })

        // const agentOutput = await agent.invoke({
        //     messages: [new HumanMessage(userInput)]
        // }, {
        //     recursionLimit: 150
        // });

        // const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

        // console.log(agentOutput)

        const agentStream = await agent.stream(
            { messages: [new HumanMessage(userInput)] },
            { streamMode: "messages", recursionLimit: 150 }
        )

        let fullContent = "";

        try {
            for await (const [messageChunk, metadata] of agentStream) {
                // console.log("============================================");

                const messageType =
                    messageChunk?._getType?.() ||
                    messageChunk?.getType?.() ||
                    messageChunk?.type ||
                    messageChunk?.constructor?.name;

                // console.log("chunk debug:", {
                //     messageType,
                //     node: metadata?.langgraph_node,
                //     contentType: typeof messageChunk?.content,
                //     content: messageChunk?.content,
                //     toolCalls: messageChunk?.tool_calls,
                //     invalidToolCalls: messageChunk?.invalid_tool_calls,
                //     metadata,
                // });

                if (messageType === "tool" || messageType === "ToolMessage") {
                    console.log("Skipping tool response:", messageChunk?.content);
                    continue;
                }

                const text =
                    typeof messageChunk?.content === "string"
                        ? messageChunk.content
                        : "";

                if (!text) {
                    // console.log("Skipping empty/non-string content");
                    continue;
                }

                fullContent += text;

                config.writer({
                    manager_name: "nodeB",
                    content: text,
                });

                // console.log("===================END=========================");
            }

            console.log("deep agent res ---", fullContent);
            return fullContent;
        } catch (streamError: any) {
            console.error("STREAM LOOP ERROR:", {
                name: streamError?.name,
                message: streamError?.message,
                stack: streamError?.stack,
                cause: streamError?.cause,
                status: streamError?.status,
                status_code: streamError?.status_code,
                error: streamError?.error,
                partialContent: fullContent,
            });

            return fullContent || JSON.stringify({
                success: false,
                error: streamError?.message || String(streamError),
                status_code: streamError?.status_code,
            });
        }
    } catch (error: any) {
        console.error('testDeepAgent error', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            cause: error?.cause,
            status: error?.status,
            status_code: error?.status_code,
            error: error?.error,
        });

    }
}

