"use client";

import dynamic from "next/dynamic"
import { useEffect, useState } from "react";


// Dynamically import
const AgentComputer = dynamic(
  () => import("@/components/chat/chatbox/agent-ui/AgentComputer"),
  { ssr: false }
)

function AgentComputerWrapper() {
  const [ready, setReady] = useState(false)

  // Wait for client hyderation
  useEffect(() => {
    setReady(true);
  },[])

  if (!ready) return null; // prevent hyderation mismatch

  // Render the actual client component
  return <AgentComputer />;

}

export default AgentComputerWrapper