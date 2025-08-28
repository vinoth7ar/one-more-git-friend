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

// Chart-related imports (moved from distributed locations)
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Recharts components for data visualization
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

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
                  <ChartContainer config={chartConfig}>
                    <BarChart data={processedChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="events" fill="var(--color-events)" />
                      <Bar dataKey="status" fill="var(--color-status)" />
                    </BarChart>
                  </ChartContainer>
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
                  <ChartContainer config={chartConfig}>
                    <BarChart data={processedChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="success" fill="var(--color-success)" />
                      <Bar dataKey="failed" fill="var(--color-failed)" />
                    </BarChart>
                  </ChartContainer>
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
                <ChartContainer config={chartConfig}>
                  <AreaChart data={processedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip 
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="processed" 
                      stroke="var(--color-processed)" 
                      fill="var(--color-processed)" 
                      fillOpacity={0.6}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="events" 
                      stroke="var(--color-events)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
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
                  <ChartContainer config={chartConfig}>
                    <PieChart>
                      <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend 
                        content={<ChartLegendContent />}
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ChartContainer>
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