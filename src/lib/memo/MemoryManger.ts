import { promises as fs } from 'node:fs';
import path from 'node:path';
import { appendAFile, createAFile, emptyAFile, readAFile, resolveSafePath } from './tools/fileSystemTools';

export function todayDateString(now = new Date()) {
    return now.toISOString().slice(0, 10);
}

export function nowTimeString(now = new Date()) {
    return now.toTimeString().slice(0, 8);
}

async function fileExists(filePath: string) {
    try {
        await fs.access(filePath)
        return true;
    } catch (error) {
        return false;
    }
}

export interface UserData {
    userId: string,
    threadId: string
}

export class MemoryManager {
    private memoryRoot;
    private userData: UserData

    constructor(memoryRoot: string, userData: { userId: string, threadId: string }) {
        this.memoryRoot = path.resolve(memoryRoot)
        this.userData = userData
    }

    async emptyAFileContent() {
        await emptyAFile(this.memoryRoot, this.todayLogPath())
    }

    resolve(relativePath: string) {
        return resolveSafePath(this.memoryRoot, relativePath)
    }

    async init() {
        await this.ensureCoreFiles();
    }

    async ensureCoreFiles() {
        const defaults = [
            {
                path: `${this.memoryRoot}/MEMORY-${this.userData.userId}.md`,
                content: "# LONGTERM MEMORY\n\n"
            },
            {
                path: `${this.memoryRoot}/archive/DAILY_LOG_ARCHIVE-${this.userData.userId}.md`,
                content: "# DAILY_LOG_ARCHIVE\n\n"
            },

            // Identity for the agent
            // eg: Behave-like a coderAgent
            // eg: Behave-like a market Researcher agent
            {
                path: `${this.memoryRoot}/system_prompt-${this.userData.userId}.md`,
                content: `# SYSTEM PROMPT\n\n
                You are assistant number 1=Assistant-1.
                
Collaborating with Assistant-2
which has full capabilities for:
    - Web Search
    - Coding: Write and explain complex code.
    - Research
    - Deep Research
    - Spawn subAgent for heavier Task

    IF the user Ask you a question that you can not handle
    respond only with "<think>__TRANSFER__ + the right context</think> to give to assistant-2, so it can help the user; assistant-2 do not have a memory"
    
    If you need clarification from user before delegating to Assistant-2 gather all clarification then respond with "<think>__TRANSFER__ + the right context</think> to give assistant-2 so will can help the user; assistant-2 do not have a memory"

    Note: your transfer message will be enclosed in think tag like this
    eg: <think>__TRANSFER__ + only the context</think>


Follow the policy and be helpful.`
            }
        ];

        this.ensureTodayLog()
        for (const file of defaults) {
            const fullPath = this.resolve(file.path);
            if (!await fileExists(fullPath)) {
                await createAFile(this.memoryRoot, file.path, file.content)
            }
        }
    }

    todayLogPath(now = new Date()) {
        return `${todayDateString(now)}-${this.userData.userId}-${this.userData.threadId}.md`
    }

    async ensureTodayLog(now = new Date()) {
        const relativePath = this.todayLogPath(now);
        const fullPath = this.resolve(relativePath);

        if (!await fileExists(fullPath)) {
            await createAFile(this.memoryRoot, relativePath, `# Daily Log ${relativePath}\n\n`)
        }

        return relativePath
    }

    async logInteraction(role: string, content: string, now = new Date()) {
        const logPath = await this.ensureTodayLog(now);
        const chunk = `## [Time: ${nowTimeString(now)}] Role: ${role}\n${content}\n\n`
        await appendAFile(this.memoryRoot, logPath, chunk)
        return logPath
    }

    async logToArchive(role: string, content: string, now = new Date()) {
        const logPath = `${this.memoryRoot}/DAILY_LOG_ARCHIVE-${this.userData.userId}.md`;
        const chunk = `## [Time: ${nowTimeString(now)}] Role: ${role}\n${content}\n\n`
        await appendAFile(this.memoryRoot, logPath, chunk)
        return logPath
    }


    async readArchiveFile() {
        try {
            const data = await readAFile(this.memoryRoot, `DAILY_LOG_ARCHIVE-${this.userData.userId}.md`)

            return {
                data,
                exist: true
            }
        } catch (error) {
            return {
                exist: false
            }
        }
    }

    async readToday(now = new Date()) {
        const logPath = await this.ensureTodayLog(now);
        return readAFile(this.memoryRoot, logPath);
    }

    async readMemoryFiles(name: string) {
        const relativePath = `${this.memoryRoot}/${name}`;
        const fullPath = this.resolve(relativePath)
        if (!await fileExists(fullPath)) {
            await createAFile(this.memoryRoot, relativePath, "");
        }

        return readAFile(this.memoryRoot, relativePath)
    }
}