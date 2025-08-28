/**
 * SingleView Component - Main visualization page with chart integration
 * 
 * This component consolidates all chart-related functionality that was previously
 * distributed across multiple components. It serves as the main entry point for
 * data visualization and workflow management.
 * 
 * Chart functionality moved from:
 * - src/components/ui/chart.tsx (Chart configuration and components)
 * - Recharts integration for data visualization
 * - Workflow data visualization capabilities
 */

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Pure React chart components (no external libraries)
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Pure React chart implementations (replacing Recharts)
// All chart rendering done with SVG and React only

// Workflow components integration
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import { mockWorkflows } from '@/components/workflow/mock-data';
import { WorkflowData } from '@/components/workflow/types';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

/**
 * Chart Configuration
 * 
 * Centralized chart theming and configuration object
 * Previously scattered across different chart implementations
 */
const chartConfig = {
  events: {
    label: "Events",
    color: "hsl(var(--primary))",
  },
  status: {
    label: "Status",
    color: "hsl(var(--secondary))",
  },
  processed: {
    label: "Processed",
    color: "hsl(var(--accent))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
  success: {
    label: "Success", 
    color: "hsl(var(--success))",
  },
} satisfies ChartConfig;

/**
 * Sample chart data
 * 
 * This represents the type of data that would come from workflow analytics
 * In a real implementation, this would be fetched from an API or database
 */
const sampleWorkflowData = [
  { name: "Jan", events: 65, status: 40, processed: 58, failed: 5, success: 53 },
  { name: "Feb", events: 59, status: 45, processed: 52, failed: 8, success: 44 },
  { name: "Mar", events: 80, status: 67, processed: 75, failed: 3, success: 72 },
  { name: "Apr", events: 81, status: 70, processed: 78, failed: 6, success: 72 },
  { name: "May", events: 56, status: 48, processed: 54, failed: 4, success: 50 },
  { name: "Jun", events: 78, status: 65, processed: 73, failed: 2, success: 71 },
];

const pieChartData = [
  { name: "Completed", value: 234, fill: "hsl(var(--success))" },
  { name: "In Progress", value: 123, fill: "hsl(var(--primary))" },
  { name: "Failed", value: 67, fill: "hsl(var(--destructive))" },
  { name: "Pending", value: 89, fill: "hsl(var(--muted))" },
];

/**
 * Pure React Chart Components
 * 
 * Custom chart implementations using only React, SVG, and CSS
 * No external charting libraries (like Recharts) used
 */

// Simple Bar Chart Component
const ReactBarChart: React.FC<{
  data: any[];
  width?: number;
  height?: number;
  dataKeys: string[];
  colors: string[];
}> = ({ data, width = 400, height = 300, dataKeys, colors }) => {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const maxValue = Math.max(...data.flatMap(item => dataKeys.map(key => item[key])));
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;
  
  return (
    <div className="w-full">
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <g>
          {[0, 1, 2, 3, 4].map(i => {
            const y = margin.top + (chartHeight / 4) * i;
            return (
              <line
                key={i}
                x1={margin.left}
                y1={y}
                x2={margin.left + chartWidth}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}
        </g>
        
        {/* Bars */}
        <g>
          {data.map((item, index) => {
            const x = margin.left + index * (chartWidth / data.length) + barSpacing / 2;
            return dataKeys.map((key, keyIndex) => {
              const barHeight = (item[key] / maxValue) * chartHeight;
              const barX = x + (keyIndex * barWidth / dataKeys.length);
              const barY = margin.top + chartHeight - barHeight;
              
              return (
                <rect
                  key={`${index}-${key}`}
                  x={barX}
                  y={barY}
                  width={barWidth / dataKeys.length}
                  height={barHeight}
                  fill={colors[keyIndex]}
                  className="hover:opacity-80 transition-opacity"
                />
              );
            });
          })}
        </g>
        
        {/* X-axis labels */}
        <g>
          {data.map((item, index) => {
            const x = margin.left + index * (chartWidth / data.length) + (chartWidth / data.length) / 2;
            return (
              <text
                key={index}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="12"
                fill="hsl(var(--muted-foreground))"
              >
                {item.name}
              </text>
            );
          })}
        </g>
        
        {/* Y-axis labels */}
        <g>
          {[0, 1, 2, 3, 4].map(i => {
            const y = margin.top + (chartHeight / 4) * i;
            const value = Math.round(maxValue - (maxValue / 4) * i);
            return (
              <text
                key={i}
                x={margin.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="hsl(var(--muted-foreground))"
              >
                {value}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// Simple Area Chart Component
const ReactAreaChart: React.FC<{
  data: any[];
  width?: number;
  height?: number;
  dataKey: string;
  color: string;
}> = ({ data, width = 400, height = 300, dataKey, color }) => {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const maxValue = Math.max(...data.map(item => item[dataKey]));
  const stepX = chartWidth / (data.length - 1);
  
  // Create path for area
  const pathData = data.map((item, index) => {
    const x = margin.left + index * stepX;
    const y = margin.top + chartHeight - (item[dataKey] / maxValue) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  const areaPath = pathData + 
    ` L ${margin.left + chartWidth} ${margin.top + chartHeight}` +
    ` L ${margin.left} ${margin.top + chartHeight} Z`;
  
  return (
    <div className="w-full">
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <g>
          {[0, 1, 2, 3, 4].map(i => {
            const y = margin.top + (chartHeight / 4) * i;
            return (
              <line
                key={i}
                x1={margin.left}
                y1={y}
                x2={margin.left + chartWidth}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}
        </g>
        
        {/* Area */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.3"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = margin.left + index * stepX;
          const y = margin.top + chartHeight - (item[dataKey] / maxValue) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              className="hover:r-4 transition-all"
            />
          );
        })}
        
        {/* X-axis labels */}
        <g>
          {data.map((item, index) => {
            const x = margin.left + index * stepX;
            return (
              <text
                key={index}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="12"
                fill="hsl(var(--muted-foreground))"
              >
                {item.name}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// Simple Pie Chart Component
const ReactPieChart: React.FC<{
  data: any[];
  width?: number;
  height?: number;
}> = ({ data, width = 300, height = 300 }) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const slices = data.map(item => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');
    
    currentAngle += sliceAngle;
    
    return {
      ...item,
      path: pathData,
      percentage: ((item.value / total) * 100).toFixed(1)
    };
  });
  
  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height}>
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.path}
            fill={slice.fill}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name} ({slices[index].percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SingleViewProps {}

/**
 * SingleView Component
 * 
 * Main component that combines workflow visualization with comprehensive
 * chart analytics. This consolidates functionality that was previously
 * distributed across multiple components.
 */
const SingleView: React.FC<SingleViewProps> = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  
  // State management for workflow and visualization
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(id || 'workflow-1');
  const [activeTab, setActiveTab] = useState('workflow');
  
  // Get current workflow data
  const currentWorkflow: WorkflowData | undefined = mockWorkflows[selectedWorkflowId];
  
  /**
   * Workflow selection handler
   * 
   * Handles navigation between different workflows while maintaining
   * the chart context and visualization state
   */
  const handleWorkflowSelect = useCallback((workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    // Update URL to reflect the current workflow
    navigate(`/visualization/${type}/${workflowId}`, { replace: true });
  }, [navigate, type]);

  /**
   * Chart Data Processing Functions
   * 
   * These functions process workflow data into chart-compatible formats
   * Previously this logic was embedded in individual chart components
   */
  const processWorkflowMetrics = useCallback(() => {
    if (!currentWorkflow) return sampleWorkflowData;
    
    // Transform workflow nodes into chart metrics
    const eventCount = currentWorkflow.nodes.filter(n => n.type === 'event').length;
    const statusCount = currentWorkflow.nodes.filter(n => n.type === 'status').length;
    
    return sampleWorkflowData.map(item => ({
      ...item,
      events: eventCount * 10 + Math.random() * 20,
      status: statusCount * 8 + Math.random() * 15,
    }));
  }, [currentWorkflow]);

  const processedChartData = processWorkflowMetrics();

  if (!currentWorkflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Workflow Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested workflow "{selectedWorkflowId}" could not be found.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentWorkflow.name}</h1>
                <p className="text-muted-foreground">{currentWorkflow.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {currentWorkflow.nodes.length} nodes
              </Badge>
              <Badge variant="outline">
                {currentWorkflow.edges.length} connections
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Distribution
            </TabsTrigger>
          </TabsList>

          {/* Workflow Visualization Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Visualization</CardTitle>
                <CardDescription>
                  Interactive workflow diagram showing events, statuses, and their connections
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <WorkflowBuilder 
                    selectedWorkflowId={selectedWorkflowId}
                    workflowData={currentWorkflow}
                    onWorkflowSelect={handleWorkflowSelect}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab - Bar Chart */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Event Processing Metrics</CardTitle>
                  <CardDescription>
                    Monthly comparison of events vs status updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReactBarChart
                    data={processedChartData}
                    width={500}
                    height={300}
                    dataKeys={['events', 'status']}
                    colors={['hsl(var(--primary))', 'hsl(var(--secondary))']}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Success Rate</CardTitle>
                  <CardDescription>
                    Processed vs failed workflow executions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReactBarChart
                    data={processedChartData}
                    width={500}
                    height={300}
                    dataKeys={['success', 'failed']}
                    colors={['hsl(var(--success))', 'hsl(var(--destructive))']}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab - Line Chart */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Execution Trends</CardTitle>
                <CardDescription>
                  Time series analysis of workflow performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReactAreaChart
                  data={processedChartData}
                  width={600}
                  height={300}
                  dataKey="processed"
                  color="hsl(var(--primary))"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab - Pie Chart */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Status Distribution</CardTitle>
                  <CardDescription>
                    Current distribution of workflow execution states
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReactPieChart
                    data={pieChartData}
                    width={400}
                    height={350}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics Summary</CardTitle>
                  <CardDescription>
                    Overview of workflow performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Total Events</span>
                    <Badge variant="secondary">{currentWorkflow.nodes.filter(n => n.type === 'event').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Status Nodes</span>
                    <Badge variant="secondary">{currentWorkflow.nodes.filter(n => n.type === 'status').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Connections</span>
                    <Badge variant="secondary">{currentWorkflow.edges.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="font-medium">Success Rate</span>
                    <Badge variant="default">94.2%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SingleView;