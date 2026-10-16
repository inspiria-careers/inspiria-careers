"use client";
import React, { useEffect, useRef } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
}

export default function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates for 3D tilt
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) / (width / 2);
      mouseY = (e.clientY - height / 2) / (height / 2);
      targetRotY = mouseX * 0.4;
      targetRotX = -mouseY * 0.4;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Create 3D particles in a sphere & floating cloud
    const count = 120;
    const radius = Math.min(width, height) * 0.35;
    const points: Point3D[] = [];

    const goldColors = ["#c9a84c", "#e2c56f", "#8aa4d6", "#4a70b0", "#ffffff"];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = radius * (0.6 + Math.random() * 0.6);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      points.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: Math.random() * 2.5 + 1,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
      });
    }

    const focalLength = 400;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angle += 0.003;
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      const currentRotY = rotY + angle;
      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected: { x: number; y: number; z: number; scale: number; p: Point3D }[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // 3D rotation around Y and X axes
        const x1 = p.baseX * cosY - p.baseZ * sinY;
        const z1 = p.baseZ * cosY + p.baseX * sinY;

        const y2 = p.baseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.baseY * sinX;

        // Perspective projection
        const scale = focalLength / (focalLength + z2 + 300);
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        projected.push({ x: projX, y: projY, z: z2, scale, p });
      }

      // Sort by depth for correct 3D rendering
      projected.sort((a, b) => b.z - a.z);

      // Draw connecting 3D constellation lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.18 * Math.min(projected[i].scale, projected[j].scale);
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw 3D glowing particles
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        const r = pt.p.size * pt.scale;
        if (r <= 0) continue;

        const alpha = Math.max(0.1, Math.min(1, pt.scale * 0.9));

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = pt.p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = pt.p.color;
        ctx.shadowBlur = 8 * pt.scale;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.65,
      }}
    />
  );
}
