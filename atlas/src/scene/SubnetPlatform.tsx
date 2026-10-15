import { Edges, Html } from '@react-three/drei';

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
      {/* Structure principale du Quai : Béton architectural anthracite */}
      <mesh position={[0, -0.14, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, 0.28, d]} />
        <meshStandardMaterial color="#151d2a" roughness={0.65} metalness={0.35} />
        <Edges scale={1} threshold={15} color="#2e3d52" />
      </mesh>

      {/* Surface supérieure micro-texturée (Dalle technique) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[w - 0.35, d - 0.35]} />
        <meshStandardMaterial color="#101722" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* Liserés lumineux d'accostage (avant et arrière du quai) */}
      <mesh position={[0, 0.01, d / 2 - 0.08]}>
        <boxGeometry args={[w - 0.4, 0.02, 0.04]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 0.01, -d / 2 + 0.08]}>
        <boxGeometry args={[w - 0.4, 0.02, 0.04]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.4} />
      </mesh>

      {/* Piliers de fondation sous-marins */}
      {[
        [-w / 2 + 0.45, -d / 2 + 0.45],
        [w / 2 - 0.45, -d / 2 + 0.45],
        [-w / 2 + 0.45, d / 2 - 0.45],
        [w / 2 - 0.45, d / 2 - 0.45],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, -0.8, pz]}>
          <cylinderGeometry args={[0.14, 0.14, 1.1, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}

      {/* Étiquette CAD minimaliste */}
      <Html position={[0, 0.05, d / 2 + 0.5]} center zIndexRange={[5, 0]}>
        <div className="px-2.5 py-1 rounded-md bg-[#090d16]/90 backdrop-blur-md border border-white/10 text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-slate-300 whitespace-nowrap select-none pointer-events-none shadow-xl flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
          />
          <span>DOCK // {name}</span>
        </div>
      </Html>
    </group>
  );
}