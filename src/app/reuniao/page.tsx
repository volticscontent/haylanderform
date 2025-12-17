import { Link2Off } from 'lucide-react'

export default function ReuniaoRootPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse">
            <Link2Off className="w-12 h-12 text-zinc-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Link Incompleto
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Para agendar sua reunião, utilize o <strong>link personalizado</strong> que enviamos para o seu WhatsApp ou E-mail.
        </p>
        
        <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">
            Haylander CRM &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
