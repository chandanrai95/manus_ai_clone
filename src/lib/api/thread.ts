import { Thread } from "@/store/threadSlice";
import { makeHttpReq } from "../helper/makeHttpReq";


export async function getThreads(userId: string): Promise<Thread[]> {
  try {
    console.log('getThreads --')
    const data = await makeHttpReq('GET', `threads?userId=${userId}`) as Thread[]
    return data
  } catch (error) {
    console.error('getThreads error:', error)
    return Promise.reject(error)
  }
}

export async function createThread(userId: string): Promise<Thread[]> {
  try {
    const data = await makeHttpReq('POST', `threads`, {
      userId
    }) as Thread[]
    return data
  } catch (error) {
    console.error('createThread error:', error)
    return Promise.reject(error)
  }
}

export type ChatMessage = {
  role: 'ai' | 'user',
  content: string,
  thinking: string,
  userId: string,
  threadId: string
}

export type ChatHistoryReturnType = { messages: ChatMessage[] }
export interface IFetchChatHistoryType { userId: string, threadId: string }

export async function fetchChatHistory(props: IFetchChatHistoryType): Promise<ChatHistoryReturnType> {
  const { userId, threadId } = props
  const data = await makeHttpReq('GET', `agent/chat-history?userId=${userId}&threadId=${threadId}`) as ChatHistoryReturnType
  return data
}