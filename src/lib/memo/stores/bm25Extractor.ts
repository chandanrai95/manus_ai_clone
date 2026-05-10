import { LLM } from "@/lib/llm/LLM";
import { HumanMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";

export async function extractRelevantDocument(query: string, doc: string) {

    const llm = LLM.getInstance('openrouter')
    const agent = createAgent({
        model: llm,
        systemPrompt: `You are a relevance filter for a Retrieval-Augmented Generation (RAG) system.

            Task:
            Select ONLY the parts of the context that are directly useful for answering the user's question.

            Strict rules:
            - Extract text Exactly as it appears in the context (verbatim).
            - DO NOT paraphrase, summarize, explain, or edit.
            - DO NOT include mathematical formulas, probabilistic models, or system-level retrieval theory
            UNLESS the question explicitly asks for them.
            - The extracted text MUST clearly and explicitly help answer the question.
            - If a passage is only loosely related or requires interpretation, EXCLUDE it.
            - If No part of context is directly relevant, return exactly: "NO_OUTPUT"
        `
    })

    const agentOutput = await agent.invoke({
        messages: [new HumanMessage(`
            User Question:
            <user_question>
            ${query}
            </user_question>

            Retrieved Data:
            <retrieved_data>
            ${doc}
            </retrieved_data>

            output:
            - Return ONLY the extracted context text.
            - If multiple parts are relevant, return them in the same order as in the context.
            - DO NOT add any extra text before or after the extraction.
        `)]
    })

    const aiResponse = agentOutput.messages[agentOutput.messages.length - 1]?.content;
    return aiResponse
}

