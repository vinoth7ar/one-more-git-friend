/**
 * Workflow Component Library
 * 
 * A standalone React component for visualizing and managing workflow diagrams.
 * Built with ReactFlow, TypeScript, and SCSS for styling.
 * 
 * Features:
 * - Transform various backend data formats into standardized workflow format
 * - Intelligent automatic layout algorithms for optimal node positioning
 * - Customizable node types (status circles, event rectangles)
 * - Interactive features (drag, connect, click handlers)
 * - Error handling and fallback states
 * - Mock data for testing and development
 * - TypeScript support with full type definitions
 * - SCSS styling with dark mode support
 * 
 * Usage:
 * import WorkflowManager from './workflow-component';
 * 
 * <WorkflowManager 
 *   workflowData={yourData}
 *   onNodeClick={(nodeId, nodeData) => console.log('Node clicked:', nodeId)}
 *   layoutConfig={{ isHorizontal: false }}
 * />
 */

// Main component export
export { default } from './WorkflowManager';
export { default as WorkflowManager } from './WorkflowManager';

// Type exports
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowData,
  RawWorkflowData,
  LayoutConfig,
  WorkflowManagerProps
} from './types';

// Utility exports
export {
  transformWorkflowData,
  validateWorkflowData
} from './utils/dataTransform';

export {
  calculateSmartLayout,
  analyzeGraphStructure,
  defaultLayoutConfig
} from './utils/layoutAlgorithms';

// Data exports
export {
  mockWorkflows,
  defaultWorkflow
} from './data/mockData';

// Component exports
export { nodeTypes } from './components/WorkflowNodes';