import { BaseEdge, EdgeProps } from '@xyflow/react';

// Helper to build SVG path from points
function buildPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return '';
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  return `M ${first.x} ${first.y} ${segments}`;
}

export default function RoutedEdge({ id, data, selected, style, markerEnd }: EdgeProps) {
  const points = (data?.points as { x: number; y: number }[]) || [];
  const path = buildPath(points);

  const stroke = selected ? 'hsl(var(--primary))' : (style?.stroke as string) || 'hsl(var(--border))';
  const strokeWidth = selected ? 4 : ((style?.strokeWidth as number) || 2);

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{ ...style, stroke, strokeWidth }}
      markerEnd={markerEnd}
    />
  );
}
