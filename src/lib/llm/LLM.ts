import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatOllama } from "@langchain/ollama";

type LLMType =  "openrouter" | "ollama" | "openrouter_reactive" | "ollama_reactive";

export class LLM {
    private static instances: Partial<Record<LLMType, any>> = {}

    private constructor() { }

    public static getInstance(type: LLMType = "openrouter") {
        if (!LLM.instances[type]) {
            switch (type) {
                case "openrouter":
                    if (!process.env.OPENROUTER_API_KEY) {
                        throw new Error("OPENROUTER_API_KEY is not set")
                    }
                    LLM.instances[type] = new ChatOpenRouter({
                        model: 'openai/gpt-oss-120b:free',
                        apiKey: process.env.OPENROUTER_API_KEY,
                        temperature: 0.7
                    })
                    break;
                case "openrouter_reactive":
                    if (!process.env.OPENROUTER_API_KEY) {
                        throw new Error("OPENROUTER_API_KEY is not set")
                    }
                    LLM.instances[type] = new ChatOpenRouter({
                        model: 'qwen/qwen3-coder:free',
                        apiKey: process.env.OPENROUTER_API_KEY,
                        temperature: 0.7
                    })
                    break;
                case "ollama":
                    LLM.instances[type] = new ChatOllama({
                        model: 'gpt-oss:120b-cloud',
                        // model: 'gpt-oss:20b',
                        temperature: 0.7,
                        think: true
                    })
                    break;
                
                case "ollama_reactive":
                    LLM.instances[type] = new ChatOllama({
                        model: "gemma4",
                        temperature: 0.7,
                        numCtx: 8192,
                        // stop: ["</tool_call>", "Human:", "User:"]
                    })
            }
        }

        return LLM.instances[type];
    }
}

export const openrouterModel = LLM.getInstance('openrouter')
export const ollamaModel = LLM.getInstance('ollama')