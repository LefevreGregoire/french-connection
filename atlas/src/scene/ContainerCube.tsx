import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { type ContainerNode, VisualAlertLevel, useTopologyStore } from '../store/useTopologyStore';
interface Props {
  node: ContainerNode;
  position: [number, number, number];
}

const ALERT_COLORS: Record<VisualAlertLevel, { base: string; emissive: string; edge: string }> = {
  [VisualAlertLevel.Healthy]:  { base: '#083344', emissive: '#06b6d4', edge: '#22d3ee' }, // Cyan néon
  [VisualAlertLevel.Warning]:  { base: '#451a03', emissive: '#f59e0b', edge: '#fbbf24' }, // Ambre
  [VisualAlertLevel.Critical]: { base: '#450a0a', emissive: '#ef4444', edge: '#f87171' }, // Rouge alerte
  [VisualAlertLevel.Neutral]:  { base: '#1e293b', emissive: '#64748b', edge: '#94a3b8' }, // Gris acier
};

export function ContainerCube({ node, position }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId);
  const selectNode = useTopologyStore((s) => s.selectNode);
  const isSelected = selectedNodeId === node.id;

  const palette = ALERT_COLORS[node.alertLevel] ?? ALERT_COLORS[VisualAlertLevel.Neutral];

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Un conteneur actif flotte à y=0.85, un conteneur arrêté s'écrase à y=0.55
    const targetY = node.alertLevel === VisualAlertLevel.Critical ? 0.55 : 0.85;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 6);

    // Pulsation lumineuse rapide en cas de panne (Critical)
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (node.alertLevel === VisualAlertLevel.Critical) {
      mat.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 8) * 0.7;
    } else {
      mat.emissiveIntensity = hovered || isSelected ? 1.1 : 0.45;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Socle énergétique au sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial
          color={palette.edge}
          transparent
          opacity={isSelected ? 0.35 : 0.12}
        />
      </mesh>

      {/* Le Cube 3D du conteneur */}
      <RoundedBox
        ref={meshRef}
        args={[1.4, 1.1, 1.4]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.85, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectNode(isSelected ? null : node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={palette.base}
          emissive={palette.emissive}
          emissiveIntensity={0.45}
          roughness={0.2}
          metalness={0.8}
        />
        <Edges scale={1.01} threshold={15} color={isSelected ? '#ffffff' : palette.edge} />
      </RoundedBox>

      {/* Étiquette flottante au-dessus du cube */}
      <Html position={[0, 1.9, 0]} center distanceFactor={15} zIndexRange={[10, 0]}>
        <div
          onClick={() => selectNode(isSelected ? null : node.id)}
          className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap border transition-all cursor-pointer select-none ${
            isSelected
              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.6)] scale-110'
              : node.alertLevel === VisualAlertLevel.Critical
              ? 'bg-red-950/90 border-red-500/80 text-red-200'
              : 'bg-slate-900/85 border-slate-700/80 text-slate-300'
          }`}
        >
          {node.name}
        </div>
      </Html>
    </group>
  );
}