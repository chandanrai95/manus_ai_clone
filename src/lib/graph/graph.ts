import {
    END,
    START,
    StateGraph,
    Annotation,
    MessagesAnnotation,
    Command
} from "@langchain/langgraph";

import {
    AIMessage,
    HumanMessage,
    SystemMessage
} from "@langchain/core/messages";
import { LLM } from "../llm/LLM";
import { createMemoryAgent } from "../memo/MemoryAgent";
import { testDeepAgent } from "../deepAgent/deepAgent";
import { MemoryManager } from "../memo/MemoryManger";
import path from "node:path";

const llm = LLM.getInstance('ollama');

function removeThinkTag(input: string) {
    return input
        .replace(/<\/?think>/gi, "") // remove <think> tags
        .replace(/__TRANSFER__/gi, "") // remove __TRANSFER__
        .replace(/^\s*\+\s*/, "") // remove leading "+"
        .trim();
}

// 1. Define the graph state

const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    threadId: Annotation(),
    userId: Annotation(),
    nextNode: Annotation()
})


// 2. Define the Nodes

const nodeA = async (state: any, config: any) => {
    console.log("=======================nodeA=======================");
    const { userId, threadId } = state

    const last = state.messages
        .filter((m: any) => m._getType() == "human")
        .slice(-1)[0];

    const { run_agent, logLastAIMsg, streamAgentV1 } = await createMemoryAgent({ model: llm, userId, threadId })

    const fullContent = await streamAgentV1(last?.content, config);

    const shouldHandoff = fullContent.includes("__TRANSFER__");

    if (shouldHandoff) {
        return new Command({
            update: { messages: [new AIMessage(fullContent)] },
            goto: "nodeB"
        })
    }

    return new Command({
        update: {
            messages: [new AIMessage(fullContent)],
            nextNode: END
        },
        goto: END
    })
};


const nodeB = async (state: any, config: any) => {
    console.log("=======================nodeB=======================");
    const { userId, threadId } = state
    const memoryRoot = path.resolve(process.cwd(), "public", "memory")
    const memoryManager = new MemoryManager(memoryRoot, { userId, threadId });

    const last = state.messages
        .filter((m: any) => m._getType() == "ai")
        .slice(-1)[0];

    console.log('last message =====', last?.content)
    const cleanMessage = removeThinkTag(last?.content)
    console.log('cleanMessage ====', cleanMessage)

    const aiMessage = await testDeepAgent(cleanMessage, config) as any

    await memoryManager.logInteraction("Assistant-2", aiMessage, new Date())

    console.log("=======================end nodeB=======================");

    return new Command({
        update: { messages: [new AIMessage(aiMessage || '')] },
        goto: END
    })
}

// 3. Build the Graph

const workflow = new StateGraph(StateAnnotation)
    .addNode('nodeA', nodeA)
    .addNode('nodeB', nodeB)

    .addEdge("__start__", "nodeA")
    .addConditionalEdges('nodeA', (state) => {
        if (state.nextNode == "nodeB") {
            return "nodeB"
        }

        return END
    })

    .addEdge("nodeA", END)
    .addEdge("nodeB", END)

export const graph = workflow.compile()