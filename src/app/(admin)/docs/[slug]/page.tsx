import { docsContent } from '@/lib/docs-content'
import { notFound } from 'next/navigation'
import Mermaid from '@/components/Mermaid'
import CodeWindow from '@/components/CodeWindow'
import { getDatabaseSchema } from '@/lib/db-introspection'
import { Database } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug

  // Simple markdown-like parser for the content
  const renderContent = (text: string) => {
    const lines = text.split(/\r?\n/)
    const elements: React.ReactNode[] = []
    let currentMermaidBlock: string[] | null = null
    let currentCodeBlock: { language: string, content: string[] } | null = null

    lines.forEach((line, i) => {
      // Use regex for more robust matching of whitespace and content
      const mermaidStart = line.match(/^\s*```.*mermaid/i)
      const codeStart = line.match(/^\s*```(\w*)/)
      const codeEnd = line.match(/^\s*```\s*$/)
      const h3Match = line.match(/^\s*###\s+(.+)$/)
      const h2Match = line.match(/^\s*##\s+(.+)$/)
      const bulletBoldMatch = line.match(/^\s*-\s*\*\*(.+)\*\*(.*)$/)
      const bulletMatch = line.match(/^\s*-\s+(.+)$/)
      const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/)
      
      const trimmed = line.trim()

      // Handle Mermaid Blocks
      if (mermaidStart) {
        currentMermaidBlock = []
        return
      }
      
      // Safety valve: If we hit a header while in a mermaid block, force close it
      if (currentMermaidBlock !== null && (h2Match || h3Match)) {
        elements.push(
          <Mermaid key={`mermaid-${i}-forced`} chart={currentMermaidBlock.join('\n')} />
        )
        currentMermaidBlock = null
        // Continue to process this line as a normal header
      }

      if (currentMermaidBlock !== null && codeEnd) {
        elements.push(
          <Mermaid key={`mermaid-${i}`} chart={currentMermaidBlock.join('\n')} />
        )
        currentMermaidBlock = null
        return
      }
      if (currentMermaidBlock !== null) {
        // Remove indentation from mermaid lines to prevent parsing errors
        currentMermaidBlock.push(trimmed)
        return
      }

      // Handle Generic Code Blocks (IDE Style)
      if (codeStart && !mermaidStart && currentCodeBlock === null) {
        const language = codeStart[1] || 'text'
        currentCodeBlock = { language, content: [] }
        return
      }
      if (currentCodeBlock !== null && codeEnd) {
        elements.push(
          <CodeWindow 
            key={`code-${i}`} 
            code={currentCodeBlock.content.join('\n')} 
            language={currentCodeBlock.language}
          />
        )
        currentCodeBlock = null
        return
      }
      if (currentCodeBlock !== null) {
        currentCodeBlock.content.push(line)
        return
      }

      // Normal Markdown Rendering
      if (h3Match) {
        const title = h3Match[1].trim()
        const id = title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

        elements.push(
            <h3 key={i} id={id} className="text-xl font-semibold mt-6 mb-3 text-zinc-900 dark:text-white scroll-mt-20 group">
                {title}
                <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-indigo-600 transition-opacity">#</a>
            </h3>
        )
        return
      }
      if (h2Match) {
        const title = h2Match[1].trim()
        
        // Auto-generate ID from title
        const id = title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

        const className = "text-2xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white scroll-mt-20 group"

        elements.push(
          <h2 key={i} id={id} className={className}>
            {title}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-indigo-600 transition-opacity">#</a>
          </h2>
        )
        return
      }
      if (bulletBoldMatch) {
        elements.push(
          <li key={i} className="ml-4 list-disc text-zinc-600 dark:text-zinc-300 mb-2">
            <strong className="text-zinc-900 dark:text-zinc-100">{bulletBoldMatch[1]}</strong>{bulletBoldMatch[2]}
          </li>
        )
        return
      }
      if (bulletMatch) {
        elements.push(
          <li key={i} className="ml-4 list-disc text-zinc-600 dark:text-zinc-300 mb-2">
            {bulletMatch[1]}
          </li>
        )
        return
      }
      if (numberedMatch) {
        elements.push(
          <div key={i} className="ml-4 mb-2 text-zinc-600 dark:text-zinc-300 font-medium">
            {trimmed}
          </div>
        )
        return
      }
      if (trimmed === '') {
        elements.push(<br key={i} />)
        return
      }
      
      // Inline code style for API paths
      if (trimmed.includes('`')) {
         const parts = trimmed.split('`')
         elements.push(
           <p key={i} className="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
             {parts.map((part, index) => 
               index % 2 === 1 
                 ? <code key={index} className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">{part}</code>
                 : part
             )}
           </p>
         )
         return
      }

      elements.push(
        <p key={i} className="mb-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {trimmed}
        </p>
      )
    })

    return elements
  }

  // Special handling for dynamic database documentation
  if (slug === 'diagrama-dados') {
    const schema = await getDatabaseSchema()
    
    return (
      <div className="max-w-4xl mx-auto pb-10">
         {/* Introdução (Primeiro item visível) */}
         <div id="intro" className="mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    Diagrama de Dados
                </h1>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Visualização unificada da estrutura técnica e regras de negócio.
            </p>
        </div>

        {/* Bot e Dados */}
        <section id="bot-dados" className="scroll-mt-20 mb-12">
            <div className="prose dark:prose-invert max-w-none">
                {renderContent(docsContent['diagrama-dados'].content)}
            </div>
        </section>

        {/* Esquema SQL */}
        <section id="esquema-sql" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="w-6 h-6" />
                Esquema SQL (Tempo Real)
            </h2>
            <div className="space-y-8">
                {schema.map((table) => (
                    <div key={table.table_name} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="text-zinc-400 text-sm font-normal">Tabela:</span>
                                {table.table_name}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Coluna</th>
                                        <th className="px-6 py-3 font-medium">Tipo</th>
                                        <th className="px-6 py-3 font-medium">Nulável</th>
                                        <th className="px-6 py-3 font-medium">Padrão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {table.columns.map((col) => (
                                        <tr key={col.column_name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-200 font-mono">
                                                {col.column_name}
                                            </td>
                                            <td className="px-6 py-3 text-blue-600 dark:text-blue-400 font-mono">
                                                {col.data_type}
                                            </td>
                                            <td className="px-6 py-3">
                                                {col.is_nullable === 'YES' ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                        Sim
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                        Não
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs max-w-xs truncate" title={col.column_default || ''}>
                                                {col.column_default || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </div>
    )
  }

  const content = docsContent[slug as keyof typeof docsContent]

  if (!content) {
    notFound()
  }

  // Handle forms documentation with anchor links
  if (slug === 'forms') {
      return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <div className="mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                    <span>Docs</span>
                    <span>/</span>
                    <span className="text-zinc-900 dark:text-zinc-200 font-medium capitalize">Formulários</span>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {content.title}
                </h1>
            </div>

            <div className="prose dark:prose-invert max-w-none">
                {renderContent(content.content)}
            </div>
        </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          <span>Docs</span>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-200 font-medium capitalize">{slug.replace('-', ' ')}</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          {content.title}
        </h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {renderContent(content.content)}
      </div>
    </div>
  )
}
