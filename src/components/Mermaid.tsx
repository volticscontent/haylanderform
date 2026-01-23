'use client'

import { useEffect, useState } from 'react'

interface MermaidProps {
  chart: string
}

export default function Mermaid({ chart }: MermaidProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Reset state when chart changes
    setError(null)
    setIsLoading(true)
    
    let isMounted = true

    const renderChart = async () => {
      try {
        // Dynamic import for better bundle size
        const mermaid = (await import('mermaid')).default
        
        // Detect current theme
        const isDark = document.documentElement.classList.contains('dark')
        
        // Initialize with theme
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          // Adjust theme variables if needed for better contrast
          themeVariables: isDark ? {
            darkMode: true,
            background: '#18181b', // zinc-900
            primaryColor: '#3b82f6',
            lineColor: '#a1a1aa',
          } : undefined
        })

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`
        
        // Render
        const { svg } = await mermaid.render(id, chart)
        
        if (isMounted) {
          setSvg(svg)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to render mermaid chart:', err)
        if (isMounted) {
          setError('Não foi possível renderizar o diagrama.')
          setIsLoading(false)
        }
      }
    }

    // Small delay to ensure DOM is ready and theme is applied
    const timeoutId = setTimeout(() => {
        renderChart()
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [chart])

  if (error) {
    return (
      <div className="my-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm text-center">
        {error}
        <pre className="mt-2 text-xs overflow-auto text-left opacity-70 max-h-32">
          {chart}
        </pre>
      </div>
    )
  }

  return (
    <div 
      className={`mermaid-container my-6 flex justify-center p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto transition-colors duration-300 ${
        isLoading ? 'bg-zinc-50 dark:bg-zinc-900 min-h-[200px] items-center' : 'bg-white dark:bg-zinc-950'
      }`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 text-zinc-400 animate-pulse">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Gerando diagrama...</span>
        </div>
      ) : (
        <div 
            className="w-full h-full flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
      )}
    </div>
  )
}
