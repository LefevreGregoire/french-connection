import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function GantryCrane({ position, color = '#e11d48' }: { position: [number, number, number]; color?: string }) {
  const trolleyRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (trolleyRef.current) {
      trolleyRef.current.position.z = 1.2 + Math.sin(state.clock.elapsedTime * 0.45 + position[0]) * 1.1;
    }
  });

  return (
    <group position={position}>
      {[
        [-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 1.9, lz]} castShadow>
          <boxGeometry args={[0.16, 3.8, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
          <Edges scale={1} color="#0f172a" />
        </mesh>
      ))}

      <mesh position={[-0.9, 1.6, 0]} castShadow>
        <boxGeometry args={[0.12, 0.14, 1.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.9, 1.6, 0]} castShadow>
        <boxGeometry args={[0.12, 0.14, 1.4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <RoundedBox args={[2.2, 0.45, 1.8]} radius={0.04} position={[0, 3.9, 0]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
        <Edges scale={1} color="#cbd5e1" />
      </RoundedBox>

      <mesh position={[0, 4.25, 1.4]} castShadow>
        <boxGeometry args={[0.85, 0.22, 5.6]} />
        <meshStandardMaterial color={color} roughness={0.4} />
        <Edges scale={1} color="#9f1239" />
      </mesh>

      <mesh position={[0, 4.9, -0.4]} castShadow>
        <boxGeometry args={[1.5, 1.2, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <group ref={trolleyRef} position={[0, 4.05, 1.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.16, 0.7]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        <mesh position={[-0.22, -0.7, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 8]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[0.22, -0.7, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 8]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[0, -1.4, 0]} castShadow>
          <boxGeometry args={[0.9, 0.1, 0.5]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function AutonomousAgv({ zLane, speed, cargoColor, offset = 0 }: { zLane: number; speed: number; cargoColor: string; offset?: number }) {
  const agvRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!agvRef.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    agvRef.current.position.x = Math.sin(t) * 8.5;
  });

  return (
    <group ref={agvRef} position={[0, 0.12, zLane]}>
      <RoundedBox args={[1.55, 0.14, 0.72]} radius={0.03} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
        <Edges scale={1} color="#eab308" />
      </RoundedBox>
      <mesh position={[0.78, 0, 0]}><boxGeometry args={[0.03, 0.08, 0.6]} /><meshBasicMaterial color="#38bdf8" /></mesh>
      <mesh position={[-0.78, 0, 0]}><boxGeometry args={[0.03, 0.08, 0.6]} /><meshBasicMaterial color="#38bdf8" /></mesh>
      <RoundedBox args={[1.25, 0.52, 0.62]} radius={0.02} position={[0, 0.33, 0]} castShadow>
        <meshStandardMaterial color={cargoColor} roughness={0.4} />
        <Edges scale={1} color="#0f172a" />
      </RoundedBox>
    </group>
  );
}

function HarborTugboat({ showAllLabels }: { showAllLabels: boolean }) {
  const tugRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!tugRef.current) return;
    const t = state.clock.elapsedTime * 0.28;
    const nextX = Math.sin(t) * 9.5;
    const nextZ = 6.8 + Math.cos(t * 2) * 1.1;

    const dx = nextX - tugRef.current.position.x;
    const dz = nextZ - tugRef.current.position.z;
    if (Math.hypot(dx, dz) > 0.001) {
      tugRef.current.rotation.y = Math.atan2(dx, dz);
    }

    tugRef.current.position.x = nextX;
    tugRef.current.position.z = nextZ;
    tugRef.current.position.y = -0.18 + Math.sin(state.clock.elapsedTime * 2.2) * 0.025;
  });

  return (
    <group ref={tugRef} position={[0, -0.18, 6.8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -1.1]}>
        <planeGeometry args={[0.65, 1.4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <RoundedBox args={[0.95, 0.32, 1.55]} radius={0.06} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
        <Edges scale={1} color="#f97316" />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.38, 0.72]} radius={0.03} position={[0, 0.42, 0.1]} castShadow>
        <meshStandardMaterial color="#f97316" roughness={0.35} />
        <Edges scale={1} color="#ffffff" />
      </RoundedBox>
      <mesh position={[0.18, 0.55, -0.35]}><cylinderGeometry args={[0.06, 0.06, 0.35, 10]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[-0.18, 0.55, -0.35]}><cylinderGeometry args={[0.06, 0.06, 0.35, 10]} /><meshStandardMaterial color="#0f172a" /></mesh>
      {showAllLabels && (
        <Html position={[0, 1.1, 0]} center zIndexRange={[5, 0]}>
          <div className="px-2 py-0.5 rounded-full bg-white/95 border border-slate-200 text-slate-600 text-[8px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
            WATCHDOG // TUG-01
          </div>
        </Html>
      )}
    </group>
  );
}

function WindTurbine({ position }: { position: [number, number, number] }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z -= delta * 1.4;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.22, 4.6, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} />
      </mesh>
      <RoundedBox args={[0.32, 0.28, 0.65]} radius={0.05} position={[0, 4.6, 0.1]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        <Edges scale={1} color="#cbd5e1" />
      </RoundedBox>
      <group ref={rotorRef} position={[0, 4.6, 0.45]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.25, 16]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            <mesh position={[0, 0.95, 0]} castShadow>
              <boxGeometry args={[0.11, 1.85, 0.025]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function BreakwaterLighthouse({ position, showAllLabels }: { position: [number, number, number]; showAllLabels: boolean }) {
  const beamRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (beamRef.current) {
      beamRef.current.rotation.y += delta * 1.1;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.35, 1.6, 0.35, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        <Edges scale={1} color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.52, 1.0, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.38, 0.65, 16]} />
        <meshStandardMaterial color="#e11d48" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.45, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.35, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, 2.58, 0]}>
        <coneGeometry args={[0.28, 0.25, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <group ref={beamRef} position={[0, 2.3, 0]}>
        <mesh position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.65, 3.2, 16, 1, true]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.18} side={2} />
        </mesh>
      </group>
      {showAllLabels && (
        <Html position={[0, 3.1, 0]} center zIndexRange={[5, 0]}>
          <div className="px-2 py-0.5 rounded-full bg-white/95 border border-slate-200 text-slate-600 text-[8px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
            DNS // LIGHTHOUSE
          </div>
        </Html>
      )}
    </group>
  );
}

function ChannelBuoy({ position, color }: { position: [number, number, number]; color: string }) {
  const buoyRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (buoyRef.current) {
      buoyRef.current.position.y = Math.sin(t * 2 + position[0]) * 0.04;
      buoyRef.current.rotation.z = Math.cos(t * 1.5 + position[2]) * 0.05;
    }
    if (lightRef.current) {
      lightRef.current.emissiveIntensity = 1.2 + Math.sin(t * 5 + position[0]) * 1.0;
    }
  });

  return (
    <group position={position}>
      <group ref={buoyRef}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.42, 0.25, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.06, 0.14, 0.55, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.74, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial ref={lightRef} color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  );
}

function DockLightPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.2, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.18, 0.22]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.08, 0.05, 0.5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 2.14, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshBasicMaterial color="#fef08a" side={2} />
      </mesh>
    </group>
  );
}

export function HarborEnvironment({ showAllLabels = false }: { showAllLabels?: boolean }) {
  const waterRef = useRef<THREE.Mesh>(null!);
  const radarRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (waterRef.current) {
      waterRef.current.position.y = -0.26 + Math.sin(state.clock.elapsedTime * 0.9) * 0.015;
    }
    if (radarRef.current) {
      radarRef.current.rotation.y += delta * 1.8;
    }
  });

  return (
    <group>
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#bae6fd" roughness={0.15} metalness={0.1} transparent opacity={0.62} />
      </mesh>

      <group position={[0, 0, -6.8]}>
        <RoundedBox args={[38, 0.42, 6.4]} radius={0.08} smoothness={4} position={[0, -0.18, 0]} receiveShadow castShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.05} />
          <Edges scale={1} threshold={15} color="#cbd5e1" />
        </RoundedBox>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0.4]} receiveShadow>
          <planeGeometry args={[36.5, 5.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
        </mesh>

        {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((dashX, i) => (
          <mesh key={`road-dash-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[dashX, 0.04, -0.9]}>
            <planeGeometry args={[0.9, 0.08]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}

        <AutonomousAgv zLane={-0.45} speed={0.35} cargoColor="#0284c7" offset={0} />
        <AutonomousAgv zLane={-1.35} speed={0.28} cargoColor="#0d9488" offset={2.5} />

        <mesh position={[0, 0.04, 1.3]}><boxGeometry args={[34, 0.02, 0.06]} /><meshStandardMaterial color="#64748b" metalness={0.8} /></mesh>
        <mesh position={[0, 0.04, 2.7]}><boxGeometry args={[34, 0.02, 0.06]} /><meshStandardMaterial color="#64748b" metalness={0.8} /></mesh>

        <mesh position={[0, 0.045, 3.0]}><boxGeometry args={[37, 0.02, 0.12]} /><meshBasicMaterial color="#f59e0b" /></mesh>

        <group position={[0, 0.04, 0.8]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.55, 0.68, 6]} /><meshBasicMaterial color="#eab308" side={2} /></mesh>
          <mesh position={[0, 0.35, -0.45]}><boxGeometry args={[0.7, 0.7, 0.12]} /><meshStandardMaterial color="#1e293b" /><Edges scale={1} color="#eab308" /></mesh>
          <mesh position={[0, 0.45, -0.38]}><planeGeometry args={[0.45, 0.12]} /><meshBasicMaterial color="#10b981" /></mesh>
        </group>

        {[-7.8, 0, 7.8].map((dockX, i) => (
          <group key={`causeway-${i}`} position={[dockX, -0.14, 3.7]}>
            <RoundedBox args={[3.4, 0.3, 1.6]} radius={0.04} receiveShadow castShadow>
              <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
              <Edges scale={1} color="#cbd5e1" />
            </RoundedBox>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.155, 0]}><planeGeometry args={[1.4, 1.5]} /><meshBasicMaterial color="#cbd5e1" /></mesh>
          </group>
        ))}

        <GantryCrane position={[-4.2, 0.04, 2.0]} color="#e11d48" />
        <GantryCrane position={[4.2, 0.04, 2.0]} color="#0284c7" />

        <group position={[-12.5, 0.04, -0.6]}>
          <RoundedBox args={[3.6, 1.4, 2.6]} radius={0.05} position={[0, 0.7, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
            <Edges scale={1} color="#cbd5e1" />
          </RoundedBox>
          <RoundedBox args={[2.3, 1.1, 1.9]} radius={0.04} position={[0.35, 1.9, 0]} castShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.7} />
            <Edges scale={1} color="#334155" />
          </RoundedBox>

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.35, 2.46, 0]}><ringGeometry args={[0.55, 0.64, 32]} /><meshBasicMaterial color="#facc15" side={2} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.18, 2.46, 0]}><planeGeometry args={[0.08, 0.45]} /><meshBasicMaterial color="#facc15" /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.52, 2.46, 0]}><planeGeometry args={[0.08, 0.45]} /><meshBasicMaterial color="#facc15" /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.35, 2.46, 0]}><planeGeometry args={[0.34, 0.08]} /><meshBasicMaterial color="#facc15" /></mesh>

          <group ref={radarRef} position={[-1.1, 1.55, 0.6]}>
            <mesh><cylinderGeometry args={[0.06, 0.08, 0.3, 12]} /><meshStandardMaterial color="#475569" /></mesh>
            <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.75, 0.12, 0.08]} /><meshStandardMaterial color="#0284c7" /></mesh>
          </group>

          {showAllLabels && (
            <Html position={[0.3, 3.2, 0]} center zIndexRange={[5, 0]}>
              <div className="px-2 py-0.5 rounded-full bg-white/95 border border-slate-200 text-slate-600 text-[9px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
                PORT AUTHORITY // NEXUS HQ
              </div>
            </Html>
          )}
        </group>

        <group position={[12.8, 0.04, -0.5]}>
          {[
            { pos: [-1.1, 0.4, -0.6], color: '#64748b' },
            { pos: [-1.1, 1.18, -0.6], color: '#0284c7' },
            { pos: [0.9, 0.4, -0.6], color: '#475569' },
            { pos: [0.9, 1.18, -0.6], color: '#0d9488' },
            { pos: [0, 0.4, 0.7], color: '#94a3b8' },
          ].map((c, idx) => (
            <RoundedBox key={idx} args={[1.7, 0.75, 0.95]} radius={0.03} position={c.pos as [number, number, number]} castShadow receiveShadow>
              <meshStandardMaterial color={c.color} roughness={0.5} />
              <Edges scale={1} color="#334155" />
            </RoundedBox>
          ))}
          {showAllLabels && (
            <Html position={[0, 2.1, 0]} center zIndexRange={[5, 0]}>
              <div className="px-2 py-0.5 rounded-full bg-white/95 border border-slate-200 text-slate-600 text-[9px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
                IMAGE REGISTRY // CACHE
              </div>
            </Html>
          )}
        </group>

        <WindTurbine position={[16.8, 0.04, -1.2]} />

        {[-9.5, -1.5, 1.5, 9.5].map((lx, idx) => (
          <DockLightPole key={idx} position={[lx, 0.04, 0.2]} />
        ))}
      </group>

      {[-3.9, 3.9].map((bridgeX, idx) => (
        <group key={`inter-pier-${idx}`} position={[bridgeX, -0.06, 0]}>
          <RoundedBox args={[2.9, 0.12, 1.1]} radius={0.02} receiveShadow castShadow>
            <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.3} />
            <Edges scale={1} color="#94a3b8" />
          </RoundedBox>
          <mesh position={[0, 0.14, 0.48]}><boxGeometry args={[2.8, 0.16, 0.04]} /><meshStandardMaterial color="#f59e0b" /></mesh>
          <mesh position={[0, 0.14, -0.48]}><boxGeometry args={[2.8, 0.16, 0.04]} /><meshStandardMaterial color="#f59e0b" /></mesh>
        </group>
      ))}

      <BreakwaterLighthouse position={[-15.8, 0, 5.2]} showAllLabels={showAllLabels} />
      <HarborTugboat showAllLabels={showAllLabels} />

      <ChannelBuoy position={[-11.5, -0.22, 5.6]} color="#e11d48" />
      <ChannelBuoy position={[-4.5, -0.22, 4.8]} color="#f59e0b" />
      <ChannelBuoy position={[4.5, -0.22, 4.8]} color="#10b981" />
      <ChannelBuoy position={[12.5, -0.22, 5.4]} color="#10b981" />
    </group>
  );
}