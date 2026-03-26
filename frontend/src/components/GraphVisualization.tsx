import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';

interface GraphVisualizationProps {
  data: any[];
  onNodeSelect?: (nodeId: string) => void;
}

const GraphVisualization = ({ data, onNodeSelect }: GraphVisualizationProps) => {
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
        elements: transformDataToElements(data),
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#3b82f6',
              'label': 'data(label)',
              'color': '#fff',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '12px',
              'width': '60px',
              'height': '60px',
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
              'width': 3,
              'line-color': '#94a3b8',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '10px',
              'text-rotation': 'autorotate',
            }
          },
          {
            selector: 'edge[severity="Severe"]',
            style: {
              'line-color': '#ef4444',
              'target-arrow-color': '#ef4444',
              'width': 5,
            }
          },
          {
            selector: 'edge[severity="Moderate"]',
            style: {
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              'width': 4,
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
          padding: 50,
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
const transformDataToElements = (data: any[]): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];
  const nodeIds = new Set<string>();

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
      drug1Name = 'Query Source'; // Placeholder for the queried drug
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
