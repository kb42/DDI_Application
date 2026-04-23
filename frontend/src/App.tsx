import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import GraphVisualization from './components/GraphVisualization'
import { queryDrugInteractions } from './services/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagic, faChevronUp, faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons'

function App() {
  const [graphData, setGraphData] = useState<any[]>([])
  const [summary, setSummary] = useState<string>('')
  const [query, setQuery] = useState<string>('')

  const mutation = useMutation({
    mutationFn: queryDrugInteractions,
    onSuccess: (data) => {
      setGraphData(data.result || [])
      setSummary(data.summary || '')
    },
  })

  const handleSearch = (q: string) => {
    mutation.mutate(q)
  }

  const [summaryExpanded, setSummaryExpanded] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Search Bar */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-3 flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 whitespace-nowrap">Drug Interaction Explorer</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) handleSearch(query.trim()); }} className="flex-1 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about drug interactions..."
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={mutation.isPending || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
            >
              {mutation.isPending ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        {mutation.isError && (
          <div className="px-6 pb-2">
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">Error fetching data</div>
          </div>
        )}
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative min-h-0">
        {graphData.length > 0 ? (
          <div className="absolute inset-0 p-4">
            <GraphVisualization data={graphData} onNodeSelect={(nodeId) => console.log('Selected node:', nodeId)} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSearch} className="text-slate-400 w-16 h-16 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Ready to explore</h2>
              <p className="text-sm text-slate-500">Enter a query to visualize drug interactions</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom AI Summary - Expandable */}
      {summary && (
        <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-lg">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faMagic} className="text-blue-600 w-4 h-4" />
              <h3 className="text-sm font-semibold text-slate-900">AI Summary</h3>
            </div>
            <FontAwesomeIcon
              icon={summaryExpanded ? faChevronDown : faChevronUp}
              className="text-slate-400 w-4 h-4"
            />
          </button>
          <div
            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: summaryExpanded ? '400px' : '0px' }}
          >
            <div className="px-6 pb-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
