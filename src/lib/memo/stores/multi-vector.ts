import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from '@langchain/cohere';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio"
import { v4 as uuidv4 } from 'uuid';

import {
    ContextualCompressionRetriever
} from '@langchain/classic/retrievers/contextual_compression'
import { LLMChainExtractor } from "@langchain/classic/retrievers/document_compressors/chain_extract"
import { ChatOllama } from "@langchain/ollama";


async function loadRawDocs(documents: Document[]) {
    return documents.flat()
}

async function createParentDocs(props: { rawDocs: Document[], userId: string }) {
    const { rawDocs, userId } = props
    const parentSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 400 })
    const parentSplits = await parentSplitter.splitDocuments(rawDocs);

    return parentSplits.map((split) => {
        const chunkId = uuidv4();
        split.metadata.docType = "parent";
        split.metadata.chunkId = chunkId;
        split.metadata.parentId = chunkId;
        split.metadata.source = chunkId;
        split.metadata.userId = userId;

        return split
    })
}

async function createChildDocs(props: { parentDocs: Document[], userId: string }) {
    const { parentDocs, userId } = props
    const childSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 20 })
    const childSplits = await childSplitter.splitDocuments(parentDocs)

    return childSplits.map((split, i) => {
        const parentIndex = Math.floor(i / 4);
        const parentMetadata = parentDocs[parentIndex]?.metadata;

        split.metadata.docType = "child";
        split.metadata.parentId = parentMetadata?.chunkId;
        split.metadata.chunkId = `child-${parentMetadata?.chunkId}-${i}`;
        split.metadata.source = split.metadata.chunkId;
        split.metadata.userId = userId

        return split
    })

}

export async function docEmbeddingMultiVector(props: { allDocs: Document[], userId: string }) {
    const { allDocs, userId } = props

    if (!process.env.COHERE_API_KEY) {
        throw new Error("Missing COHERE_API_KEY");
    }

    if (!process.env.PINECONE_API_KEY) {
        throw new Error("Missing PINECONE_API_KEY");
    }

    if (!process.env.PINECONE_INDEX) {
        throw new Error("Missing PINECONE_INDEX");
    }


    const embeddings = new CohereEmbeddings({
        model: 'embed-english-v3.0',
        apiKey: process.env.COHERE_API_KEY
    });

    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY as string })
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX as string)

    console.log("Loading raw documents...");
    const rawDocs = await loadRawDocs(allDocs)

    console.log("Creating parent chunks...");
    const parentDocs = await createParentDocs({ rawDocs, userId })

    console.log("Creating child chunks...");
    const childDocs = await createChildDocs({ parentDocs, userId })

    console.log("Storing in Pinecone...");
    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5
    })

    //Store BOTH parent and child chunks in same index
    await vectorStore.addDocuments([...parentDocs, ...childDocs])
    console.log(`Single index: ${parentDocs.length} parent chunks + ${childDocs.length}`)
    console.log(`Total documents: ${parentDocs.length + childDocs.length}`)
}

export async function queryMultiVector(props: { userId: string, query: string }) {
    const {
        userId,
        query
    } = props;

    const kParents = 3

    const embeddings = new CohereEmbeddings({
        model: 'embed-english-v3.0',
        apiKey: process.env.COHERE_API_KEY
    })

    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY as string })
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX as string)

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        maxConcurrency: 5
    })

    // STEP 1: Child docs

    const childDocs = await vectorStore.similaritySearch(query, 6, {
        docType: "child", userId
    })


    const parentChunkIds = [...new Set(childDocs.map(c => c.metadata.parentId))];

    const compressor = LLMChainExtractor.fromLLM(
        new ChatOllama({
            model: 'qwen3',
            temperature: 0
        })
    )

    const retreiver = new ContextualCompressionRetriever({
        baseCompressor: compressor,
        baseRetriever: vectorStore.asRetriever({
            k: kParents,
            filter: {
                docType: "parent",
                source: { $in: parentChunkIds }
            }
        })
    })

    const retrievedDocs = await retreiver.invoke(query)

    return {
        query,
        retrievedDocs
    }
}

export async function testDocEmbeddingMultiVector(props: { allDocs: Document[], userId: string }) {
    const { allDocs, userId } = props

    if (!process.env.COHERE_API_KEY) {
        throw new Error("Missing COHERE_API_KEY");
    }

    if (!process.env.PINECONE_API_KEY) {
        throw new Error("Missing PINECONE_API_KEY");
    }

    if (!process.env.PINECONE_INDEX) {
        throw new Error("Missing PINECONE_INDEX");
    }


    const embeddings = new CohereEmbeddings({
        model: 'embed-english-v3.0',
        apiKey: process.env.COHERE_API_KEY,
        inputType: "search_document"
    });

    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY as string })
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX as string)

    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5
    })

    console.log("allDocs length:", allDocs.length);
    console.log("docs:", allDocs.map(d => ({
        content: d.pageContent,
        metadata: d.metadata
    })));

    await vectorStore.addDocuments(allDocs)
    console.log(`Total documents: ${allDocs.length}`)
}