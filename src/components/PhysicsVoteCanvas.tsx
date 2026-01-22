import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Matter from 'matter-js';

type VibeType = 'fire' | 'meh' | 'sleep';

const EMOJI_MAP: Record<VibeType, string> = {
  fire: '🔥',
  meh: '😐',
  sleep: '😴',
};

interface PhysicsVoteCanvasProps {
  onVoteReceived?: (vibe: VibeType) => void;
}

export interface PhysicsVoteCanvasHandle {
  addEmoji: (vibe: VibeType) => void;
  addMultipleEmojis: (vibes: VibeType[]) => void;
}

export const PhysicsVoteCanvasWithRef = forwardRef<PhysicsVoteCanvasHandle, PhysicsVoteCanvasProps>(
  function PhysicsVoteCanvasWithRef(_props, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const wallsRef = useRef<Matter.Body[]>([]);
    const isInitializedRef = useRef(false);
    const animationFrameRef = useRef<number>(0);

    // Manual render loop for emojis - independent of Matter.js Render
    const renderLoop = () => {
      if (!canvasRef.current || !engineRef.current || !containerRef.current) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get all bodies
      const bodies = Matter.Composite.allBodies(engineRef.current.world);

      bodies.forEach((body) => {
        if (body.isStatic) return;
        
        const emoji = (body as any).emoji as string | undefined;
        if (!emoji) return;

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        
        const size = (body as any).emojiSize || 32;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 0, 0);
        
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    // Initialize physics engine
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;

      let cleanupCalled = false;
      let initFrameId: number;

      const initPhysics = () => {
        if (cleanupCalled || !containerRef.current || !canvasRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Wait for valid dimensions
        if (width === 0 || height === 0) {
          console.log('Waiting for container dimensions...');
          initFrameId = requestAnimationFrame(initPhysics);
          return;
        }

        console.log('Initializing Matter.js with dimensions:', width, height);

        // Set canvas dimensions directly (no pixel ratio complexity)
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Create engine with gravity
        const engine = Matter.Engine.create({
          gravity: { x: 0, y: 0.8 },
        });
        engineRef.current = engine;

        // Create boundaries (walls and floor)
        const wallThickness = 50;
        const walls = [
          // Floor
          Matter.Bodies.rectangle(width / 2, height + wallThickness / 2 - 5, width + 100, wallThickness, {
            isStatic: true,
            friction: 0.8,
          }),
          // Left wall
          Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
            isStatic: true,
          }),
          // Right wall
          Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, {
            isStatic: true,
          }),
        ];
        wallsRef.current = walls;
        Matter.Composite.add(engine.world, walls);

        // Create and run the physics runner (no Matter.Render needed)
        const runner = Matter.Runner.create();
        runnerRef.current = runner;
        Matter.Runner.run(runner, engine);

        isInitializedRef.current = true;
        console.log('Matter.js initialized successfully');

        // Start our custom render loop
        animationFrameRef.current = requestAnimationFrame(renderLoop);

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !canvasRef.current) return;
          const newWidth = containerRef.current.clientWidth;
          const newHeight = containerRef.current.clientHeight;
          
          canvasRef.current.width = newWidth;
          canvasRef.current.height = newHeight;

          // Update wall positions
          if (wallsRef.current.length >= 3) {
            Matter.Body.setPosition(wallsRef.current[0], { x: newWidth / 2, y: newHeight + wallThickness / 2 - 5 });
            Matter.Body.setPosition(wallsRef.current[2], { x: newWidth + wallThickness / 2, y: newHeight / 2 });
          }
        };

        window.addEventListener('resize', handleResize);

        // Store cleanup
        (containerRef.current as any)._cleanup = () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameRef.current);
          if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
          if (engineRef.current) Matter.Engine.clear(engineRef.current);
        };
      };

      initFrameId = requestAnimationFrame(initPhysics);

      return () => {
        cleanupCalled = true;
        cancelAnimationFrame(initFrameId);
        cancelAnimationFrame(animationFrameRef.current);
        isInitializedRef.current = false;
        if (containerRef.current && (containerRef.current as any)._cleanup) {
          (containerRef.current as any)._cleanup();
        }
      };
    }, []);

    // Expose methods via imperative handle
    useImperativeHandle(ref, () => ({
      addEmoji: (vibe: VibeType) => {
        if (!engineRef.current || !containerRef.current || !isInitializedRef.current) {
          console.log('Engine not ready for emoji:', vibe);
          return;
        }

        const width = containerRef.current.clientWidth;
        const size = 28 + Math.random() * 12;
        const x = 40 + Math.random() * (width - 80);
        const radius = size / 2;

        console.log('Adding emoji:', vibe, 'at x:', x);

        const body = Matter.Bodies.circle(x, -50, radius, {
          restitution: 0.6,
          friction: 0.1,
          frictionAir: 0.01,
        });

        (body as any).emoji = EMOJI_MAP[vibe];
        (body as any).emojiSize = size;
        (body as any).vibeType = vibe;

        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
        Matter.Composite.add(engineRef.current.world, body);

        // Remove old bodies if too many
        const allBodies = Matter.Composite.allBodies(engineRef.current.world);
        const dynamicBodies = allBodies.filter(b => !b.isStatic);
        if (dynamicBodies.length > 150) {
          const toRemove = dynamicBodies.slice(0, dynamicBodies.length - 150);
          toRemove.forEach(b => Matter.Composite.remove(engineRef.current!.world, b));
        }
      },
      addMultipleEmojis: (vibes: VibeType[]) => {
        vibes.forEach((vibe, index) => {
          setTimeout(() => {
            if (engineRef.current && containerRef.current && isInitializedRef.current) {
              const width = containerRef.current.clientWidth;
              const size = 28 + Math.random() * 12;
              const x = 40 + Math.random() * (width - 80);
              const radius = size / 2;

              const body = Matter.Bodies.circle(x, -50, radius, {
                restitution: 0.6,
                friction: 0.1,
                frictionAir: 0.01,
              });

              (body as any).emoji = EMOJI_MAP[vibe];
              (body as any).emojiSize = size;
              (body as any).vibeType = vibe;

              Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
              Matter.Composite.add(engineRef.current.world, body);
            }
          }, index * 50);
        });
      },
    }), []);

    return (
      <div 
        ref={containerRef} 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />
      </div>
    );
  }
);

// Legacy export for compatibility
export function PhysicsVoteCanvas({ onVoteReceived }: PhysicsVoteCanvasProps) {
  return <PhysicsVoteCanvasWithRef />;
}

export function usePhysicsVote(canvasRef: React.RefObject<{ addEmoji: (vibe: VibeType) => void }>) {
  const addEmoji = (vibe: VibeType) => {
    canvasRef.current?.addEmoji(vibe);
  };
  return { addEmoji };
}
