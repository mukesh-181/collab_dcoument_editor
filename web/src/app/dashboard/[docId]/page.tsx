export default async function DocumentPage(props: { params: Promise<{ docId: string }> }) {
  const params = await props.params;
  
  return (
    <div className="max-w-4xl mx-auto py-10 flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">/dashboard/{params.docId}</h1>
      <div className="mt-6 flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Empty Document Creation Area</p>
      </div>
    </div>
  )
}
