
import ECACForm from "@/components/ECACForm";
import { LockKeyhole } from "lucide-react";

export default function CadastroECACPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockKeyhole className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Cadastro e-CAC</h1>
          <p className="text-blue-100">
            Cadastre-se para acessar os serviços do Portal e-CAC com segurança.
          </p>
        </div>
        
        <div className="p-8">
          <ECACForm />
        </div>
      </div>
      
      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        &copy; {new Date().getFullYear()} Haylander Martins Contabilidade. Todos os direitos reservados.
      </p>
    </div>
  );
}
