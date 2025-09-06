# Workflow Component Library

A standalone React component for visualizing and managing workflow diagrams with intelligent layout algorithms and flexible data transformation.

## Features

- 🔄 **Data Transformation**: Converts various backend data formats into standardized workflow format
- 🎯 **Smart Positioning**: Intelligent automatic layout algorithms for optimal node positioning  
- 🎨 **Customizable Nodes**: Different node types (status circles, event rectangles)
- 🖱️ **Interactive**: Drag, connect, and click handlers
- 🛡️ **Error Handling**: Robust error handling with fallback states
- 📊 **Mock Data**: Built-in examples for testing and development
- 🔧 **TypeScript**: Full type definitions and safety
- 🎨 **SCSS Styling**: Professional styling with dark mode support

## Installation

Copy the `workflow-component` folder to your project and install the required dependencies:

```bash
npm install @xyflow/react react react-dom
```

## Basic Usage

```tsx
import WorkflowManager from './workflow-component';

function App() {
  const handleNodeClick = (nodeId: string, nodeData: any) => {
    console.log('Node clicked:', nodeId, nodeData);
  };

  return (
    <WorkflowManager 
      selectedWorkflow="ebm-version"
      onNodeClick={handleNodeClick}
      layoutConfig={{ isHorizontal: true }}
      showControls={true}
      showBackground={true}
    />
  );
}
```

## With Custom Data

```tsx
import WorkflowManager from './workflow-component';

const customWorkflowData = {
  id: "custom-workflow",
  name: "My Custom Workflow", 
  description: "A custom workflow example",
  nodes: [
    { id: "start", type: "status", label: "Start" },
    { id: "process", type: "event", label: "Process Data" },
    { id: "end", type: "status", label: "Complete" }
  ],
  edges: [
    { id: "e1", source: "start", target: "process", label: "" },
    { id: "e2", source: "process", target: "end", label: "" }
  ]
};

function CustomWorkflow() {
  return <WorkflowManager workflowData={customWorkflowData} />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `workflowData` | `WorkflowData \| RawWorkflowData` | `undefined` | Custom workflow data to visualize |
| `selectedWorkflow` | `string` | `"ebm-version"` | Select from built-in mock workflows |
| `layoutConfig` | `Partial<LayoutConfig>` | `{}` | Override default layout settings |
| `onNodeClick` | `(nodeId, nodeData) => void` | `undefined` | Callback when node is clicked |
| `onEdgeClick` | `(edgeId, edgeData) => void` | `undefined` | Callback when edge is clicked |
| `onLayoutChange` | `(nodes, edges) => void` | `undefined` | Callback when layout changes |
| `className` | `string` | `""` | Additional CSS classes |
| `style` | `CSSProperties` | `{}` | Inline styles |
| `showControls` | `boolean` | `true` | Show zoom/pan controls |
| `showBackground` | `boolean` | `true` | Show background pattern |
| `isInteractive` | `boolean` | `true` | Enable drag/connect interactions |

## Data Format

### Standard Format

```typescript
interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowNode {
  id: string;
  type: 'status' | 'event';
  label: string;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}
```

### Raw Data Transformation

The component automatically transforms various backend formats:

```typescript
// These field names are automatically detected and converted:
const backendData = {
  // Node fields: nodes, vertices, states, steps
  nodes: [...], // or vertices, states, steps
  
  // Edge fields: edges, connections, transitions, links  
  edges: [...], // or connections, transitions, links
  
  // Metadata fields
  id: "...", // or workflowId, workflow_id, uuid
  name: "...", // or title, workflow_name, workflowName
  description: "..." // or desc, summary
};
```

## Layout Configuration

```typescript
const layoutConfig = {
  workflowWidth: 1200,    // Canvas width
  workflowHeight: 800,    // Canvas height
  stageWidth: 120,        // Event node width
  stageHeight: 80,        // Event node height
  circleSize: 60,         // Status node diameter
  padding: 100,           // Edge padding
  spacing: 180,           // Node spacing
  isHorizontal: true,     // Layout direction
};
```

## Styling

The component uses SCSS for styling. You can customize the appearance by:

1. **Importing the default styles**:
```scss
@import './workflow-component/styles/workflow.scss';
```

2. **Overriding CSS variables**:
```scss
.workflow-container {
  --node-bg-color: #your-color;
  --node-border-color: #your-border;
  --edge-color: #your-edge-color;
}
```

3. **Custom CSS classes**:
```scss
.status-node {
  background: linear-gradient(45deg, #blue, #purple);
}

.event-node {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
```

## Built-in Mock Data

The component includes realistic workflow examples:

- `ebm-version`: Enterprise workflow with approval stages
- `mortgage-origination`: Complex financial process workflow

## Error Handling

The component gracefully handles:
- Invalid data formats
- Missing required fields  
- Network errors
- Malformed JSON
- Empty datasets

## File Structure

```
workflow-component/
├── index.ts                    # Main exports
├── WorkflowManager.tsx         # Main component
├── README.md                   # Documentation
├── types/
│   └── index.ts               # TypeScript definitions
├── components/
│   └── WorkflowNodes.tsx      # Node components
├── utils/
│   ├── dataTransform.ts       # Data transformation
│   └── layoutAlgorithms.ts    # Positioning logic
├── data/
│   └── mockData.ts            # Sample workflows
└── styles/
    └── workflow.scss          # Component styles
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions for all props, data structures, and utility functions.

## Dependencies

- `@xyflow/react`: ^12.8.4
- `react`: ^18.3.1  
- `react-dom`: ^18.3.1

## License

This component is designed to be copied and customized for your specific project needs.