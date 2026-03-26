import { useEffect, useRef } from 'react';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';

interface GraphVisualizationProps {
  data: any[];
  onNodeSelect?: (nodeId: string) => void;
}

const GraphVisualization = ({ data, onNodeSelect }: GraphVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
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

    return () => {
      cy.destroy();
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

  data.forEach((item) => {
    // Add source node
    if (item.source && !nodeIds.has(item.source.id)) {
      elements.push({
        data: {
          id: item.source.id,
          label: item.source.name || item.source.id,
          type: item.source.type || 'Drug',
          ...item.source,
        }
      });
      nodeIds.add(item.source.id);
    }

    // Add target node
    if (item.target && !nodeIds.has(item.target.id)) {
      elements.push({
        data: {
          id: item.target.id,
          label: item.target.name || item.target.id,
          type: item.target.type || 'Drug',
          ...item.target,
        }
      });
      nodeIds.add(item.target.id);
    }

    // Add edge/relationship
    if (item.relationship && item.source && item.target) {
      elements.push({
        data: {
          id: `${item.source.id}-${item.target.id}`,
          source: item.source.id,
          target: item.target.id,
          label: item.relationship.type || '',
          severity: item.relationship.severity,
          ...item.relationship,
        }
      });
    }
  });

  return elements;
};

export default GraphVisualization;
