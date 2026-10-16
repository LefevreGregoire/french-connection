import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { type ContainerNode, VisualAlertLevel, useTopologyStore } from '../store/useTopologyStore';

interface Props {
  node: ContainerNode;
  position: [number, number, number];
  showAllLabels?: boolean;
}

function getNodeRole(node: ContainerNode): 'database' | 'gateway' | 'app' {
  const key = `${node.name} ${node.image}`.toLowerCase();
  if (key.includes('postgres') || key.includes('redis') || key.includes('db') || key.includes('mongo') || key.includes('mysql')) {
    return 'database';
  }
  if (key.includes('nginx') || key.includes('proxy') || key.includes('waf') || key.includes('crowdsec') || key.includes('traefik')) {
    return 'gateway';
  }
  return 'app';
}

export function ContainerCube({ node, position, showAllLabels = false }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null!);
  const [hovered, setHovered] = useState(false);

  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId);
  const selectNode = useTopologyStore((s) => s.selectNode);
  const isSelected = selectedNodeId === node.id;

  const role = getNodeRole(node);
  const isCritical = node.alertLevel === VisualAlertLevel.Critical;
  const isWarning = node.alertLevel === VisualAlertLevel.Warning;

  const shouldShowLabel = hovered || isSelected || isCritical || showAllLabels;

  // Palette Silicon Valley Design System (Teintes sophistiquées, jamais criardes)
  const mainColor = isCritical
    ? '#e11d48' // Rose/Rouge Alerte profond
    : isWarning
    ? '#d97706' // Ambre industriel
    : role === 'database'
    ? '#0d9488' // Teal Ingénierie
    : role === 'gateway'
    ? '#1e293b' // Slate Anthracite Pro pour la sécurité/proxy
    : '#0284c7'; // Bleu Cargo Maersk

  const ribColor = isCritical
    ? '#be123c'
    : isWarning
    ? '#b45309'
    : role === 'database'
    ? '#0f766e'
    : role === 'gateway'
    ? '#0f172a'
    : '#0369a1';

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetY = hovered || isSelected ? 0.58 : 0.52;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 12);
    }
    if (beaconRef.current && isCritical) {
      beaconRef.current.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 10) * 1.0;
    }
  });

  const edgeColor = isSelected ? '#0284c7' : hovered ? '#38bdf8' : '#334155';

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Marquage de baie CAD au sol (Slot d'accueil) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[2.16, 1.36]} />
        <meshBasicMaterial
          color={isSelected ? '#0284c7' : isCritical ? '#e11d48' : '#94a3b8'}
          transparent
          opacity={isSelected ? 0.28 : isCritical ? 0.25 : 0.15}
        />
      </mesh>

      {/* Unité 3D détaillée */}
      <group
        ref={groupRef}
        position={[0, 0.52, 0]}
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
        {role === 'database' ? (
          /* CITERNE ISO HAUTE PRÉCISION (Tank Container) */
          <group>
            {/* Poutrelles du cadre ISO */}
            <RoundedBox args={[1.92, 1.0, 1.14]} radius={0.02} smoothness={2}>
              <meshStandardMaterial color="#334155" wireframe />
            </RoundedBox>
            {/* Cuve pressurisée blanche satinée */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.45, 0.45, 1.78, 32]} />
              <meshStandardMaterial
                color={isCritical ? '#ffe4e6' : '#ffffff'}
                roughness={0.2}
                metalness={0.25}
              />
              <Edges scale={1.002} threshold={15} color="#cbd5e1" />
            </mesh>
            {/* Anneaux structurels et bande d'identification */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.465, 0.465, 0.38, 32]} />
              <meshStandardMaterial color={mainColor} roughness={0.3} />
            </mesh>
            {/* Vanne supérieure d'inspection */}
            <mesh position={[0, 0.48, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        ) : role === 'gateway' ? (
          /* MODULE DE SÉCURITÉ / PASSERELLE RÉSEAU (Style Serveur Edge) */
          <group>
            <RoundedBox args={[1.92, 0.94, 1.14]} radius={0.04} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color={mainColor} roughness={0.35} metalness={0.4} />
              <Edges scale={1.003} threshold={15} color={edgeColor} />
            </RoundedBox>
            {/* Unité optique/radar supérieure */}
            <RoundedBox position={[-0.22, 0.62, 0]} args={[1.15, 0.34, 0.88]} radius={0.03} smoothness={4} castShadow>
              <meshStandardMaterial color="#ffffff" roughness={0.25} />
              <Edges scale={1.005} color="#cbd5e1" />
            </RoundedBox>
            {/* Bandeau lumineux d'état réseau */}
            <mesh position={[-0.22, 0.62, 0]}>
              <boxGeometry args={[1.17, 0.08, 0.9]} />
              <meshStandardMaterial
                color={isCritical ? '#e11d48' : '#0ea5e9'}
                emissive={isCritical ? '#e11d48' : '#0284c7'}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ) : (
          /* CONTENEUR MARITIME ISO 20 PIEDS ARCHITECTURAL */
          <group>
            {/* Corps principal */}
            <RoundedBox args={[1.92, 1.0, 1.14]} radius={0.03} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.2} />
              <Edges scale={1.003} threshold={15} color={edgeColor} />
            </RoundedBox>

            {/* Nervures de tôle latérales */}
            {[-0.64, -0.32, 0, 0.32, 0.64].map((rx, i) => (
              <mesh key={i} position={[rx, 0, 0]} castShadow>
                <boxGeometry args={[0.1, 0.86, 1.17]} />
                <meshStandardMaterial color={ribColor} roughness={0.5} />
              </mesh>
            ))}

            {/* Panneau blanc de matricule logistique sur le flanc */}
            <mesh position={[-0.55, 0.22, 0.59]}>
              <boxGeometry args={[0.42, 0.16, 0.01]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Crémones (barres de verrouillage en acier inoxydable) à l'avant */}
            <mesh position={[0.97, 0, 0.22]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 12]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.15} />
            </mesh>
            <mesh position={[0.97, 0, -0.22]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 12]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.15} />
            </mesh>
          </group>
        )}

        {/* Balise lumineuse d'incident (uniquement si Exited/Critical) */}
        {isCritical && (
          <mesh position={[0.65, 0.58, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.16, 16]} />
            <meshStandardMaterial ref={beaconRef} color="#e11d48" emissive="#e11d48" emissiveIntensity={2} />
          </mesh>
        )}
      </group>

      {/* Tooltip / Badge flottant style Linear */}
      {shouldShowLabel && (
        <Html position={[0, 1.62, 0]} center zIndexRange={[10, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              selectNode(isSelected ? null : node.id);
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap border transition-all cursor-pointer select-none flex items-center gap-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.12)] ${
              isSelected
                ? 'bg-slate-900 border-slate-900 text-white font-semibold scale-105'
                : isCritical
                ? 'bg-rose-600 border-rose-700 text-white font-semibold'
                : 'bg-white/95 backdrop-blur-md border-slate-200/90 text-slate-800 font-medium'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCritical ? 'bg-white animate-ping' : isSelected ? 'bg-sky-400' : 'bg-emerald-500'
              }`}
            />
            <span className="tracking-tight">{node.name}</span>
            <span
              className={`text-[9px] pl-1.5 border-l tabular-nums ${
                isSelected || isCritical ? 'border-white/25 text-white/85' : 'border-slate-200 text-slate-400'
              }`}
            >
              {node.cpuUsage ?? 0}%
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}