import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractRelevantDocument } from "./bm25Extractor";

export const formatDocumentsAsString = (documents: Document[]) => {
    return documents.map((doc) => doc?.pageContent).join("\n\n");
}


export async function bM25Retriever(document: string, query: string) {
    const newDoc = new Document({
        pageContent: document,
        metadata: {
            title: "user  :" + "DAILY_LOG_ARCHIVE"
        }
    })

    const docSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    const splitDocs = await docSplitter.splitDocuments([newDoc])

    const retreiver = BM25Retriever.fromDocuments([...splitDocs], { k: 4 })

    const data = await retreiver.invoke(query)
    const docToString = formatDocumentsAsString(data)

    const filteredData = await extractRelevantDocument(query, docToString)
    
    return filteredData
}