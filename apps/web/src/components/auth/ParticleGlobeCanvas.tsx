import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
}

export const ParticleGlobeCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate 3D sphere points (Fibonacci Sphere algorithm for uniform distribution)
    const particleCount = 420;
    const particles: Particle[] = [];
    const sphereRadius = Math.min(width, height) * 0.45 || 260;

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.cos(phi);
      const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

      // Slight color variation: mostly cyan/electric-blue/white
      const rand = Math.random();
      const color = rand > 0.7 ? '#ffffff' : rand > 0.3 ? '#67e8f9' : '#818cf8';

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: Math.random() * 1.5 + 1.0,
        color,
      });
    }

    let angleY = 0;
    let angleX = 0.22; // slight downward tilt

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.48;
      const centerY = height * 0.46;
      const fov = 400; // perspective field of view

      angleY += 0.0035; // gentle continuous rotation

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Sort particles by projected z-index for proper depth rendering
      const projectedList: Array<{
        px: number;
        py: number;
        scale: number;
        alpha: number;
        color: string;
        size: number;
        rawZ: number;
      }> = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Rotate around Y axis
        const x1 = p.baseX * cosY - p.baseZ * sinY;
        const z1 = p.baseZ * cosY + p.baseX * sinY;

        // 2. Rotate around X axis (tilt)
        const y1 = p.baseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.baseY * sinX;

        // Perspective projection
        const scale = fov / (fov + z2 + sphereRadius * 1.2);
        const px = centerX + x1 * scale;
        const py = centerY + y1 * scale;

        // Depth-based opacity: front particles are brighter & larger
        const depthNormalized = (z2 + sphereRadius) / (sphereRadius * 2);
        const alpha = Math.max(0.08, Math.min(0.95, depthNormalized * 0.9 + 0.1));

        projectedList.push({
          px,
          py,
          scale,
          alpha,
          color: p.color,
          size: p.size * scale * 1.6,
          rawZ: z2,
        });
      }

      // Draw faint constellation lines between nearby front particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedList.length; i += 2) {
        const p1 = projectedList[i];
        if (p1.rawZ < 0) continue; // only front hemisphere connections
        for (let j = i + 1; j < projectedList.length; j += 3) {
          const p2 = projectedList[j];
          if (p2.rawZ < 0) continue;
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const distSq = dx * dx + dy * dy;
          if (distSq < 1600) { // distance < 40px
            const lineAlpha = (1 - distSq / 1600) * 0.18 * p1.alpha;
            ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // Draw glowing dotted particles
      for (let i = 0; i < projectedList.length; i++) {
        const p = projectedList[i];

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(0.6, p.size), 0, Math.PI * 2);
        ctx.fill();

        // Extra soft halo on closest foreground particles
        if (p.rawZ > sphereRadius * 0.3) {
          ctx.fillStyle = '#67e8f9';
          ctx.globalAlpha = p.alpha * 0.25;
          ctx.beginPath();
          ctx.arc(p.px, p.py, p.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
