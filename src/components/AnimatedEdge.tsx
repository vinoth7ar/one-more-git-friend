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
          <path
            d={edgePath}
            fill="none"
            stroke={style?.stroke || 'hsl(var(--primary))'}
            strokeWidth={(style?.strokeWidth as number) || 2}
            strokeDasharray="12 8"
            strokeLinecap="round"
            opacity="0.9"
          >
            <animate attributeName="stroke-dashoffset" values="24;0" dur="0.6s" repeatCount="indefinite" />
          </path>
          {/* Primary animated circle with glow effect */}
          <circle r="8" fill={style?.stroke || 'hsl(var(--primary))'} opacity="0.9">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
            <animate attributeName="r" values="8;12;8" dur="0.8s" repeatCount="indefinite" />
          </circle>
          
          {/* Secondary trailing circle */}
          <circle r="4" fill={style?.stroke || 'hsl(var(--primary))'} opacity="0.6">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="0.2s" />
          </circle>
          
          {/* Third trailing circle */}
          <circle r="2" fill={style?.stroke || 'hsl(var(--primary))'} opacity="0.3">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="0.4s" />
          </circle>
          
          {/* Expanding pulse wave */}
          <circle r="15" fill="none" stroke={style?.stroke || 'hsl(var(--primary))'} strokeWidth="3" opacity="0.7">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
            <animate attributeName="r" values="15;25;15" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="3;1;3" dur="1.2s" repeatCount="indefinite" />
          </circle>
          
          {/* Sparkle effect */}
          <circle r="3" fill="hsl(var(--foreground))" opacity="0.8">
            <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} begin="0.1s" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.6s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </>
  );
}