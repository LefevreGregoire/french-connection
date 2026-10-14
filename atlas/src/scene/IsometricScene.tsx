import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Grid } from '@react-three/drei';
import { useTopologyStore } from '../store/useTopologyStore';
import { ContainerCube } from './ContainerCube';

export function IsometricScene() {
  const nodes = useTopologyStore((s) => s.nodes);
  const selectNode = useTopologyStore((s) => s.selectNode);

  // Disposition automatique en grille centrée
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const spacing = 3.2;

  return (
    <Canvas
      shadows
      onPointerMissed={() => selectNode(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#050811']} />

      {/* Caméra Isométrique véritable */}
      <OrthographicCamera
        makeDefault
        position={[20, 20, 20]}
        zoom={42}
        near={-100}
        far={200}
      />

      {/* Contrôles type RTS : Panoramique + Zoom + Rotation limitée */}
      <MapControls
        enableDamping
        dampingFactor={0.05}
        minZoom={18}
        maxZoom={90}
        maxPolarAngle={Math.PI / 2.4}
        minPolarAngle={Math.PI / 6}
      />

      {/* Éclairage Silicon Valley Dark */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[15, 30, 10]} intensity={1.4} />
      <pointLight position={[-15, 10, -15]} intensity={0.8} color="#c026d3" />

      {/* Grille tactique infinie */}
      <Grid
        position={[0, -0.01, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#0f172a"
        sectionSize={4}
        sectionThickness={1.2}
        sectionColor="#1e293b"
        fadeDistance={45}
        fadeStrength={1}
      />

      {/* Génération des cubes pour chaque conteneur */}
      {nodes.map((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const offset = ((cols - 1) * spacing) / 2;
        const x = col * spacing - offset;
        const z = row * spacing - offset;

        return <ContainerCube key={node.id} node={node} position={[x, 0, z]} />;
      })}
    </Canvas>
  );
}