import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface TruthTreeProps {
  position: [number, number, number];
  trustScore: number | null;
  growthStage: number;
  isNew?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
}

interface PointerPosition {
  x: number;
  y: number;
}

export function TruthTree({ position, trustScore, growthStage, isNew, isFocused = true, onClick }: TruthTreeProps) {
  const treeRef = useRef<Mesh>(null);
  const foliageRef = useRef<Mesh>(null);
  const downRef = useRef<PointerPosition>({ x: 0, y: 0 });

  // Determine tree color based on trust score
  const getTreeColor = () => {
    if (!trustScore) return '#808080'; // Gray for unverified
    if (trustScore >= 80) return 'hsl(140, 60%, 50%)'; // truth-bloom green
    if (trustScore >= 50) return 'hsl(45, 70%, 50%)'; // Yellow-amber
    return 'hsl(0, 0%, 40%)'; // truth-wither gray
  };

  // Calculate tree size based on growth stage and trust score
  const computedScale = growthStage * 0.2 * (trustScore ? Math.max(0.5, trustScore / 100) : 0.3);
  const scale = Math.max(1.1, computedScale); // Increase minimum size for visibility

  // Animation: gentle sway and growth
  useFrame((state) => {
    if (treeRef.current && foliageRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Gentle sway
      treeRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
      
      // Pulsing glow for high-trust trees
      if (trustScore && trustScore >= 80) {
        foliageRef.current.scale.set(
          scale + Math.sin(time * 2) * 0.05,
          scale + Math.sin(time * 2) * 0.05,
          scale + Math.sin(time * 2) * 0.05
        );
      }
      
      // Growth animation for new trees
      if (isNew && scale < 1) {
        const growthProgress = Math.min(1, state.clock.getElapsedTime() / 2);
        treeRef.current.scale.y = growthProgress;
      }
    }
  });

  const opacity = isFocused ? 1 : 0.5;

  // Pointer handlers for reliable click detection
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    downRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    const dx = e.clientX - downRef.current.x;
    const dy = e.clientY - downRef.current.y;
    // Only trigger click if movement was minimal (not a drag)
    if (Math.hypot(dx, dy) < 6) {
      onClick?.();
    }
  };

  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <group 
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Tree trunk */}
      <mesh ref={treeRef} position={[0, scale * 0.5, 0]}>
        <cylinderGeometry args={[0.1 * scale, 0.15 * scale, scale, 8]} />
        <meshStandardMaterial 
          color="#5D4037" 
          roughness={0.9}
          transparent
          opacity={opacity}
        />
      </mesh>
      
      {/* Tree foliage */}
      <mesh ref={foliageRef} position={[0, scale * 1.2, 0]}>
        <sphereGeometry args={[scale * 0.6, 16, 16]} />
        <meshStandardMaterial 
          color={getTreeColor()} 
          emissive={trustScore && trustScore >= 80 ? getTreeColor() : '#000000'}
          emissiveIntensity={trustScore && trustScore >= 80 ? 0.2 : 0}
          roughness={0.8}
          transparent
          opacity={opacity}
        />
      </mesh>
      
      {/* Invisible hit bubble for easier clicking */}
      <mesh position={[0, scale * 1.2, 0]}>
        <sphereGeometry args={[Math.max(scale * 0.8, 0.8), 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Hover glow */}
      {isFocused && (
        <pointLight 
          position={[0, scale * 1.2, 0]} 
          color={getTreeColor()} 
          intensity={0.3} 
          distance={3}
        />
      )}
      
      {/* Sparkle effect for new high-trust trees */}
      {isNew && trustScore && trustScore >= 80 && (
        <pointLight 
          position={[0, scale * 1.2, 0]} 
          color="#FFD700" 
          intensity={0.5} 
          distance={2}
        />
      )}
    </group>
  );
}
