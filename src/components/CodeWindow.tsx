'use client'

import React from 'react'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface CodeWindowProps {
  code: string
  language?: string
  title?: string
}

export default function CodeWindow({ code, language = 'text', title }: CodeWindowProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple syntax highlighting simulation (very basic)
  const renderCode = () => {
    // This is a placeholder. For real highlighting we'd need Prism or Highlight.js
    // But we can do some simple coloring for JSON/TS keys/values
    return code
  }

  const isPayload = language.toLowerCase() === 'json'

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#1e1e1e] shadow-lg">
      {/* Header (Mac-style) */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#252526] border-b border-zinc-800 select-none">
        <div className="flex gap-1.5 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        </div>
        
        <div className="font-mono text-xs text-zinc-400 flex items-center gap-2">
          {isPayload ? (
            <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border border-blue-500/20">
              Payload
            </span>
          ) : (
             <span className="uppercase text-[10px] tracking-wider font-bold opacity-70">
               {language}
             </span>
          )}
          {title && <span className="text-zinc-500">| {title}</span>}
        </div>

        <button 
          onClick={handleCopy}
          className="ml-auto p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
          title="Copiar código"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-x-auto relative group">
        <pre className={`text-sm font-mono leading-relaxed ${isPayload ? 'text-blue-100' : 'text-zinc-300'}`}>
          <code>{renderCode()}</code>
        </pre>
      </div>
      
      {/* Footer/Status Bar simulation */}
      <div className="px-4 py-1.5 bg-[#007acc] text-white text-[10px] font-mono flex justify-between opacity-90">
        <span>UTF-8</span>
        <span>{language.toUpperCase()}</span>
      </div>
    </div>
  )
}
