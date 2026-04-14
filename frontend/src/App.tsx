import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import SearchInput from './components/SearchInput'
import GraphVisualization from './components/GraphVisualization'
import { queryDrugInteractions } from './services/api'

function App() {
  const [graphData, setGraphData] = useState<any[]>([])
  const [summary, setSummary] = useState<string>('')

  const mutation = useMutation({
    mutationFn: queryDrugInteractions,
    onSuccess: (data) => {
      setGraphData(data.result || [])
      setSummary(data.summary || '')
    },
  })

  const handleSearch = (query: string) => {
    mutation.mutate(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4">
        <SearchInput
          onSearch={handleSearch}
          isLoading={mutation.isPending}
        />

        {mutation.isError && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Error: {mutation.error instanceof Error ? mutation.error.message : 'Failed to fetch data'}
            </p>
          </div>
        )}

        {mutation.isSuccess && graphData.length === 0 && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              No results found. Try a different query.
            </p>
          </div>
        )}

        {graphData.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="w-full" style={{ height: 'calc(100vh - 400px)' }}>
              <GraphVisualization
                data={graphData}
                onNodeSelect={(nodeId) => console.log('Selected node:', nodeId)}
              />
            </div>

            {summary && (
              <details className="max-w-4xl mx-auto w-full bg-white rounded-lg shadow-sm border border-slate-200">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50">
                  View AI Summary
                </summary>
                <div className="px-4 py-3 text-sm text-slate-600 border-t border-slate-200">
                  {summary}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
