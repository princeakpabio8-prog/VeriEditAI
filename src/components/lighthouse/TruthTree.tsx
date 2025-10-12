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

export function TruthTree({ position, trustScore, growthStage, isNew, isFocused = true, onClick }: TruthTreeProps) {
  const treeRef = useRef<Mesh>(null);
  const foliageRef = useRef<Mesh>(null);

  // Determine tree color based on trust score
  const getTreeColor = () => {
    if (!trustScore) return '#808080'; // Gray for unverified
    if (trustScore >= 80) return 'hsl(140, 60%, 50%)'; // truth-bloom green
    if (trustScore >= 50) return 'hsl(45, 70%, 50%)'; // Yellow-amber
    return 'hsl(0, 0%, 40%)'; // truth-wither gray
  };

  // Calculate tree size based on growth stage and trust score
  const scale = growthStage * 0.2 * (trustScore ? Math.max(0.5, trustScore / 100) : 0.3);

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

  return (
    <group position={position} onClick={onClick}>
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
