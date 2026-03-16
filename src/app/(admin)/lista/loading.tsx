export default function Loading() {
  return (
    <div className="space-y-6 h-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-[calc(100vh-140px)] p-4">
        <div className="space-y-4">
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-96 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="h-10 w-32 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-zinc-50 dark:bg-zinc-800/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
