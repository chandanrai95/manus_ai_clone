import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { MemoryManager } from "@/lib/memo/MemoryManger";
import { queryMultiVector, testDocEmbeddingMultiVector } from "@/lib/memo/stores/multi-vector";
import { NextResponse } from "next/server";
import path from "path";

// export async function GET(req: Request) {
//     try {
//         const rootDir = process.cwd();
//         const fullRootDir = path.resolve(rootDir, 'public', 'memory')
//         const memoManager = new MemoryManager(fullRootDir)
//         memoManager.init()

//         return NextResponse.json({ msg: "h1" })
//     } catch (error) {

//     }
// }

// export async function POST(req: Request) {
//     try {
//         const rootDir = process.cwd();
//         const fullRootDir = path.resolve(rootDir, 'public', 'memory')
//         const memoManager = new MemoryManager(fullRootDir)
//         memoManager.init()

//         memoManager.logInteraction("User", "Hello, I'm chandan")

//         memoManager.logInteraction("Assistant", "How can I help you today")

//         return NextResponse.json({ msg: "h1" })
//     } catch (error) {

//     }
// }

// export async function PATCH(req: Request) {
//     try {
//         const rootDir = process.cwd();
//         const fullRootDir = path.resolve(rootDir, 'public', 'memory')
//         const memoManager = new MemoryManager(fullRootDir)
//         memoManager.init()

//         memoManager.logToArchive("User", "Hello, I'm chandan")

//         memoManager.logToArchive("Assistant", "How can I help you today")

//         return NextResponse.json({ msg: "h1" })
//     } catch (error) {

//     }
// }


export async function GET(req: Request) {
    try {
        const llm = LLM.getInstance("openrouter")
        const memoryAgent = await createMemoryAgent({
            model: llm,
        })

        // const { assistantText } = await memoryAgent.run_agent('Hello')
        // const { assistantText } = await memoryAgent.run_agent('What is my name?')
        // const { assistantText } = await memoryAgent.run_agent('I am building a multi-agent AI system using LangGraph ,ollama and openrouter. My current issue is deciding when to use reasoning models versus reactive models.')
        // const { assistantText } = await memoryAgent.run_agent('What architectural challenge am I currently facing?')
        const { assistantText } = await memoryAgent.run_agent('What is my preferred programming language?')
        // const { assistantText } = await memoryAgent.run_agent('My favorite database is PostgresSQL.');
        // const { assistantText } = await memoryAgent.run_agent('Actually, I change my mind. My favorite databse is MongoDB noew.');
        // const { assistantText } = await memoryAgent.run_agent('Which is my favourite database?');
        // const { assistantText } = await memoryAgent.run_agent('Which is my favourite database?');
        // const { assistantText } = await memoryAgent.run_agent('Which db i need to use for this project?');
//         const { assistantText } = await memoryAgent.run_agent(`
// I am designing an AI-powered essay grading system.
// It includes three agents: generator, reflection and revision agent.
// The generator writes the essay, the reflection agent critiques it,
// and the revision agent improves it based on structured feedback.
// My goal is to optimize convergence speed while minimizing token usage.
// Please summarize this and remember my goal
//         `);

        return NextResponse.json({ msg: assistantText })
    } catch (error) {

        console.error('GET ---', error)
    }
}

// export async function GET(req: Request) {
//     try {
//         const res = await queryMultiVector({ query: 'Which is my favourite database?', userId: 'chan-memo-123009'})
//         return NextResponse.json({ msg: res })
//     } catch (error) {

//         console.error('GET ---', error)
//     }
// }