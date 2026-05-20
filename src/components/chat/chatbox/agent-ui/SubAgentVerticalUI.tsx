"use client"

import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, ChevronDown, ChevronUpIcon, Loader2, } from "lucide-react";
import { cn } from '@/lib/utils';
import { ConvertMarkdownToText } from '../ConvertToMarkdown';

interface AgentData {
  sub_agent_name: string;
  content?: string;
  loading?: boolean;
}

function SubAgentVerticalUI({ agents }: { agents: AgentData[] }) {
  if (!agents || agents.length === 0) return null;

  return (
    <div className='my-6 mx-auto animate-in slide-in-from-left-2 duration-500'>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className='bg-purple-100 p-1 rounded'>
          <Sparkles size={16} className='text-purple-500' />
        </div>
        <span className='text-sm font-semibold text-gray-600'>
          Specialist Agents: {agents.length}
        </span>
      </div>

      {/* Vertical list */}
      <div className='flex flex-col gap-3'>
        {agents.map((agent) => {
          return <SubAgentToggleCard key={agent?.sub_agent_name} agent={agent} />
        })}
      </div>
    </div>
  )
}


const SubAgentToggleCard = ({ agent }: { agent: AgentData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(agent.loading);

  useEffect(() => {
    setIsProcessing(agent.loading)
  }, [agent.loading]);

  const handleToggle = () => {
    if (!agent.content && !isProcessing) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false)
      }, 2000); // simulate processing
    }
    setIsExpanded((prev) => !prev);
  }

  return (
    <div
      className={cn(
        "flex flex-col border rounded-xl shadow-sm transition-all cursor-pointer overflow-hidden ",
        "bg-white border-gray-200 hover:shadow-md"
      )}
      onClick={handleToggle}
    >
      <div className='flex w-full flex-row justify-between items-center p-2 shadow-sm border shrink-0 gap-2'>
        <div className='p-2 bg-gray-100 rounded-md relative'>
          <Cpu size={32} />
          {/* {
            <Loader2 size={18} className='text-blue-500 absolute animate-spin -top-2 -right-2' />
          } */}
          {/* <span className='absolute -top-1 -right-1 w-3 h-3 border-2 border-gray-200 border-t-blue-500 animate-spin rounded-full'></span> */}

        </div>
        <h4 className='flex-1 text-sm font-bold text-gray-800 truncate'>
          {agent.sub_agent_name}
        </h4>
        <div className='flex shrink-0'>
          {
            isExpanded ? <ChevronUpIcon size={25} /> : <ChevronDown size={25} />
          }
        </div>

      </div>
      <div
        className={
          cn('w-full p-3 bg-gray-50 border-t border-gray-200 text-gray-700 text-xs',
            isExpanded ? 'block' : 'hidden'
          )
        }
      >
        <ConvertMarkdownToText text={agent?.content || 'No content available.'} />
      </div>

    </div >
  )
}

export default SubAgentVerticalUI