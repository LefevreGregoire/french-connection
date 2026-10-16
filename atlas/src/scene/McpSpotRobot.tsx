import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';

interface SpotRobotProps {
  targetPos?: [number, number, number];
  showAllLabels?: boolean;
  onPositionUpdate?: (pos: THREE.Vector3) => void;
}

export function McpSpotRobot({ targetPos, showAllLabels = false, onPositionUpdate }: SpotRobotProps) {
  const rootRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const lidarRef = useRef<THREE.Mesh>(null!);
  const armBaseRef = useRef<THREE.Group>(null!);
  const armForeRef = useRef<THREE.Group>(null!);
  const scanRingRef = useRef<THREE.Mesh>(null!);

  // Références des 4 pattes articulées (FL, FR, BL, BR)
  const legFL = useRef<THREE.Group>(null!);
  const legFR = useRef<THREE.Group>(null!);
  const legBL = useRef<THREE.Group>(null!);
  const legBR = useRef<THREE.Group>(null!);

  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!rootRef.current || !bodyRef.current) return;
    const t = state.clock.elapsedTime;

    // 1. Calcul de la destination : Cible d'intervention ou patrouille en 8 sur les quais
    const destX = targetPos ? targetPos[0] + 1.45 : Math.sin(t * 0.45) * 5.8;
    const destZ = targetPos ? targetPos[2] + 0.95 : 3.25 + Math.cos(t * 0.9) * 0.45;
    const currentPos = rootRef.current.position;

    const dx = destX - currentPos.x;
    const dz = destZ - currentPos.z;
    const dist = Math.hypot(dx, dz);
    const isMoving = dist > 0.08;

    // 2. Déplacement fluide
    const moveSpeed = targetPos ? 5.5 : 2.2;
    currentPos.x = THREE.MathUtils.lerp(currentPos.x, destX, delta * moveSpeed);
    currentPos.z = THREE.MathUtils.lerp(currentPos.z, destZ, delta * moveSpeed);

    if (onPositionUpdate) {
      onPositionUpdate(currentPos);
    }

    // 3. Rotation automatique du robot vers sa direction de marche (ou vers le conteneur cible)
    const lookTargetX = targetPos && !isMoving ? targetPos[0] : destX;
    const lookTargetZ = targetPos && !isMoving ? targetPos[2] : destZ;
    const targetYaw = Math.atan2(lookTargetX - currentPos.x, lookTargetZ - currentPos.z);

    // Interpolation angulaire propre
    const diff = Math.atan2(Math.sin(targetYaw - rootRef.current.rotation.y), Math.cos(targetYaw - rootRef.current.rotation.y));
    rootRef.current.rotation.y += diff * delta * 8;

    // 4. Cinématique des 4 pattes (Allure de trot : paires diagonales FL+BR et FR+BL)
    const walkFreq = targetPos ? 16 : 10;
    const strideAmp = isMoving ? (targetPos ? 0.55 : 0.35) : 0.04;
    const phaseA = Math.sin(t * walkFreq) * strideAmp;
    const phaseB = Math.sin(t * walkFreq + Math.PI) * strideAmp;

    if (legFL.current) legFL.current.rotation.x = phaseA;
    if (legBR.current) legBR.current.rotation.x = phaseA;
    if (legFR.current) legFR.current.rotation.x = phaseB;
    if (legBL.current) legBL.current.rotation.x = phaseB;

    // Oscillation verticale du châssis pendant le trot ou respiration hydraulique à l'arrêt
    bodyRef.current.position.y = isMoving
      ? 0.42 + Math.abs(Math.sin(t * walkFreq)) * 0.035
      : 0.4 + Math.sin(t * 3) * 0.012;

    // Légère inclinaison vers l'avant en sprint
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(
      bodyRef.current.rotation.x,
      isMoving && targetPos ? 0.08 : 0,
      delta * 6
    );

    // 5. Rotation continue du dôme LIDAR 360°
    if (lidarRef.current) {
      lidarRef.current.rotation.y += delta * 6;
    }

    // 6. Déploiement du bras robotique dorsal lors d'une réparation MCP
    const isInspecting = Boolean(targetPos) && !isMoving;
    if (armBaseRef.current && armForeRef.current) {
      armBaseRef.current.rotation.x = THREE.MathUtils.lerp(
        armBaseRef.current.rotation.x,
        isInspecting ? -0.55 : 0.25,
        delta * 6
      );
      armForeRef.current.rotation.x = THREE.MathUtils.lerp(
        armForeRef.current.rotation.x,
        isInspecting ? 0.85 + Math.sin(t * 8) * 0.12 : -0.9,
        delta * 6
      );
    }

    if (scanRingRef.current) {
      scanRingRef.current.rotation.z -= delta * 2.5;
    }
  });

  const isWorking = Boolean(targetPos);

  // Sous-composant pour une patte articulée (Hanche + Fémur + Genou + Tibia + Patin)
  const renderLeg = (ref: React.RefObject<THREE.Group>, xOffset: number, zOffset: number) => (
    <group ref={ref} position={[xOffset, 0.38, zOffset]}>
      {/* Servomoteur de hanche */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.09, 12]} />
        <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Fémur supérieur jaune Spot (incliné vers l'arrière) */}
      <mesh position={[0, -0.11, -0.04]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.045, 0.22, 0.06]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Articulation du genou */}
      <mesh position={[0, -0.2, -0.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.038, 0.038, 0.06, 10]} />
        <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Tibia inférieur en fibre de carbone (incliné vers l'avant) */}
      <mesh position={[0, -0.3, -0.02]} rotation={[-0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.016, 0.24, 10]} />
        <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Patin amortisseur en caoutchouc noir au sol */}
      <mesh position={[0, -0.4, 0.03]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} />
      </mesh>
    </group>
  );

  return (
    <group
      ref={rootRef}
      position={[0, 0, 3.25]}
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
      {/* CHÂSSIS ARTICULÉ DE SPOT */}
      <group ref={bodyRef} position={[0, 0.4, 0]}>
        {/* Coque principale jaune Boston Dynamics */}
        <RoundedBox args={[0.32, 0.16, 0.76]} radius={0.04} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#eab308" roughness={0.28} metalness={0.15} />
          <Edges scale={1.005} threshold={15} color="#ca8a04" />
        </RoundedBox>

        {/* Châssis inférieur & batterie en carbone noir */}
        <RoundedBox position={[0, -0.06, 0]} args={[0.26, 0.08, 0.68]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
        </RoundedBox>

        {/* Bandes latérales techniques noires ("SPOT // MCP") */}
        <mesh position={[0.162, 0.01, 0]}>
          <planeGeometry args={[0.5, 0.045]} />
          <meshBasicMaterial color="#18181b" side={2} />
        </mesh>
        <mesh position={[-0.162, 0.01, 0]}>
          <planeGeometry args={[0.5, 0.045]} />
          <meshBasicMaterial color="#18181b" side={2} />
        </mesh>

        {/* Tête avant : Bloc caméras stéréo de profondeur + LED optique */}
        <group position={[0, 0.01, 0.39]}>
          <RoundedBox args={[0.22, 0.1, 0.08]} radius={0.02} smoothness={2}>
            <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.8} />
          </RoundedBox>
          {/* Optiques télémétriques (Ambre en intervention, Cyan en patrouille) */}
          <mesh position={[0.05, 0, 0.042]}>
            <sphereGeometry args={[0.02, 12, 12]} />
            <meshBasicMaterial color={isWorking ? '#f59e0b' : '#38bdf8'} />
          </mesh>
          <mesh position={[-0.05, 0, 0.042]}>
            <sphereGeometry args={[0.02, 12, 12]} />
            <meshBasicMaterial color={isWorking ? '#f59e0b' : '#38bdf8'} />
          </mesh>

          {/* Faisceau de scan laser holographique quand Spot inspecte un conteneur */}
          {isWorking && (
            <mesh position={[0, -0.05, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.42, 1.0, 24, 1, true]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.22} side={2} />
            </mesh>
          )}
        </group>

        {/* Dôme LIDAR 360° rotatif sur l'avant du dos */}
        <group position={[0, 0.12, 0.18]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.065, 0.075, 0.07, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh ref={lidarRef} position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.025, 12]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
        </group>

        {/* BRAS ROBOTIQUE DORSAL D'INTERVENTION (Style Spot Arm) */}
        <group ref={armBaseRef} position={[0, 0.09, -0.12]}>
          {/* Tourelle de base du bras */}
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.07, 0.06, 16]} />
            <meshStandardMaterial color="#27272a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Segment primaire du bras */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.045, 0.32, 0.045]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} />
          </mesh>
          {/* Coude + Avant-bras avec pince / scanner optique */}
          <group ref={armForeRef} position={[0, 0.3, 0]}>
            <mesh position={[0, 0.14, 0.04]} rotation={[0.3, 0, 0]} castShadow>
              <boxGeometry args={[0.038, 0.28, 0.038]} />
              <meshStandardMaterial color="#18181b" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Tête de pince / Emetteur MCP */}
            <mesh position={[0, 0.27, 0.08]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshBasicMaterial color={isWorking ? '#f43f5e' : '#10b981'} />
            </mesh>
          </group>
        </group>
      </group>

      {/* LES 4 PATTES CINÉMATIQUES */}
      {renderLeg(legFL, 0.19, 0.24)}
      {renderLeg(legFR, -0.19, 0.24)}
      {renderLeg(legBL, 0.19, -0.24)}
      {renderLeg(legBR, -0.19, -0.24)}

      {/* Anneau télémétrique projeté au sol sous Spot */}
      <mesh ref={scanRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.48, 0.53, 32]} />
        <meshBasicMaterial
          color={isWorking ? '#f59e0b' : '#0284c7'}
          transparent
          opacity={isWorking || hovered ? 0.85 : 0.35}
          side={2}
        />
      </mesh>

      {/* Badge flottant minimaliste */}
      {(isWorking || hovered || showAllLabels) && (
        <Html position={[0, 1.25, 0]} center zIndexRange={[15, 0]}>
          <div
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap border select-none pointer-events-none shadow-md flex items-center gap-1.5 ${
              isWorking
                ? 'bg-amber-500 border-amber-600 text-slate-950 scale-105'
                : 'bg-slate-900/95 border-slate-700 text-amber-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-slate-950 animate-ping' : 'bg-amber-400'}`} />
            <span>{isWorking ? 'SPOT-01 // REMEDIATING' : 'SPOT-01 // PATROL'}</span>
          </div>
        </Html>
      )}
    </group>
  );
}