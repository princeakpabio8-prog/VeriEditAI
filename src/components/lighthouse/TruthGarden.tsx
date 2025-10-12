import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Sparkles } from '@react-three/drei';
import { TruthTree } from './TruthTree';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Thread {
  id: string;
  title: string;
  trust_score: number | null;
  tree_growth_stage: number;
  garden_position_x: number;
  garden_position_z: number;
  created_at: string;
}

interface TruthGardenProps {
  roomId: string;
  threads: Thread[];
}

export function TruthGarden({ threads }: TruthGardenProps) {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [cameraPosition] = useState<[number, number, number]>([0, 8, 12]);
  const isMobile = useIsMobile();
  
  // Dim non-selected trees
  const [focusedTreeId, setFocusedTreeId] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedThread) {
      setFocusedTreeId(selectedThread.id);
    } else {
      setFocusedTreeId(null);
    }
  }, [selectedThread]);

  // Filter threads that have garden positions
  const gardenThreads = threads.filter(t => 
    t.garden_position_x !== null && t.garden_position_z !== null
  );

  // Check if thread is new (created in last 5 minutes)
  const isNewThread = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return (now - created) < 5 * 60 * 1000;
  };

  return (
    <div className="w-full h-[600px] relative rounded-lg overflow-hidden border border-border/50">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#B8F3FF" />

        {/* Environment */}
        <Sky 
          distance={450000}
          sunPosition={[10, 5, 5]}
          inclination={0.6}
          azimuth={0.25}
        />
        <Environment preset="sunset" />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial 
            color="hsl(120, 30%, 25%)" 
            roughness={0.9}
          />
        </mesh>

        {/* Firefly particles */}
        <Sparkles
          count={isMobile ? 30 : 100}
          scale={[40, 5, 40]}
          size={2}
          speed={0.2}
          opacity={0.6}
          color="#B8F3FF"
        />

        {/* Truth Trees */}
        {gardenThreads.map((thread) => (
          <TruthTree
            key={thread.id}
            position={[
              Number(thread.garden_position_x) || 0,
              0,
              Number(thread.garden_position_z) || 0
            ]}
            trustScore={thread.trust_score}
            growthStage={thread.tree_growth_stage || 1}
            isNew={isNewThread(thread.created_at)}
            isFocused={!focusedTreeId || focusedTreeId === thread.id}
            onClick={() => setSelectedThread(thread)}
          />
        ))}

        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>

      {/* Info overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        <Card className="p-3 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-[hsl(140,60%,50%)]" />
            <span className="text-muted-foreground">High Trust (80+)</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-3 h-3 rounded-full bg-[hsl(45,70%,50%)]" />
            <span className="text-muted-foreground">Moderate (50-80)</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-3 h-3 rounded-full bg-[hsl(0,0%,40%)]" />
            <span className="text-muted-foreground">Disputed (&lt;50)</span>
          </div>
        </Card>

        <Card className="p-3 bg-background/80 backdrop-blur-sm">
          <div className="text-sm font-medium">🌳 {gardenThreads.length} Trees Planted</div>
          <div className="text-xs text-muted-foreground mt-1">
            Click trees to view threads
          </div>
        </Card>
      </div>

      {/* Selected thread details */}
      {selectedThread && (
        <Card className="absolute bottom-4 left-4 right-4 p-4 bg-background/90 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{selectedThread.title}</h3>
              <div className="flex items-center gap-2">
                {selectedThread.trust_score !== null && (
                  <Badge variant={selectedThread.trust_score >= 80 ? 'default' : 'secondary'}>
                    Trust: {selectedThread.trust_score}%
                  </Badge>
                )}
                <Badge variant="outline">
                  Stage {selectedThread.tree_growth_stage}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => setSelectedThread(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {gardenThreads.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Card className="p-6 max-w-md text-center">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="font-semibold mb-2">Your Truth Garden Awaits</h3>
            <p className="text-sm text-muted-foreground">
              Create and verify threads to plant your first seeds of truth. 
              Watch them grow into a beautiful forest as trust builds.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
