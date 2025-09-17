import React from 'react';
import { BaseEdge, getSmoothStepPath, getBezierPath, type EdgeProps } from '@xyflow/react';

/**
 * Animated Edge Component with flowing SVG elements
 * Activates animation when the edge is selected or connected to a selected node
 */
export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const isAnimated = data?.isAnimated || false;
  const edgeType = data?.edgeType || 'bezier';
  
  // Generate the appropriate path based on edge type
  const [edgePath] = edgeType === 'smoothstep' 
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {isAnimated && (
        <>
          {/* Primary animated circle */}
          <circle r="6" fill={style?.stroke || '#3b82f6'} opacity="0.8">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          
          {/* Secondary smaller circle for a trail effect */}
          <circle r="3" fill={style?.stroke || '#3b82f6'} opacity="0.4">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="0.3s" />
          </circle>
          
          {/* Pulse effect along the edge */}
          <circle r="10" fill="none" stroke={style?.stroke || '#3b82f6'} strokeWidth="2" opacity="0.6">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
            <animate attributeName="r" values="10;15;10" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </>
  );
}