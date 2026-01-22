import { useEffect, useRef, useCallback } from 'react';
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

export function PhysicsVoteCanvas({ onVoteReceived }: PhysicsVoteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Initialize physics engine
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
    });
    engineRef.current = engine;

    // Create renderer
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    // Create boundaries (walls and floor)
    const wallThickness = 50;
    const walls = [
      // Floor
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
        isStatic: true,
        render: { visible: false },
      }),
      // Left wall
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { visible: false },
      }),
      // Right wall
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { visible: false },
      }),
    ];

    Matter.Composite.add(engine.world, walls);

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      render.canvas.width = newWidth * (window.devicePixelRatio || 1);
      render.canvas.height = newHeight * (window.devicePixelRatio || 1);
      render.canvas.style.width = `${newWidth}px`;
      render.canvas.style.height = `${newHeight}px`;
      render.options.width = newWidth;
      render.options.height = newHeight;

      // Update floor position
      Matter.Body.setPosition(walls[0], { x: newWidth / 2, y: newHeight + wallThickness / 2 });
      Matter.Body.setPosition(walls[2], { x: newWidth + wallThickness / 2, y: newHeight / 2 });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  // Custom render for emojis
  useEffect(() => {
    if (!renderRef.current || !engineRef.current) return;

    const render = renderRef.current;
    
    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      const bodies = Matter.Composite.allBodies(engineRef.current!.world);

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
    });
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// Hook to add emojis to the physics world
export function usePhysicsVote(canvasRef: React.RefObject<{ addEmoji: (vibe: VibeType) => void }>) {
  const addEmoji = useCallback((vibe: VibeType) => {
    canvasRef.current?.addEmoji(vibe);
  }, [canvasRef]);

  return { addEmoji };
}

// Imperative handle version for parent component control
import { forwardRef, useImperativeHandle } from 'react';

export interface PhysicsVoteCanvasHandle {
  addEmoji: (vibe: VibeType) => void;
  addMultipleEmojis: (vibes: VibeType[]) => void;
}

