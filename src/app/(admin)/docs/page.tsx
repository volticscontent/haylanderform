import { docsContent } from '@/lib/docs-content'

export default function DocsPage() {
  const content = docsContent.intro

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
          {content.title}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Guia completo de referência para administração e desenvolvimento do sistema.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-line text-zinc-600 dark:text-zinc-300">
          {content.content}
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
          <div className="p-6 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Para Desenvolvedores</h3>
            <p className="text-indigo-700 dark:text-indigo-300 text-sm">
              Entenda a arquitetura, endpoints da API e como estender as funcionalidades existentes.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-2">Para Administradores</h3>
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">
              Aprenda a gerenciar leads, realizar consultas no Serpro e configurar disparos de mensagens.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
