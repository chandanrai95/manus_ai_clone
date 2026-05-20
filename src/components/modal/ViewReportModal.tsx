"use client"

import React from "react";
import { Button } from "../ui/button";
import type { AppDispatch, RootState } from '@/store';
import { useDispatch, useSelector } from "react-redux";


import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { BaseModal } from "./BaseModal";
import { toggleViewReportModal } from "@/store/chatSlice";

export const ViewReportModal = () => {
    const dispatch = useDispatch<AppDispatch>()

    const { reportModal } = useSelector((state: RootState) => state.chat)

    return (
        <div>
            <BaseModal
                open={reportModal.display}
                onOpenChange={() => dispatch(toggleViewReportModal())}
                title="Report"
                description=""
                width={800}
                height={600}
            >
                <div
                    className="grid gap-3"
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ node, ...props}) => {
                                <a className="text-blue-500 underline hover:text-blue-700" {...props} />
                            },
                            ul: ({ node, ...props}) => {
                                <ul className="list-disc ml-6 mb-2" {...props} />
                            },
                            ol: ({ node, ...props}) => {
                                <ol className="list-decimal ml-6 mb-2" {...props} />
                            },
                            li: ({ node, ...props}) => <li className="mb-1" {...props} />,
                            h1: ({ node, ...props}) => <h1 className="text-2xl font-bold text-gray-800 my-2" {...props} />,
                            h2: ({ node, ...props}) => <h1 className="text-xl font-semibold text-gray-700 my-2" {...props} />,
                            strong: ({ node, ...props}) => <strong className=" font-bold text-gray-700" {...props} />
                        }}
                    >
                        {`${reportModal?.content}`}
                    </ReactMarkdown>
                </div>
            </BaseModal>
        </div>
    )
}