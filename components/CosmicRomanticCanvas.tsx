'use client';

import React, { useEffect, useRef } from 'react';

export function CosmicRomanticCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates
    let mouse = { x: width / 2, y: height / 2, isMoving: false, radius: 160 };
    let mouseTimeout: any;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isMoving = true;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouse.isMoving = false;
      }, 2000);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Particle definition
    interface StarParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseSize: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
      angle: number;
    }

    const particleCount = Math.min(Math.floor(window.innerWidth / 18), 65);
    const colors = [
      'rgba(244, 63, 94, ',   // rose-500
      'rgba(236, 72, 153, ',  // pink-500
      'rgba(251, 113, 133, ', // rose-400
      'rgba(253, 224, 71, ',  // amber-300
      'rgba(192, 132, 252, ', // purple-400
    ];

    const particles: StarParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const baseSize = Math.random() * 2.2 + 0.8;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45 - 0.2, // Gentle upward drift
        size: baseSize,
        baseSize,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        angle: Math.random() * Math.PI * 2,
      });
    }

    // Render loop
    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing cosmic aurora background
      const grad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        Math.max(width, height) * 0.6
      );
      grad.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
      grad.addColorStop(0.4, 'rgba(236, 72, 153, 0.03)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw & connect particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Particle physics
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.pulseSpeed;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse interaction (gravity push/pull)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius) * 0.6;
          p.x -= (dx / dist) * force;
          p.y -= (dy / dist) * force;
        }

        // Pulse size & alpha
        const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.angle) * 0.3);
        const currentSize = p.baseSize + Math.sin(p.angle) * 0.6;

        // Draw glowing particle star
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `${p.color}0.9)`;
        ctx.fill();

        // Connect nearby particles with subtle love constellation lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 110) {
            const lineAlpha = (1 - dist2 / 110) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(244, 63, 94, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(mouseTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 select-none opacity-80"
    />
  );
}
