import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import SearchInput from './components/SearchInput'
import GraphVisualization from './components/GraphVisualization'
import { queryDrugInteractions } from './services/api'

function App() {
  const [graphData, setGraphData] = useState<any[]>([])
  const [lastQuery, setLastQuery] = useState<string>('')

  const mutation = useMutation({
    mutationFn: queryDrugInteractions,
    onSuccess: (data) => {
      setGraphData(data.result || [])
    },
  })

  const handleSearch = (query: string) => {
    setLastQuery(query)
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

        <div className="w-full" style={{ height: 'calc(100vh - 280px)' }}>
          {graphData.length > 0 && (
            <GraphVisualization
              data={graphData}
              queryContext={lastQuery}
              onNodeSelect={(nodeId) => console.log('Selected node:', nodeId)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
