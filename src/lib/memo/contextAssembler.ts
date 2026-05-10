import { Document } from "langchain";
import { MemoryManager, UserData } from "./MemoryManger";
import { compressSTMTool } from "./tools/STMCompressTools";
import { docEmbeddingMultiVector, queryMultiVector } from "./stores/multi-vector";
import { bM25Retriever, formatDocumentsAsString } from "./stores/BM25";


function estimateTokens(text: string) {
    const words = text.trim() ? text.trim().split(/s+/).length : 0;
    return Math.ceil(words * 1.3);
}

export class ContextAssembler {
    private memory: MemoryManager
    private modelContextLimit: number
    private userData: UserData

    constructor(memoryManager: MemoryManager, modelContextLimit: number, userData: UserData) {
        this.memory = memoryManager
        this.modelContextLimit = modelContextLimit
        this.userData = userData
    }

    async assemble(userQuery: string, options = {}) {
        const system_prompt = await this.memory.readMemoryFiles(`system_prompt-${this.userData.userId}.md`);
        const userProfile = await this.memory.readMemoryFiles(`MEMORY-${this.userData.userId}.md`);
        const todayLog = await this.memory.readToday(new Date());

        let relevantLongTermMemory = '';
        // fetch data from Vector DBs (pinecone and bm25)
        const archiveLog = await this.memory.readArchiveFile()

        const vectorData = await queryMultiVector({ userId: this.userData.userId, query: userQuery })
        const docToString = formatDocumentsAsString(vectorData?.retrievedDocs)
        relevantLongTermMemory += `\n\n<data_retreived_from_vector_db> \n${docToString}\n\n</data_retreived_from_vector_db>`
        if (archiveLog.exist) {
            const bm25Data = await bM25Retriever(archiveLog.data as string, userQuery)
            relevantLongTermMemory += `\n\n<data_retreived_from_daily_log_archive> ${bm25Data}</data_retreived_from_daily_log_archive>`
        }

        // END fetch data from Vector DBs (pinecone and bm25)

        console.log('relevantLongTermMemory ::', {relevantLongTermMemory, docToString})

        const fixedLayers = [
            `# System Layer\n${system_prompt}`,
            `# Profile Later\n${userProfile}`,
            `# Relevant LTM Layer\n${relevantLongTermMemory || "No relevant long-term memory exist."}`,
            `# Recent STM Layer\n${todayLog}`
        ]

        const fixedText = fixedLayers.join("\n\n");

        const finalPrompt = `${fixedText}\n\n# New Input\n${userQuery}`

        const numberOfTokens = estimateTokens(finalPrompt)

        if (numberOfTokens > this.modelContextLimit) {
            //Compress
            const compressData =  await compressSTMTool.invoke({ message: finalPrompt }) as string

            await this.memory.emptyAFileContent();
            const now = new Date();
            await this.memory.logToArchive("Assistant", compressData, now)

            const docToEmbed = new Document({
                pageContent: compressData,
                metadata: { title: "user daily log summary"}
            })

            await docEmbeddingMultiVector({
                userId: this.userData.userId,
                allDocs: [docToEmbed]
            })

            
            console.log('===================== finish compression ===============')
        }

        return {
            prompt: finalPrompt,
            diagnostics: {
                estimateTokens: numberOfTokens
            }
        }
    }
}