'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
})

interface MermaidProps {
  chart: string
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current) {
        try {
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`
          const { svg } = await mermaid.render(id, chart)
          setSvg(svg)
        } catch (error) {
          console.error('Failed to render mermaid chart:', error)
        }
      }
    }

    renderChart()
  }, [chart])

  return (
    <div 
      ref={containerRef}
      className="mermaid-container my-6 flex justify-center bg-white dark:bg-white p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
