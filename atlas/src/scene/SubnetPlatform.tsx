import { Edges, Html, RoundedBox } from '@react-three/drei';

interface SubnetPlatformProps {
  name: string;
  position: [number, number, number];
  size: [number, number];
  accentColor: string;
}

export function SubnetPlatform({ name, position, size, accentColor }: SubnetPlatformProps) {
  const [w, d] = size;

  return (
    <group position={position}>
      {/* Châssis principal du Quai : Béton architectural chanfreiné */}
      <RoundedBox
        args={[w, 0.34, d]}
        radius={0.06}
        smoothness={4}
        position={[0, -0.17, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.05} />
        <Edges scale={1} threshold={15} color="#cbd5e1" />
      </RoundedBox>

      {/* Plateau technique intérieur encastré */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[w - 0.45, d - 0.45]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Rail lumineux / Bande de statut latérale encastrée */}
      <mesh position={[-w / 2 + 0.12, 0.01, 0]}>
        <boxGeometry args={[0.06, 0.02, d - 0.6]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
      <mesh position={[w / 2 - 0.12, 0.01, 0]}>
        <boxGeometry args={[0.06, 0.02, d - 0.6]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* Bollards d'amarrage en acier anthracite aux 4 coins du quai */}
      {[
        [-w / 2 + 0.28, -d / 2 + 0.28],
        [w / 2 - 0.28, -d / 2 + 0.28],
        [-w / 2 + 0.28, d / 2 - 0.28],
        [w / 2 - 0.28, d / 2 - 0.28],
      ].map(([bx, bz], idx) => (
        <mesh key={`bollard-${idx}`} position={[bx, 0.06, bz]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.12, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Piliers structurels en acier sous le quai */}
      {[
        [-w / 2 + 0.55, -d / 2 + 0.55],
        [w / 2 - 0.55, -d / 2 + 0.55],
        [-w / 2 + 0.55, d / 2 - 0.55],
        [w / 2 - 0.55, d / 2 - 0.55],
      ].map(([px, pz], idx) => (
        <group key={`pillar-${idx}`} position={[px, -0.75, pz]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 1.0, 20]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Bague de jonction au niveau de l'eau */}
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.08, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Étiquette de Zone style "Apple / Linear" encastrée à l'avant du quai */}
      <Html position={[0, 0.02, d / 2 + 0.42]} center zIndexRange={[5, 0]}>
        <div className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-700 whitespace-nowrap select-none pointer-events-none shadow-[0_2px_8px_rgba(15,23,42,0.06)] flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-slate-400 font-normal">SECTOR</span>
          <span className="text-slate-900">{name}</span>
        </div>
      </Html>
    </group>
  );
}