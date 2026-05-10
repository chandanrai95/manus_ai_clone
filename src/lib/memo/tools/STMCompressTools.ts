import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import "dotenv/config"

const summarizationModel = new ChatOllama({
    model: "llama3.2",
    temperature: 0.3
})



const SYSTEM_PROMPT = `
You are a Memory Compression Agent.

Your task is to compress a full daily chat log into a clean, durable summary.

Rules:
- Remove ALL internal reasoning traces such as <think> blocks.
- Ignore system prompts, tool calls, and assistant planning text.
- Extract only meaningful conversational content.
- Remove timestamps and formatting noise.
- Do NOT rewrite the conversation as dialogue.
- Do NOT add new information.
- Preserve stable user facts.
- Keep summary concise (max 150-250 words).

OUTPUT FORMAT (strictly follow this structure):

# Daily Log Summary
Date: {date}
Status: Compressed

## Overview
{1-2 sentence high-level description}

## Key Facts Extracted
- {fact 1}
- {fact 2}
- {fact 3}

## Conversation Summary
{Short narrative summary of meaningful events}

Do no include anything outside this format.
`

/**
 * summarize_message(message)
 * Take a long message (or concatenated messages) adn produce
 * a compact summary suitanle for long-term memory.
 */

export const compressSTMTool = tool(
    async({
        message
    }) => {
        const res = await summarizationModel.invoke([
            new SystemMessage(SYSTEM_PROMPT),
            new HumanMessage(message)
        ])

        return res?.content;
    }, 
    {
        name: "summarize_message",
        description: "compress memory",
        schema: z.object({
            message: z
            .string()
            .describe("Raw text or concatenated messages to be summarized.")
        })
    }
)