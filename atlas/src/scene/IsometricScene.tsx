import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrthographicCamera,
  MapControls,
  Grid,
  QuadraticBezierLine,
  Html,
  ContactShadows,
  Edges,
} from '@react-three/drei';
import * as THREE from 'three';
import { useTopologyStore, VisualAlertLevel, type ContainerNode } from '../store/useTopologyStore';
import { ContainerCube } from './ContainerCube';
import { SubnetPlatform } from './SubnetPlatform';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

const SUBNET_ZONES: Record<string, { centerX: number; color: string }> = {
  'dmz':         { centerX: -7.8, color: '#f59e0b' }, // Ambre Douane / DMZ
  'lan-backend': { centerX: 0,    color: '#0284c7' }, // Bleu Applicatif
  'lan-data':    { centerX: 7.8,  color: '#0d9488' }, // Émeraude Stockage
};

function ParabolicTrafficArc({
  start,
  end,
  isCritical,
  speedOffset = 0,
}: {
  start: [number, number, number];
  end: [number, number, number];
  isCritical: boolean;
  speedOffset?: number;
}) {
  const packetRef = useRef<THREE.Mesh>(null!);

  const mid: [number, number, number] = useMemo(
    () => [(start[0] + end[0]) / 2, 2.8, (start[2] + end[2]) / 2],
    [start, end]
  );

  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...mid),
        new THREE.Vector3(...end)
      ),
    [start, mid, end]
  );

  useFrame((state) => {
    if (!packetRef.current || isCritical) return;
    const t = (state.clock.elapsedTime * 0.4 + speedOffset) % 1;
    const pos = curve.getPoint(t);
    packetRef.current.position.copy(pos);
  });

  const color = isCritical ? '#e11d48' : '#0284c7';

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={mid}
        color={color}
        lineWidth={isCritical ? 1.8 : 2}
        dashed
        dashScale={7}
        dashSize={0.35}
        gapSize={0.22}
      />
      {!isCritical && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      )}
    </group>
  );
}

// Porte-Conteneurs en plein jour (Coque bleu marine, château blanc, conteneurs colorés)
function WanCargoVessel({ position }: { position: [number, number, number] }) {
  const shipRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (shipRef.current) {
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.05;
    }
  });

  return (
    <group position={position}>
      <group ref={shipRef}>
        {/* Coque supérieure bleu marine */}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.5, 4.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
          <Edges scale={1} color="#0f172a" />
        </mesh>
        {/* Ligne de flottaison rouge brique */}
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[2.54, 0.16, 4.64]} />
          <meshStandardMaterial color="#be123c" roughness={0.6} />
        </mesh>
        {/* Château / Passerelle de commandement blanc */}
        <mesh position={[0, 0.82, -1.5]} castShadow>
          <boxGeometry args={[1.75, 0.85, 0.95]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
          <Edges scale={1} color="#94a3b8" />
        </mesh>
        {/* Conteneurs chargés sur le pont */}
        <mesh position={[-0.45, 0.62, 0.55]} castShadow>
          <boxGeometry args={[0.8, 0.52, 2.1]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
          <Edges scale={1} color="#0369a1" />
        </mesh>
        <mesh position={[0.45, 0.62, 0.55]} castShadow>
          <boxGeometry args={[0.8, 0.52, 2.1]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          <Edges scale={1} color="#b45309" />
        </mesh>
      </group>

      <Html position={[0, 1.95, 0]} center zIndexRange={[5, 0]}>
        <div className="px-2.5 py-1 rounded-md bg-white/95 border border-slate-300 text-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap select-none shadow-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>WAN // CARGO INGRESS</span>
        </div>
      </Html>
    </group>
  );
}

// L'Ingénieur / Chef de Quai IA avec son Casque de Chantier Jaune (Hard Hat)
function McpHardHatWorker({ targetPos }: { targetPos?: [number, number, number] }) {
  const workerGroup = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (!workerGroup.current) return;
    const t = state.clock.elapsedTime;

    const destX = targetPos ? targetPos[0] + 1.35 : Math.sin(t * 0.5) * 5.2;
    const destZ = targetPos ? targetPos[2] + 0.85 : 3.3;
    const walkBob = Math.abs(Math.sin(t * 6)) * 0.08;

    workerGroup.current.position.lerp(new THREE.Vector3(destX, walkBob, destZ), delta * (targetPos ? 6 : 2.2));

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 2;
    }
  });

  const isWorking = Boolean(targetPos);

  return (
    <group ref={workerGroup} position={[0, 0, 3.3]}>
      {/* Torse : Veste Haute Visibilité Orange/Ambre */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.34, 12, 24]} />
        <meshStandardMaterial color="#f97316" roughness={0.35} />
      </mesh>
      {/* Bandes réfléchissantes blanches */}
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.08, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Tête */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.4} />
      </mesh>

      {/* CASQUE DE CHANTIER JAUNE (Hard Hat bien net) */}
      <group position={[0, 1.08, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.21, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color="#facc15" roughness={0.2} />
        </mesh>
        {/* Visière avant du casque */}
        <mesh position={[0, -0.02, 0.05]} rotation={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.035, 24]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>

      {/* Anneau d'intervention au sol */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.38, 0.46, 32]} />
        <meshBasicMaterial color={isWorking ? '#e11d48' : '#0284c7'} side={2} />
      </mesh>

      <Html position={[0, 1.62, 0]} center zIndexRange={[15, 0]}>
        <div
          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap border select-none pointer-events-none shadow-md transition-all flex items-center gap-1.5 ${
            isWorking
              ? 'bg-amber-400 border-slate-900 text-slate-950 scale-105'
              : 'bg-slate-900 border-amber-400 text-amber-300'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>{isWorking ? 'MCP // INTERVENTION' : 'MCP // SITE ENGINEER'}</span>
        </div>
      </Html>
    </group>
  );
}

