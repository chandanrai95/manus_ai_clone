import { createAgent, createMiddleware } from "langchain";
import path from "node:path";
import { MemoryManager } from "./MemoryManger";
import { buildFilesystemTools } from "./tools/fileSystemTools";
import { MEMORY_AGENT_SYSTEM_PROMPT } from "./prompt/system-prompts";
import { ContextAssembler } from "./contextAssembler";

export const toolMonitoringMiddleware = createMiddleware({
    name: "ToolMonitoringMiddleware",
    wrapToolCall: (request, handler) => {
        console.log(`Executing tool======================: ${request.toolCall.name}`)
        console.log(`Arguments===========================: ${JSON.stringify(request.toolCall.args)}`)

        try {
            const result = handler(request);
            console.log("Tool completed successfully===========");
            return result;
        } catch (e) {
            console.log(`Tool failed: ${e}`)
            throw e;
        }
    }
})

export async function createMemoryAgent({
    memoryRoot = path.resolve(process.cwd(), 'public', 'memory'),
    model = "gpt-oss-120b",
    modelContextLimit = 3000,
    userId = "",
    threadId = ""
}) {
    const memoryManager = new MemoryManager(memoryRoot, { userId, threadId })

    await memoryManager.init()

    const contextAssembler = new ContextAssembler(memoryManager, modelContextLimit, { userId, threadId })

    const { writeLTMTool } = buildFilesystemTools(memoryRoot, { userId, threadId })

    const agent = createAgent({
        model,
        tools: [writeLTMTool],
        systemPrompt: MEMORY_AGENT_SYSTEM_PROMPT,
        middleware: [toolMonitoringMiddleware]
    })

    async function run_agent(userInput: string, options = {}) {

        await memoryManager.logInteraction('User', userInput, new Date());

        const assembled = await contextAssembler.assemble(userInput, {})

        console.log('assemble --------', assembled)

        const agentOutput = await agent.invoke({
            messages: [{ role: 'user', content: assembled?.prompt }]
        });

        const assistantResponse = agentOutput.messages[agentOutput.messages.length - 1];
        const assistantReasoningContent = assistantResponse?.additional_kwargs?.reasoning_content || ""
        const assistantText = typeof assistantResponse.content === 'string' ? assistantResponse.content : JSON.stringify(assistantResponse.content);

        const assistantMessage = assistantReasoningContent ? `
<think>
${assistantReasoningContent}
</think>

${assistantText}
`: assistantText

        await memoryManager.logInteraction('Assistant', assistantMessage, new Date());

        return {
            assistantText
        }
    }

    async function streamAgent(userInput: string) {
        await memoryManager.logInteraction("User", userInput, new Date());

        const assembled = await contextAssembler.assemble(userInput, {})

        const stream = await agent.stream({
            messages: [{ role: 'user', content: assembled?.prompt }],
        }, { streamMode: 'updates' })

        return {
            stream
        }
    }

    async function logLastAIMsg(fullAssistantText: string) {
        await memoryManager.logInteraction('Assistant', fullAssistantText, new Date());
    }

    return {
        logLastAIMsg,
        run_agent,
        streamAgent
    }
}