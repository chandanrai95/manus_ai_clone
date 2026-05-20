import fs from 'node:fs';
import path from 'node:path';

import { tool, createAgent, createMiddleware } from 'langchain'

import {
    SystemMessage,
    ToolMessage,
    HumanMessage
} from '@langchain/core/messages'

export const toolMonitoringMiddleware = createMiddleware({
    name: "ToolMonitoringMiddleware",
    wrapToolCall: async (request, handler) => {
        console.log(`Executing tool================: ${request.toolCall.name}`);
        console.log(` Arguments================: ${JSON.stringify(request.toolCall.args)}`);

        try {
            const result = await handler(request);
            console.log("Tool completed successfully==============")
            return result
        } catch (e) {
            console.log(`Tool failed: ${e}`);
            throw e;
        }
    }
})

export const ToolOutputSummarizerMiddleware = createMiddleware({
    name: "ToolOutputSummarizer",
    // The 'handler' is the actual tool execution function
    wrapToolCall: async (request, handler) => {
        // 1. Execute the tool as normal
        const response = await handler(request) as any;
        // const c = estimateTokens(response?.content)
        // console.log('tool result ===', c)

        // 2. Check if the output (BaseMessage) is too long
        // if (response.content.length > 20) {

        //   // 3. Call your summary model
        //   // const summaryResponse = await summaryModel.invoke([
        //   //   ["system", "Summaruze this tool ouput into key bullet points. Retain a"]
        //   //   ["user", response.content]
        //   // ])

        //   // 4. Return a New ToolMessage with summarized content
        //   // Middleware expects a BaseMessage or Command as a return value
        //    return new ToolMessage({
        //      content: `[Summary]: summarize result :nothing`,
        //      tool_call_id: response.tool_call_id
        //      id: response.id
        //      })
        // }
        
        // If not too long, return the original response
        return response;
    }
})