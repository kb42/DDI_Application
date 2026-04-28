import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faBook, faTimes } from '@fortawesome/free-solid-svg-icons';

interface GraphVisualizationProps {
  data: any[];
  onNodeSelect?: (nodeId: string) => void;
}

const GraphVisualization = ({ data, onNodeSelect }: GraphVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeEdges, setNodeEdges] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance if it exists
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Wait for next tick to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      // Initialize Cytoscape instance
      const cy = cytoscape({
        container: containerRef.current,
        elements: transformDataToElements(data),
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#3b82f6',
              'label': 'data(label)',
              'color': '#ffffff',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '11px',
              'font-weight': 'bold',
              'text-wrap': 'wrap',
              'text-max-width': '80px',
              'width': '70px',
              'height': '70px',
              'border-width': 2,
              'border-color': '#1e40af',
              'text-outline-width': 2,
              'text-outline-color': '#000000',
              'text-outline-opacity': 0.3,
            }
          },
          // Parent nodes are for grouping by severity and can be invisible
          {
            selector: 'node:parent',
            style: {
              'background-opacity': 0,
              'border-width': 0,
            }
          },
          {
            selector: 'node[type="Drug"]',
            style: {
              'background-color': '#3b82f6',
              'border-color': '#1e40af',
              'shape': 'ellipse',
              'color': '#ffffff',
            }
          },
          {
            selector: 'node[type="Diagnosis"]',
            style: {
              'background-color': '#8b5cf6',
              'border-color': '#6d28d9',
              'shape': 'round-rectangle',
              'color': '#ffffff',
              'width': '90px',
              'height': '90px',
              'font-size': '10px',
              'text-max-width': '85px',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 4,
              'line-color': '#94a3b8',
              'source-arrow-color': '#94a3b8',
              'source-arrow-shape': 'triangle',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(severity)',
              'font-size': '12px',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.9,
              'text-background-padding': '4px',
              'color': '#1e293b',
              'font-weight': 'bold',
            }
          },
          // Autorotate labels to prevent overlap: https://stackoverflow.com/a/53737071
          {
            selector: "edge[label]",
            style: {
              'text-rotation': 'autorotate',
            }
          },
          {
            selector: 'edge[severity="Minor"]',
            style: {
              'line-color': '#22c55e',
              'source-arrow-color': '#22c55e',
              'target-arrow-color': '#22c55e',
              'width': 3,
              'z-index': 1,
            }
          },
          {
            selector: 'edge[severity="Moderate"]',
            style: {
              'line-color': '#f59e0b',
              'source-arrow-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              'width': 5,
              'z-index': 2,
            }
          },
          {
            selector: 'edge[severity="Major"]',
            style: {
              'line-color': '#ef4444',
              'source-arrow-color': '#ef4444',
              'target-arrow-color': '#ef4444',
              'width': 6,
              'z-index': 3,
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 4,
              'border-color': '#8b5cf6',
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          animationDuration: 500,
          padding: 80,
          nodeRepulsion: 12000,
          idealEdgeLength: 150,
          edgeElasticity: 80,
          gravity: 0.05,
        },
      });

      // Group nodes by severity using parent nodes
      const usedSeverities = new Set<string>();

      cy.edges().forEach(edge => {
        const sev = edge.data('severity');
        if (sev) usedSeverities.add(sev);
      });

      usedSeverities.forEach(sev => {
        if (cy.getElementById(sev).empty()) {
          cy.add({ data: { id: sev } });
        }
      });

      cy.nodes().forEach(node => {
        const edges = node.connectedEdges();

        let group = 'Unknown';

        if (edges.length > 0) {
          group = edges[0].data('severity');
          if (usedSeverities.has(group)) {
            node.move({ parent: group });
          }
        }
      });

      cy.layout({
        name: 'cose',
        animate: true,
        padding: 50,
      }).run();

      // Handle node selection - use direct event handler for reliability
      cy.on('tap', 'node', (event) => {
        event.preventDefault();
        const node = event.target;
        const nodeId = node.id();

        // Get all edges connected to this node immediately
        const connectedEdges = cy.edges().filter((edge: any) => {
          return edge.data('source') === nodeId || edge.data('target') === nodeId;
        });

        const edgesData = connectedEdges.map((edge: any) => edge.data());

        // Update state in a single batch to ensure reliability
        setSelectedNode(nodeId);
        setNodeEdges(edgesData);

        if (onNodeSelect) {
          onNodeSelect(nodeId);
        }
      });

      // Handle edge hover for tooltip
      cy.on('mouseover', 'edge', (event) => {
        const edge = event.target;
        const renderedPosition = edge.renderedMidpoint();
        setTooltipPos({ x: renderedPosition.x, y: renderedPosition.y });
        setHoveredEdge(edge.data());
      });

      cy.on('mouseout', 'edge', () => {
        setHoveredEdge(null);
      });

      cyRef.current = cy;
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [data, onNodeSelect]);

  return (
    <div className="relative w-full h-full flex gap-4">
      <div
        ref={containerRef}
        className={`${selectedNode ? 'flex-1 min-w-0' : 'w-full'} h-full bg-slate-50 rounded-lg border border-slate-200`}
      />

      {/* Edge Hover Tooltip */}
      {hoveredEdge && (
        <div
          className="absolute bg-white rounded-lg shadow-xl border border-slate-200 p-4 pointer-events-none z-50 max-w-sm"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          {/* Severity + Polarity + Category Badges */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                hoveredEdge.severity === 'Major'
                  ? 'bg-red-100 text-red-800'
                  : hoveredEdge.severity === 'Moderate'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {hoveredEdge.severity || 'Unknown'}
            </span>
            {hoveredEdge.effect_polarity && (
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  hoveredEdge.effect_polarity === 'Harmful'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : hoveredEdge.effect_polarity === 'Beneficial'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}
              >
                {hoveredEdge.effect_polarity}
              </span>
            )}
            {hoveredEdge.mechanism_group && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">
                {hoveredEdge.mechanism_group}
              </span>
            )}
          </div>

          {/* Effect */}
          {hoveredEdge.effect && (
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-900">{hoveredEdge.effect}</p>
            </div>
          )}

          {/* Mechanism */}
          {hoveredEdge.mechanism && (
            <div className="mb-2 px-2 py-1.5 bg-slate-50 border-l-2 border-slate-300 rounded-sm">
              <p className="text-xs text-slate-600">{hoveredEdge.mechanism}</p>
            </div>
          )}

          {/* Safer Alternative */}
          {hoveredEdge.safer_alt && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800">
                <FontAwesomeIcon icon={faLightbulb} className="w-3 h-3 mr-1" />
                <span className="font-semibold">Safer Alternative:</span> {hoveredEdge.safer_alt}
              </p>
            </div>
          )}

          {/* For Diagnosis associations - show admission data */}
          {hoveredEdge.admission_count && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Admissions:</span> {hoveredEdge.admission_count.toLocaleString()}
              </p>
              {hoveredEdge.avg_severity && (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Avg Severity:</span> {hoveredEdge.avg_severity.toFixed(2)}
                </p>
              )}
              {hoveredEdge.pct_of_drug_admissions && (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">% of Drug Admissions:</span> {hoveredEdge.pct_of_drug_admissions.toFixed(1)}%
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Side Panel for Node Details - Fixed width for better consistency */}
      {selectedNode && (
        <div className="w-80 h-full bg-white rounded-lg border border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{selectedNode}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0"
            >
              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {nodeEdges.length === 0 && <p className="text-xs text-slate-500">No connections</p>}
            {nodeEdges.map((edge, idx) => {
              const otherNode = edge.source === selectedNode ? edge.target : edge.source;
              return (
                <div key={idx} className="border border-slate-200 rounded-lg p-2 space-y-1.5">
                  <span className="font-medium text-xs text-slate-900 leading-tight">{otherNode}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {edge.severity && (
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                        edge.severity === 'Major' ? 'bg-red-100 text-red-800' :
                        edge.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>{edge.severity}</span>
                    )}
                    {edge.effect_polarity && (
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded border ${
                        edge.effect_polarity === 'Harmful' ? 'bg-red-50 text-red-700 border-red-200' :
                        edge.effect_polarity === 'Beneficial' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>{edge.effect_polarity}</span>
                    )}
                    {edge.mechanism_group && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-500">
                        {edge.mechanism_group}
                      </span>
                    )}
                  </div>
                  {edge.effect && <p className="text-xs text-slate-700 leading-snug">{edge.effect}</p>}
                  {edge.mechanism && (
                    <div className="px-2 py-1.5 bg-slate-50 border-l-2 border-slate-300 rounded-sm">
                      <p className="text-xs text-slate-600 leading-snug">{edge.mechanism}</p>
                    </div>
                  )}
                  {edge.safer_alt && (
                    <div className="p-1.5 bg-green-50 border border-green-200 rounded text-xs text-green-800 leading-snug">
                      <FontAwesomeIcon icon={faLightbulb} className="w-3 h-3 mr-1" />
                      <span className="font-semibold">Alternative:</span> {edge.safer_alt}
                    </div>
                  )}
                  {edge.rationale && <p className="text-xs text-slate-600 italic leading-snug">{edge.rationale}</p>}
                  {edge.reference && (
                    edge.reference_url ? (
                      <a
                        href={edge.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block"
                        title={edge.reference}
                      >
                        <FontAwesomeIcon icon={faBook} className="w-3 h-3 mr-1" />
                        {edge.reference}
                      </a>
                    ) : (
                      <p className="text-xs text-blue-600 truncate" title={edge.reference}>
                        <FontAwesomeIcon icon={faBook} className="w-3 h-3 mr-1" />
                        {edge.reference}
                      </p>
                    )
                  )}
                  {edge.admission_count && (
                    <div className="pt-1.5 border-t border-slate-100 space-y-0.5">
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold">Admissions:</span> {edge.admission_count.toLocaleString()}
                      </p>
                      {edge.avg_severity && (
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">Avg Severity:</span> {edge.avg_severity.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Transform Neo4j result data into Cytoscape elements
const transformDataToElements = (data: any[]): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];
  const nodeIds = new Set<string>();

  data.forEach((item, index) => {
    // New standardized backend format from prompt_builder.py
    // Expected fields: Target1, Target2, NodeType1, NodeType2, EdgeDetails, EdgeType
    if (!item.Target1 || !item.Target2) {
      console.warn('Skipping item with missing Target1 or Target2:', item);
      return;
    }

    const node1Name = item.Target1;
    const node2Name = item.Target2;
    const nodeType1 = item.NodeType1?.[0] || 'Drug';
    const nodeType2 = item.NodeType2?.[0] || 'Drug';
    const edgeDetails = item.EdgeDetails || {};

    // Add first node (source drug)
    if (!nodeIds.has(node1Name)) {
      elements.push({
        data: {
          id: node1Name,
          label: node1Name,
          type: nodeType1,
        }
      });
      nodeIds.add(node1Name);
    }

    // Add second node (target drug)
    if (!nodeIds.has(node2Name)) {
      elements.push({
        data: {
          id: node2Name,
          label: node2Name,
          type: nodeType2,
        }
      });
      nodeIds.add(node2Name);
    }

    // Add edge/relationship with ALL EdgeDetails
    elements.push({
      data: {
        id: `edge-${index}`,
        source: node1Name,
        target: node2Name,
        label: edgeDetails.severity || '',
        severity: edgeDetails.severity,
        effect: edgeDetails.effect,
        reference: edgeDetails.reference,
        reference_url: edgeDetails.reference_url,
        mechanism: edgeDetails.mechanism,
        mechanism_group: edgeDetails.mechanism_group,
        effect_polarity: edgeDetails.effect_polarity,
        safer_alt: edgeDetails.safer_alt,
        rationale: edgeDetails.rationale,
        source_type: edgeDetails.source,
        // For diagnosis associations
        admission_count: edgeDetails.admission_count,
        avg_severity: edgeDetails.avg_severity,
        pct_of_drug_admissions: edgeDetails.pct_of_drug_admissions,
      }
    });
  });

  return elements;
};

export default GraphVisualization;