export function IsometricScene() {
  const nodes = useTopologyStore((s) => s.nodes) ?? [];
  const selectNode = useTopologyStore((s) => s.selectNode);
  const activeTargetId = useTopologyStore((s) => s.activeTargetId);
  const safeNodes = Array.isArray(nodes) ? nodes : [];

  const wanPos: [number, number, number] = [-13.8, 0, 0];

  const { positionedNodes, platforms, links, wanLinks } = useMemo(() => {
    const groups: Record<string, ContainerNode[]> = {};

    for (const node of safeNodes) {
      const primaryNet = node.networks?.[0] ?? 'default';
      if (!groups[primaryNet]) groups[primaryNet] = [];
      groups[primaryNet].push(node);
    }

    const posMap = new Map<string, [number, number, number]>();
    const platformList: Array<{ name: string; position: [number, number, number]; size: [number, number]; color: string }> = [];

    const zoneKeys = Object.keys(groups);
    zoneKeys.forEach((netName, zoneIdx) => {
      const zoneConfig = SUBNET_ZONES[netName] ?? {
        centerX: (zoneIdx - (zoneKeys.length - 1) / 2) * 7.8,
        color: '#64748b',
      };

      const members = groups[netName];
      const spacingZ = 3.2;

      members.forEach((node, idx) => {
        const z = (idx - (members.length - 1) / 2) * spacingZ;
        posMap.set(node.id, [zoneConfig.centerX, 0, z]);
      });

      const depth = Math.max(5.2, members.length * spacingZ + 2.0);
      platformList.push({
        name: netName,
        position: [zoneConfig.centerX, 0, 0],
        size: [5.0, depth],
        color: zoneConfig.color,
      });
    });

    const networkLinks: Array<{ start: [number, number, number]; end: [number, number, number]; isCritical: boolean }> = [];
    for (let i = 0; i < safeNodes.length; i++) {
      for (let j = i + 1; j < safeNodes.length; j++) {
        const a = safeNodes[i];
        const b = safeNodes[j];
        const sharedNet = a.networks?.some((net) => b.networks?.includes(net));
        const primaryA = a.networks?.[0];
        const primaryB = b.networks?.[0];

        if (sharedNet && primaryA !== primaryB) {
          const pA = posMap.get(a.id);
          const pB = posMap.get(b.id);
          if (pA && pB) {
            const isCritical =
              a.alertLevel === VisualAlertLevel.Critical || b.alertLevel === VisualAlertLevel.Critical;
            networkLinks.push({
              start: [pA[0], 1.05, pA[2]],
              end: [pB[0], 1.05, pB[2]],
              isCritical,
            });
          }
        }
      }
    }

    const dmzLinks = safeNodes
      .filter((n) => n.networks?.[0] === 'dmz')
      .map((n) => {
        const p = posMap.get(n.id) ?? [0, 0, 0];
        return {
          start: [wanPos[0] + 1.1, 1.0, wanPos[2]] as [number, number, number],
          end: [p[0], 1.05, p[2]] as [number, number, number],
          isCritical: n.alertLevel === VisualAlertLevel.Critical,
        };
      });

    return {
      positionedNodes: safeNodes.map((n) => ({
        node: n,
        position: posMap.get(n.id) ?? ([0, 0, 0] as [number, number, number]),
      })),
      platforms: platformList,
      links: networkLinks,
      wanLinks: dmzLinks,
    };
  }, [safeNodes]);

  const targetPos = positionedNodes.find((p) => p.node.id === activeTargetId)?.position;

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden">
      <CanvasErrorBoundary>
        <Canvas
          shadows
          onPointerMissed={() => selectNode(null)}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [22, 22, 22], zoom: 34 }}
        >
          {/* FOND CLAIR LUMINEUX : Bassin portuaire bleu azur doux */}
          <color attach="background" args={['#dbeafe']} />
          <fog attach="fog" args={['#dbeafe', 55, 110]} />

          <OrthographicCamera makeDefault position={[22, 22, 22]} zoom={34} near={-100} far={200} />

          <MapControls
            enableDamping
            dampingFactor={0.05}
            minZoom={18}
            maxZoom={90}
            maxPolarAngle={Math.PI / 2.35}
            minPolarAngle={Math.PI / 6}
          />

          {/* Éclairage Plein Jour (Soleil zénithal clair) */}
          <ambientLight intensity={1.6} />
          <directionalLight position={[20, 35, 15]} intensity={1.8} castShadow />
          <directionalLight position={[-18, 20, -10]} intensity={0.7} color="#ffffff" />

          {/* Grille claire type plan d'architecte (comme NodeVille) */}
          <Grid
            position={[0, -0.32, 0]}
            args={[100, 100]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#bfdbfe"
            sectionSize={4}
            sectionThickness={1.1}
            sectionColor="#93c5fd"
            fadeDistance={70}
            fadeStrength={1}
          />

          {/* Ombres de contact douces sous les quais */}
          <ContactShadows
            position={[0, -0.31, 0]}
            opacity={0.35}
            scale={45}
            blur={2.2}
            far={10}
            color="#1e3a8a"
          />

          <WanCargoVessel position={wanPos} />

          {platforms.map((p) => (
            <SubnetPlatform
              key={p.name}
              name={p.name}
              position={p.position}
              size={p.size}
              accentColor={p.color}
            />
          ))}

          {wanLinks.map((link, idx) => (
            <ParabolicTrafficArc
              key={`wan-${idx}`}
              start={link.start}
              end={link.end}
              isCritical={link.isCritical}
              speedOffset={idx * 0.35}
            />
          ))}

          {links.map((link, idx) => (
            <ParabolicTrafficArc
              key={`net-${idx}`}
              start={link.start}
              end={link.end}
              isCritical={link.isCritical}
              speedOffset={idx * 0.25}
            />
          ))}

          <McpHardHatWorker targetPos={targetPos} />

          {positionedNodes.map(({ node, position }) => (
            <ContainerCube key={node.id} node={node} position={position} />
          ))}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}