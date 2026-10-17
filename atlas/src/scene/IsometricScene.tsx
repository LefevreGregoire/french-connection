import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrthographicCamera,
  MapControls,
  Grid,
  QuadraticBezierLine,
  Html,
  ContactShadows,
  Edges,
  RoundedBox,
} from '@react-three/drei';
import * as THREE from 'three';
import { useTopologyStore, VisualAlertLevel, type ContainerNode } from '../store/useTopologyStore';
import { ContainerCube } from './ContainerCube';
import { SubnetPlatform } from './SubnetPlatform';
import { McpSpotRobot } from './McpSpotRobot';
import { HarborEnvironment } from './HarborEnvironment';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

export type CameraPreset = 'iso' | 'top' | 'spot';

const SUBNET_ZONES: Record<string, { centerX: number; color: string }> = {
  'dmz':         { centerX: -7.8, color: '#f59e0b' },
  'lan-backend': { centerX: 0,    color: '#0284c7' },
  'lan-data':    { centerX: 7.8,  color: '#0d9488' },
};

// Contrôleur fluide de transition de caméra entre les vues ISO, TOP-DOWN 2D et FOLLOW SPOT
function CameraRig({
  preset,
  spotPosition,
}: {
  preset: CameraPreset;
  spotPosition: React.MutableRefObject<THREE.Vector3>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (preset === 'top') {
      state.camera.position.lerp(new THREE.Vector3(0, 38, 0.01), delta * 4);
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
    } else if (preset === 'spot') {
      const p = spotPosition.current;
      state.camera.position.lerp(new THREE.Vector3(p.x + 14, 16, p.z + 14), delta * 4);
      controlsRef.current.target.lerp(new THREE.Vector3(p.x, 0.5, p.z), delta * 6);
    }
    controlsRef.current.update();
  });

  return (
    <MapControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minZoom={18}
      maxZoom={95}
      maxPolarAngle={preset === 'top' ? 0.05 : Math.PI / 2.35}
      minPolarAngle={preset === 'top' ? 0 : Math.PI / 6}
    />
  );
}

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
    () => [(start[0] + end[0]) / 2, 2.65, (start[2] + end[2]) / 2],
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
    const t = (state.clock.elapsedTime * 0.38 + speedOffset) % 1;
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
        lineWidth={isCritical ? 1.6 : 1.4}
        dashed
        dashScale={8}
        dashSize={0.3}
        gapSize={0.22}
      />
      {!isCritical && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      )}
    </group>
  );
}

function WanCargoVessel({ position, showAllLabels }: { position: [number, number, number]; showAllLabels: boolean }) {
  const shipRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (shipRef.current) {
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.035;
    }
  });

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={shipRef}>
        <RoundedBox args={[2.5, 0.46, 4.7]} radius={0.05} smoothness={4} position={[0, 0.14, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.3} />
          <Edges scale={1} color="#0f172a" />
        </RoundedBox>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[2.52, 0.12, 4.72]} />
          <meshStandardMaterial color="#9f1239" roughness={0.6} />
        </mesh>
        <RoundedBox args={[1.8, 0.85, 0.95]} radius={0.03} smoothness={4} position={[0, 0.78, -1.55]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.25} />
          <Edges scale={1} color="#cbd5e1" />
        </RoundedBox>
        <mesh position={[0, 1.02, -1.07]}>
          <boxGeometry args={[1.6, 0.14, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
        </mesh>
        <RoundedBox args={[0.82, 0.5, 2.2]} radius={0.02} position={[-0.45, 0.6, 0.55]} castShadow>
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
          <Edges scale={1} color="#0369a1" />
        </RoundedBox>
        <RoundedBox args={[0.82, 0.5, 2.2]} radius={0.02} position={[0.45, 0.6, 0.55]} castShadow>
          <meshStandardMaterial color="#0d9488" roughness={0.4} />
          <Edges scale={1} color="#0f766e" />
        </RoundedBox>
      </group>

      {(hovered || showAllLabels) && (
        <Html position={[0, 1.85, 0]} center zIndexRange={[5, 0]}>
          <div className="px-2.5 py-0.5 rounded-full bg-white/95 border border-slate-200 text-slate-700 text-[9px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap select-none shadow-sm">
            WAN // INGRESS VESSEL
          </div>
        </Html>
      )}
    </group>
  );
}

export function IsometricScene({
  showAllLabels = false,
  cameraPreset = 'iso',
}: {
  showAllLabels?: boolean;
  cameraPreset?: CameraPreset;
}) {
  const nodes = useTopologyStore((s) => s.nodes) ?? [];
  const selectNode = useTopologyStore((s) => s.selectNode);
  const activeTargetId = useTopologyStore((s) => s.activeTargetId);
  const safeNodes = Array.isArray(nodes) ? nodes : [];

  const spotPosRef = useRef(new THREE.Vector3(0, 0, 3.25));
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
          <color attach="background" args={['#eef2f6']} />
          <fog attach="fog" args={['#eef2f6', 60, 115]} />

          <OrthographicCamera makeDefault position={[22, 22, 22]} zoom={34} near={-100} far={200} />

          <CameraRig preset={cameraPreset} spotPosition={spotPosRef} />

          <ambientLight intensity={1.7} />
          <directionalLight position={[22, 38, 16]} intensity={1.6} castShadow />
          <directionalLight position={[-18, 22, -12]} intensity={0.6} color="#e0f2fe" />

          <Grid
            position={[0, -0.32, 0]}
            args={[110, 110]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#dde4ed"
            sectionSize={4}
            sectionThickness={1}
            sectionColor="#cbd5e1"
            fadeDistance={75}
            fadeStrength={1.2}
          />

          <ContactShadows
            position={[0, -0.31, 0]}
            opacity={0.28}
            scale={45}
            blur={2.4}
            far={10}
            color="#0f172a"
          />

          {/* DÉCOR DE TERMINAL MARITIME SRE */}
          <HarborEnvironment showAllLabels={showAllLabels} />

          <WanCargoVessel position={wanPos} showAllLabels={showAllLabels} />

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

          {/* Robot Quadrupède Boston Dynamics Spot */}
          <McpSpotRobot
            targetPos={targetPos}
            showAllLabels={showAllLabels}
            onPositionUpdate={(pos) => spotPosRef.current.copy(pos)}
          />

          {positionedNodes.map(({ node, position }) => (
            <ContainerCube
              key={node.id}
              node={node}
              position={position}
              showAllLabels={showAllLabels}
            />
          ))}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}