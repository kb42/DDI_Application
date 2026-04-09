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
  console.log('transformDataToElements received data:', data);
  const elements: ElementDefinition[] = [];
  const nodeIds = new Set<string>();

  data.forEach((item, index) => {
    // New standardized backend format from prompt_builder.py
    // Expected fields: Target1, Target2, NodeType1, NodeType2, EdgeDetails, EdgeType
    if (!item.Target1 || !item.Target2) {
      console.warn('Skipping item with missing Target1 or Target2:', item);
      return;
    }
    console.log(`Processing item ${index}:`, item);

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

    // Add edge/relationship
    elements.push({
      data: {
        id: `edge-${index}`,
        source: node1Name,
        target: node2Name,
        label: edgeDetails.effect || '',
        severity: edgeDetails.severity,
        effect: edgeDetails.effect,
        reference: edgeDetails.reference,
      }
    });
  });

  console.log('Generated elements:', elements);
  return elements;
};

export default GraphVisualization;
