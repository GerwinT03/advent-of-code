"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface GraphNode {
  id: number;
  x: number;
  y: number;
  z?: number;
  x3d?: number;
  y3d?: number;
  z3d?: number;
  label?: string;
  component?: number;
}

interface GraphEdge {
  source: number;
  target: number;
  distance: number;
}

interface GraphFrame {
  nodes: GraphNode[];
  edges: GraphEdge[];
  action?: string;
  highlightEdge?: { source: number; target: number };
  highlightNodes?: number[];
}

interface GraphVisualizationData {
  format: "graph-frames";
  frames: GraphFrame[];
  palette?: Record<number, { bg: string; fg: string }>;
}

interface Props {
  data: GraphVisualizationData;
  frameIndex: number;
}

function Node({
  position,
  color,
  highlighted,
  label,
}: {
  position: [number, number, number];
  color: string;
  highlighted: boolean;
  label?: string;
}) {
  const radius = highlighted ? 0.4 : 0.3;

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={highlighted ? "#fbbf24" : color}
          emissiveIntensity={highlighted ? 0.5 : 0.1}
        />
      </mesh>
      {highlighted && (
        <mesh>
          <sphereGeometry args={[radius + 0.08, 32, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
        </mesh>
      )}
      {label && (
        <Text
          position={[0, radius + 0.3, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function Edge({
  start,
  end,
  highlighted,
}: {
  start: [number, number, number];
  end: [number, number, number];
  highlighted: boolean;
}) {
  const points = useMemo(() => [start, end], [start, end]);

  return (
    <Line
      points={points}
      color={highlighted ? "#fbbf24" : "#6b7280"}
      lineWidth={highlighted ? 4 : 2}
      opacity={highlighted ? 1 : 0.7}
      transparent
    />
  );
}

export function Graph3DRenderer({ data, frameIndex }: Props) {
  const frame = data.frames[frameIndex];
  const palette = data.palette ?? {};

  const nodeMap = useMemo(() => {
    if (!frame) return new Map<number, GraphNode>();
    const map = new Map<number, GraphNode>();
    frame.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [frame]);

  if (!frame) return null;

  const getNodeColor = (node: GraphNode) => {
    const component = node.component ?? node.id;
    if (palette[component]) {
      return palette[component].bg;
    }
    const hue = (component * 137) % 360;
    return `hsl(${hue}, 70%, 45%)`;
  };

  const isHighlightedNode = (nodeId: number) => {
    return frame.highlightNodes?.includes(nodeId) ?? false;
  };

  const isHighlightedEdge = (source: number, target: number) => {
    if (!frame.highlightEdge) return false;
    return (
      (frame.highlightEdge.source === source && frame.highlightEdge.target === target) ||
      (frame.highlightEdge.source === target && frame.highlightEdge.target === source)
    );
  };

  const getNodePosition = (node: GraphNode): [number, number, number] => {
    // Use 3D coordinates if available, otherwise fall back to 2D
    if (node.x3d !== undefined && node.y3d !== undefined && node.z3d !== undefined) {
      return [node.x3d, node.y3d, node.z3d];
    }
    // Fallback: use 2D coords scaled down
    return [(node.x - 450) / 80, (node.y - 300) / 80, node.z ?? 0];
  };

  return (
    <>
      <div className="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        <Canvas
          camera={{ position: [12, 8, 12], fov: 50 }}
          style={{ height: 450 }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Edges */}
          {frame.edges.map((edge, idx) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;
            return (
              <Edge
                key={`edge-${idx}`}
                start={getNodePosition(sourceNode)}
                end={getNodePosition(targetNode)}
                highlighted={isHighlightedEdge(edge.source, edge.target)}
              />
            );
          })}

          {/* Nodes */}
          {frame.nodes.map((node) => (
            <Node
              key={`node-${node.id}`}
              position={getNodePosition(node)}
              color={getNodeColor(node)}
              highlighted={isHighlightedNode(node.id)}
              label={node.label}
            />
          ))}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            minDistance={5}
            maxDistance={30}
          />

          {/* Grid helper for reference */}
          <gridHelper args={[20, 20, "#333", "#222"]} position={[0, -6, 0]} />
        </Canvas>
      </div>
      {frame.action && (
        <div className="mt-2 text-xs text-gray-300">
          <p>{frame.action}</p>
        </div>
      )}
    </>
  );
}
