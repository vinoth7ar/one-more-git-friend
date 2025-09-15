import { BaseEdge, EdgeProps, getStraightPath } from '@xyflow/react';

// Helper to build smooth SVG path from points with proper curves
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    // Create smooth curves between points
    path += ` Q ${current.x} ${current.y} ${(current.x + next.x) / 2} ${(current.y + next.y) / 2}`;
  }
  
  // Final segment to last point
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint.x} ${lastPoint.y}`;
  
  return path;
}

export default function RoutedEdge({ 
  id, 
  data, 
  selected, 
  style, 
  markerEnd,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition 
}: EdgeProps) {
  const points = (data?.points as { x: number; y: number }[]) || [];
  
  // If no routing points available, fall back to straight path
  let path: string;
  if (points.length === 0) {
    const [straightPath] = getStraightPath({
      sourceX: sourceX || 0,
      sourceY: sourceY || 0,
      targetX: targetX || 0,
      targetY: targetY || 0,
    });
    path = straightPath;
  } else {
    path = buildSmoothPath(points);
  }

  const stroke = selected ? 'hsl(var(--primary))' : (style?.stroke as string) || 'hsl(var(--muted-foreground))';
  const strokeWidth = selected ? 3 : ((style?.strokeWidth as number) || 2);

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{ 
        ...style, 
        stroke, 
        strokeWidth,
        filter: selected ? 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' : undefined,
        transition: 'all 0.2s ease-in-out'
      }}
      markerEnd={markerEnd}
      className={selected ? 'animate-pulse' : ''}
    />
  );
}