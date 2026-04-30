import { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import GraphVisualization from './components/GraphVisualization'
import { queryDrugInteractions, fetchInitialGraph, expandNode } from './services/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagic, faChevronUp, faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons'

function App() {
  const [graphData, setGraphData] = useState<any[]>([])
  const [summary, setSummary] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  // true when graphData contains only isolated seed nodes (no edges)
  const isInitialState = useRef(true)

  // Load isolated seed nodes on mount
  useEffect(() => {
    fetchInitialGraph().then((data) => {
      setGraphData(data)
      isInitialState.current = true
    }).catch(() => {
      // silently fail — blank canvas is acceptable if backend is unreachable
    })
  }, [])

  const mutation = useMutation({
    mutationFn: queryDrugInteractions,
    onSuccess: (data) => {
      setGraphData(data.result || [])
      setSummary(data.summary || '')
      isInitialState.current = false
    },
  })

  const expandMutation = useMutation({
    mutationFn: expandNode,
    onSuccess: (data) => {
      setGraphData(data)
      setSummary('')
      isInitialState.current = false
    },
  })

  const handleSearch = (q: string) => {
    mutation.mutate(q)
  }

  // Single click → sidebar (handled inside GraphVisualization, nothing to do here)
  // Double click → always expand, regardless of whether we're in seed or query state
  const handleNodeSelect = useCallback((nodeId: string, isDoubleClick: boolean) => {
    if (isDoubleClick) {
      expandMutation.mutate(nodeId)
    }
  }, [])

  const [summaryExpanded, setSummaryExpanded] = useState(false);

  return (
    <div className="relative h-screen overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
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
              className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
            />
            <button
              type="submit"
              disabled={mutation.isPending || !query.trim()}
              className="px-6 py-2 bg-[#3f3f46] text-white text-sm font-medium rounded-lg hover:bg-[#27272a] disabled:bg-slate-300 cursor-pointer disabled:cursor-not-allowed transition-colors"
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
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {graphData.length > 0 ? (
          <div className="absolute inset-0 p-4">
            {/* Expanding overlay — shown while a node click is loading */}
            {expandMutation.isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-lg">
                <p className="text-sm font-medium text-slate-600">Loading interactions…</p>
              </div>
            )}
            <GraphVisualization data={graphData} onNodeSelect={handleNodeSelect} />
            {!expandMutation.isPending && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 border border-slate-200 rounded-full shadow text-xs text-slate-500 pointer-events-none whitespace-nowrap">
                Single click to inspect · Double click to expand interactions
              </div>
            )}
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
        <div className="absolute inset-x-4 bottom-4 z-20 overflow-hidden rounded-t-lg rounded-b-md bg-white border border-zinc-200 shadow-[0_-10px_30px_rgba(15,23,42,0.16)]">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full cursor-pointer px-5 py-3 flex items-center justify-between bg-[#3f3f46] text-white hover:bg-[#27272a] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 transition-colors"
            aria-expanded={summaryExpanded}
            aria-controls="ai-summary-content"
          >
            <div className="flex min-w-0 items-center gap-3 text-left">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                <FontAwesomeIcon icon={faMagic} className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight">AI Summary</h3>
                {!summaryExpanded && (
                  <p className="mt-0.5 text-xs text-zinc-200">
                    View generated clinical context for this result
                  </p>
                )}
              </div>
            </div>
            <FontAwesomeIcon
              icon={summaryExpanded ? faChevronDown : faChevronUp}
              className="ml-4 h-4 w-4 flex-shrink-0 text-zinc-200"
            />
          </button>
          <div
            id="ai-summary-content"
            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: summaryExpanded ? '400px' : '0px' }}
          >
            <div className="px-5 pt-3 pb-4 overflow-y-auto border-t border-zinc-100" style={{ maxHeight: '400px' }}>
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
