import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';

interface GraphVisualizationProps {
  data: any[];
  onNodeSelect?: (nodeId: string) => void;
  queryContext?: string;
}

const GraphVisualization = ({ data, onNodeSelect, queryContext }: GraphVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

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
        elements: transformDataToElements(data, queryContext),
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#3b82f6',
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
              'border-width': 2,
              'border-color': '#1e40af',
            }
          },
          {
            selector: 'node[type="Drug"]',
            style: {
              'background-color': '#3b82f6',
              'shape': 'ellipse',
            }
          },
          {
            selector: 'node[type="Diagnosis"]',
            style: {
              'background-color': '#ef4444',
              'shape': 'rectangle',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 4,
              'line-color': '#94a3b8',
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
          {
            selector: 'edge[severity="Major"]',
            style: {
              'line-color': '#ef4444',
              'target-arrow-color': '#ef4444',
              'width': 6,
            }
          },
          {
            selector: 'edge[severity="Moderate"]',
            style: {
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              'width': 5,
            }
          },
          {
            selector: 'edge[severity="Minor"]',
            style: {
              'line-color': '#22c55e',
              'target-arrow-color': '#22c55e',
              'width': 3,
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
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-50 rounded-lg border border-slate-200"
    />
  );
};

// Transform Neo4j result data into Cytoscape elements
const transformDataToElements = (data: any[], queryContext?: string): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];
  const nodeIds = new Set<string>();

  // Try to extract drug name from query context
  const extractDrugFromQuery = (query?: string): string => {
    if (!query) return 'Query Source';

    // Common patterns: "What interacts with X?", "Show interactions for X", etc.
    const patterns = [
      /(?:interacts?\s+with|interactions?\s+(?:for|of))\s+([A-Z][a-zA-Z\s]+?)[\?\.]/i,
      /(?:show|find|get)\s+(?:me\s+)?(?:interactions?\s+)?(?:for|of|with)\s+([A-Z][a-zA-Z\s]+?)[\?\.]/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Query Source';
  };

  const sourceDrugName = extractDrugFromQuery(queryContext);

  data.forEach((item, index) => {
    // Handle different backend response formats
    let drug1Name: string;
    let drug2Name: string | null = null;
    let edgeDetails: any;
    let nodeType1: string;
    let nodeType2: string | null = null;

    // Format 1: Drug-to-Drug interactions (Drug1Name, Drug2Name, InteractionDetails)
    if (item.Drug1Name && item.Drug2Name) {
      drug1Name = item.Drug1Name;
      drug2Name = item.Drug2Name;
      edgeDetails = item.InteractionDetails || {};
      nodeType1 = item.NodeType1?.[0] || 'Drug';
      nodeType2 = item.NodeType2?.[0] || 'Drug';
    }
    // Format 2: Single drug query (TargetName, EdgeDetails)
    else if (item.TargetName) {
      drug1Name = sourceDrugName; // Use extracted drug name
      drug2Name = item.TargetName;
      edgeDetails = item.EdgeDetails || {};
      nodeType1 = 'Drug';
      nodeType2 = item.NodeType?.[0] || 'Drug';
    }
    // Fallback: try to extract from item structure
    else {
      return; // Skip malformed items
    }

    // Add first node
    if (!nodeIds.has(drug1Name)) {
      elements.push({
        data: {
          id: drug1Name,
          label: drug1Name,
          type: nodeType1,
        }
      });
      nodeIds.add(drug1Name);
    }

    // Add second node if exists
    if (drug2Name && !nodeIds.has(drug2Name)) {
      elements.push({
        data: {
          id: drug2Name,
          label: drug2Name,
          type: nodeType2 || 'Drug',
        }
      });
      nodeIds.add(drug2Name);
    }

    // Add edge/relationship
    if (drug2Name) {
      elements.push({
        data: {
          id: `edge-${index}`,
          source: drug1Name,
          target: drug2Name,
          label: edgeDetails.effect || '',
          severity: edgeDetails.severity,
          effect: edgeDetails.effect,
          reference: edgeDetails.reference,
        }
      });
    }
  });

  return elements;
};

export default GraphVisualization;