export const PhysicsVoteCanvasWithRef = forwardRef<PhysicsVoteCanvasHandle, PhysicsVoteCanvasProps>(
  function PhysicsVoteCanvasWithRef(_props, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const wallsRef = useRef<Matter.Body[]>([]);
    const isInitializedRef = useRef(false);

    // Initialize physics engine with delayed start to ensure DOM is ready
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;

      let animationId: number;
      let cleanupCalled = false;

      const initPhysics = () => {
        if (cleanupCalled || !containerRef.current || !canvasRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Wait for valid dimensions
        if (width === 0 || height === 0) {
          console.log('Container not ready, waiting...', width, height);
          animationId = requestAnimationFrame(initPhysics);
          return;
        }

        console.log('Initializing Matter.js with dimensions:', width, height);

        const pixelRatio = window.devicePixelRatio || 1;

        // Set canvas dimensions explicitly
        canvasRef.current.width = width * pixelRatio;
        canvasRef.current.height = height * pixelRatio;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        // Create engine
        const engine = Matter.Engine.create({
          gravity: { x: 0, y: 0.8 },
        });
        engineRef.current = engine;

        // Create renderer - DON'T let Matter.js handle pixelRatio, we do it manually
        const render = Matter.Render.create({
          canvas: canvasRef.current,
          engine: engine,
          options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: pixelRatio,
          },
        });
        renderRef.current = render;

        // Create boundaries (walls and floor)
        const wallThickness = 50;
        const walls = [
          // Floor
          Matter.Bodies.rectangle(width / 2, height + wallThickness / 2 - 5, width + 100, wallThickness, {
            isStatic: true,
            render: { visible: false },
            friction: 0.8,
          }),
          // Left wall
          Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
            isStatic: true,
            render: { visible: false },
          }),
          // Right wall
          Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, {
            isStatic: true,
            render: { visible: false },
          }),
        ];
        wallsRef.current = walls;

        Matter.Composite.add(engine.world, walls);

        // Custom render for emojis - render manually after Matter's render
        const afterRenderHandler = () => {
          const ctx = render.context;
          const bodies = Matter.Composite.allBodies(engine.world);

          bodies.forEach((body) => {
            if (body.isStatic) return;
            
            const emoji = (body as any).emoji as string | undefined;
            if (!emoji) return;

            ctx.save();
            // Scale position for pixel ratio
            ctx.translate(body.position.x * pixelRatio, body.position.y * pixelRatio);
            ctx.rotate(body.angle);
            
            const size = ((body as any).emojiSize || 32) * pixelRatio;
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 0, 0);
            
            ctx.restore();
          });
        };

        Matter.Events.on(render, 'afterRender', afterRenderHandler);

        // Create runner
        const runner = Matter.Runner.create();
        runnerRef.current = runner;

        Matter.Render.run(render);
        Matter.Runner.run(runner, engine);

        isInitializedRef.current = true;
        console.log('Matter.js initialized successfully');

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !canvasRef.current || !renderRef.current) return;
          const newWidth = containerRef.current.clientWidth;
          const newHeight = containerRef.current.clientHeight;
          const newPixelRatio = window.devicePixelRatio || 1;
          
          canvasRef.current.width = newWidth * newPixelRatio;
          canvasRef.current.height = newHeight * newPixelRatio;
          canvasRef.current.style.width = `${newWidth}px`;
          canvasRef.current.style.height = `${newHeight}px`;
          renderRef.current.options.width = newWidth;
          renderRef.current.options.height = newHeight;

          // Update wall positions
          if (wallsRef.current.length >= 3) {
            Matter.Body.setPosition(wallsRef.current[0], { x: newWidth / 2, y: newHeight + wallThickness / 2 - 5 });
            Matter.Body.setPosition(wallsRef.current[2], { x: newWidth + wallThickness / 2, y: newHeight / 2 });
          }
        };

        window.addEventListener('resize', handleResize);

        // Store cleanup function
        (containerRef.current as any)._physicsCleanup = () => {
          window.removeEventListener('resize', handleResize);
          Matter.Events.off(render, 'afterRender', afterRenderHandler);
          Matter.Render.stop(render);
          Matter.Runner.stop(runner);
          Matter.Engine.clear(engine);
        };
      };

      // Start initialization on next frame to ensure DOM is ready
      animationId = requestAnimationFrame(initPhysics);

      return () => {
        cleanupCalled = true;
        cancelAnimationFrame(animationId);
        isInitializedRef.current = false;
        if (containerRef.current && (containerRef.current as any)._physicsCleanup) {
          (containerRef.current as any)._physicsCleanup();
        }
      };
    }, []);

    // Expose methods via imperative handle
    useImperativeHandle(ref, () => ({
      addEmoji: (vibe: VibeType) => {
        if (!engineRef.current || !containerRef.current || !isInitializedRef.current) {
          console.log('Engine not ready, queuing emoji:', vibe);
          return;
        }

        const width = containerRef.current.clientWidth;
        const size = 28 + Math.random() * 12; // Random size 28-40
        const x = 40 + Math.random() * (width - 80); // Random x position with margin
        const radius = size / 2;

        console.log('Adding emoji:', vibe, 'at x:', x);

        const body = Matter.Bodies.circle(x, -50, radius, {
          restitution: 0.6, // Bounciness
          friction: 0.1,
          frictionAir: 0.01,
          render: { visible: false }, // We render custom
        });

        // Store emoji data on body
        (body as any).emoji = EMOJI_MAP[vibe];
        (body as any).emojiSize = size;
        (body as any).vibeType = vibe;

        // Add slight random angular velocity for natural rotation
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

        Matter.Composite.add(engineRef.current.world, body);

        // Remove old bodies if too many (performance)
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
                render: { visible: false },
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
      <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }
);
