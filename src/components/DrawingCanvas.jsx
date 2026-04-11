import React, { useEffect, useRef, useCallback } from 'react';

/**
 * DrawingCanvas Component
 * Renders drawn objects and current drawing path with neon effects
 */
const DrawingCanvas = ({
  objects,
  currentDrawingPath,
  isDrawing,
  canvasWidth,
  canvasHeight,
}) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const drawNeonLine = useCallback((ctx, x1, y1, x2, y2, color) => {
    // Draw outer glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw bright center line
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }, []);

  const drawObject = useCallback((ctx, obj) => {
    const { position, size, rotation, color, opacity, scale, isSelected, type } = obj;

    ctx.globalAlpha = opacity;
    ctx.translate(position.x, position.y);
    ctx.rotate(rotation);

    if (type === 'circle') {
      // Draw circle with glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw circle outline
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.shadowBlur = isSelected ? 30 : 15;
      ctx.shadowColor = color;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Draw center point if selected
      if (isSelected) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'sphere' || type === 'cube') {
      // Draw as rounded square for sphere/cube
      const radius = size / 2;
      const cornerRadius = 8;

      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity * 0.3;

      // Rounded rectangle fill
      ctx.beginPath();
      ctx.moveTo(-radius + cornerRadius, -radius);
      ctx.lineTo(radius - cornerRadius, -radius);
      ctx.quadraticCurveTo(radius, -radius, radius, -radius + cornerRadius);
      ctx.lineTo(radius, radius - cornerRadius);
      ctx.quadraticCurveTo(radius, radius, radius - cornerRadius, radius);
      ctx.lineTo(-radius + cornerRadius, radius);
      ctx.quadraticCurveTo(-radius, radius, -radius, radius - cornerRadius);
      ctx.lineTo(-radius, -radius + cornerRadius);
      ctx.quadraticCurveTo(-radius, -radius, -radius + cornerRadius, -radius);
      ctx.closePath();
      ctx.fill();

      // Rounded rectangle outline
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.shadowBlur = isSelected ? 30 : 15;
      ctx.shadowColor = color;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.moveTo(-radius + cornerRadius, -radius);
      ctx.lineTo(radius - cornerRadius, -radius);
      ctx.quadraticCurveTo(radius, -radius, radius, -radius + cornerRadius);
      ctx.lineTo(radius, radius - cornerRadius);
      ctx.quadraticCurveTo(radius, radius, radius - cornerRadius, radius);
      ctx.lineTo(-radius + cornerRadius, radius);
      ctx.quadraticCurveTo(-radius, radius, -radius, radius - cornerRadius);
      ctx.lineTo(-radius, -radius + cornerRadius);
      ctx.quadraticCurveTo(-radius, -radius, -radius + cornerRadius, -radius);
      ctx.closePath();
      ctx.stroke();

      // Draw center point if selected or held
      if (isSelected) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.rotate(-rotation);
    ctx.translate(-position.x, -position.y);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  const render = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas with semi-transparent background
    ctx.fillStyle = 'rgba(10, 14, 39, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle grid or pattern (optional)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw existing objects
    objects.forEach(obj => {
      ctx.save();
      drawObject(ctx, obj);
      ctx.restore();
    });

    // Draw current drawing path
    if (isDrawing && currentDrawingPath.length > 0) {
      const colors = ['#00ffff', '#00ff88', '#ffaa00'];
      const color = colors[0];

      for (let i = 0; i < currentDrawingPath.length - 1; i++) {
        const point1 = currentDrawingPath[i];
        const point2 = currentDrawingPath[i + 1];

        drawNeonLine(
          ctx,
          point1.x,
          point1.y,
          point2.x,
          point2.y,
          color
        );
      }

      // Draw current drawing endpoint as dot
      if (currentDrawingPath.length > 0) {
        const lastPoint = currentDrawingPath[currentDrawingPath.length - 1];
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [objects, currentDrawingPath, isDrawing, drawObject, drawNeonLine]);

  useEffect(() => {
    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        display: 'block',
        backgroundColor: '#0a0e27',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0, 255, 200, 0.3)',
      }}
    />
  );
};

export default DrawingCanvas;
