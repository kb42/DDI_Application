import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';

interface GraphVisualizationProps {
  data: any[];
  onNodeSelect?: (nodeId: string) => void;
}

const GraphVisualization = ({ data, onNodeSelect }: GraphVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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
              'background-color': '#f59e0b',
              'label': 'data(label)',
              'color': '#1e293b',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '14px',
              'font-weight': 'bold',
              'text-wrap': 'wrap',
              'text-max-width': '120px',
              'width': '100px',
              'height': '100px',
              'border-width': 3,
              'border-color': '#d97706',
            }
          },
          {
            selector: 'node[type="Drug"]',
            style: {
              'background-color': '#f59e0b',
              'border-color': '#d97706',
              'shape': 'ellipse',
            }
          },
          {
            selector: 'node[type="Diagnosis"]',
            style: {
              'background-color': '#3b82f6',
              'border-color': '#1e40af',
              'shape': 'round-rectangle',
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
          // autorotate labels to prevent overlap: https://stackoverflow.com/a/53737071
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
          padding: 100,
          nodeRepulsion: 8000,
          idealEdgeLength: 200,
          edgeElasticity: 100,
          gravity: 0.1,
        },
      });

      // Handle node selection
      cy.on('tap', 'node', (event) => {
        const node = event.target;
        if (onNodeSelect) {
          onNodeSelect(node.id());
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
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full bg-slate-50 rounded-lg border border-slate-200"
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
          {/* Severity Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                hoveredEdge.severity === 'Major'
                  ? 'bg-red-100 text-red-800'
                  : hoveredEdge.severity === 'Moderate'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {hoveredEdge.severity || 'Unknown'}
            </span>
          </div>

          {/* Effect */}
          {hoveredEdge.effect && (
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-900">{hoveredEdge.effect}</p>
            </div>
          )}

          {/* Mechanism */}
          {hoveredEdge.mechanism && (
            <div className="mb-2">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Mechanism:</span> {hoveredEdge.mechanism}
              </p>
            </div>
          )}

          {/* Safer Alternative */}
          {hoveredEdge.safer_alt && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800">
                <span className="font-semibold">💡 Safer Alternative:</span> {hoveredEdge.safer_alt}
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
        mechanism: edgeDetails.mechanism,
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
