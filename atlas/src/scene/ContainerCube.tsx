import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { type ContainerNode, VisualAlertLevel, useTopologyStore } from '../store/useTopologyStore';

interface Props {
  node: ContainerNode;
  position: [number, number, number];
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

export function ContainerCube({ node, position }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null!);
  const [hovered, setHovered] = useState(false);

  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId);
  const selectNode = useTopologyStore((s) => s.selectNode);
  const isSelected = selectedNodeId === node.id;

  const role = getNodeRole(node);
  const isCritical = node.alertLevel === VisualAlertLevel.Critical;
  const isWarning = node.alertLevel === VisualAlertLevel.Warning;

  // Couleurs maritimes claires et franches en plein jour
  const mainColor = isCritical
    ? '#e11d48' // Rouge Avarie vif
    : isWarning
    ? '#f59e0b' // Ambre Maintenance
    : role === 'database'
    ? '#0d9488' // Teal / Émeraude pour le stockage
    : role === 'gateway'
    ? '#2563eb' // Bleu Royal pour les passerelles réseau
    : '#0284c7'; // Bleu Conteneur Maersk pour les apps

  const ribColor = isCritical
    ? '#be123c'
    : isWarning
    ? '#d97706'
    : role === 'database'
    ? '#0f766e'
    : role === 'gateway'
    ? '#1d4ed8'
    : '#0369a1';

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetScale = hovered || isSelected ? 1.05 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);
    }
    if (beaconRef.current && isCritical) {
      beaconRef.current.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 10) * 1.2;
    }
  });

  const edgeColor = isSelected ? '#0f172a' : hovered ? '#38bdf8' : '#1e293b';

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Marquage de stationnement au sol sur le béton clair */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[2.15, 1.4]} />
        <meshBasicMaterial
          color={isSelected ? '#0284c7' : isCritical ? '#e11d48' : '#94a3b8'}
          transparent
          opacity={isSelected ? 0.35 : 0.25}
        />
      </mesh>

      {/* Modèle 3D posé sur le quai */}
      <group
        ref={groupRef}
        position={[0, 0.54, 0]}
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
          /* CITERNE ISO (Tank Container) Blanche & Émeraude (ou Rouge si panne) */
          <group>
            {/* Armature métallique ISO */}
            <mesh>
              <boxGeometry args={[1.88, 1.02, 1.12]} />
              <meshStandardMaterial color="#475569" wireframe />
            </mesh>
            {/* Cuve cylindrique claire très lisible */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.46, 0.46, 1.76, 32]} />
              <meshStandardMaterial
                color={isCritical ? '#fecdd3' : '#f8fafc'}
                roughness={0.25}
                metalness={0.2}
              />
              <Edges scale={1.005} threshold={15} color={edgeColor} />
            </mesh>
            {/* Bande centrale d'identification couleur */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.47, 0.47, 0.45, 32]} />
              <meshStandardMaterial color={mainColor} roughness={0.35} />
            </mesh>
          </group>
        ) : role === 'gateway' ? (
          /* POSTE DE CONTRÔLE / PASSERELLE RÉSEAU */
          <group>
            <RoundedBox args={[1.88, 0.92, 1.12]} radius={0.03} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.15} />
              <Edges scale={1.005} threshold={15} color={edgeColor} />
            </RoundedBox>
            {/* Cabine supérieure blanche vitrée */}
            <RoundedBox position={[-0.2, 0.64, 0]} args={[1.1, 0.42, 0.9]} radius={0.02} smoothness={4} castShadow>
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
              <Edges scale={1.01} color="#475569" />
            </RoundedBox>
            {/* Bandeau vitré bleu ciel */}
            <mesh position={[-0.18, 0.66, 0]}>
              <boxGeometry args={[1.12, 0.16, 0.92]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.6} />
            </mesh>
          </group>
        ) : (
          /* CONTENEUR MARITIME ISO 20 PIEDS (Tôle ondulée + Portes acier) */
          <group>
            <RoundedBox args={[1.9, 1.02, 1.12]} radius={0.03} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color={mainColor} roughness={0.45} metalness={0.15} />
              <Edges scale={1.005} threshold={15} color={edgeColor} />
            </RoundedBox>

            {/* Nervures de tôle ondulée */}
            {[-0.64, -0.32, 0, 0.32, 0.64].map((rx, i) => (
              <mesh key={i} position={[rx, 0, 0]} castShadow>
                <boxGeometry args={[0.11, 0.88, 1.15]} />
                <meshStandardMaterial color={ribColor} roughness={0.5} />
              </mesh>
            ))}

            {/* Crémones (barres de fermeture) en acier clair sur la porte avant */}
            <mesh position={[0.96, 0, 0.22]}>
              <cylinderGeometry args={[0.025, 0.025, 0.92, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.96, 0, -0.22]}>
              <cylinderGeometry args={[0.025, 0.025, 0.92, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* Gyrophare d'alerte lumineux en cas de panne */}
        {isCritical && (
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.22, 16]} />
            <meshStandardMaterial ref={beaconRef} color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
          </mesh>
        )}
      </group>

      {/* Étiquette Blanche "Light Mode" ultra lisible */}
      <Html position={[0, 1.72, 0]} center zIndexRange={[10, 0]}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectNode(isSelected ? null : node.id);
          }}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap border transition-all cursor-pointer select-none flex items-center gap-2 shadow-md ${
            isSelected
              ? 'bg-sky-600 border-slate-900 text-white shadow-lg scale-105 font-semibold'
              : isCritical
              ? 'bg-rose-600 border-rose-800 text-white font-semibold'
              : 'bg-white/95 border-slate-300 text-slate-800 hover:border-sky-500 font-medium'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCritical ? 'bg-white animate-ping' : isSelected ? 'bg-white' : 'bg-emerald-500'
            }`}
          />
          <span>{node.name}</span>
          <span
            className={`text-[9px] pl-1.5 border-l tabular-nums ${
              isSelected || isCritical ? 'border-white/30 text-white/90' : 'border-slate-200 text-slate-500'
            }`}
          >
            {node.cpuUsage ?? 0}%
          </span>
        </div>
      </Html>
    </group>
  );
}