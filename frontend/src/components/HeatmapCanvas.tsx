import { useEffect, useRef } from 'react';

interface HeatmapCanvasProps {
  playerId: string;
  position: string;
  role?: string;
}

export default function HeatmapCanvas({ playerId, position, role }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get position-based heatmap zones
  const getHeatZones = (pos: string): number[][] => {
    const grid: number[][] = Array(8)
      .fill(null)
      .map(() => Array(6).fill(0));

    const seed = playerId.charCodeAt(0);
    const noise = (i: number) => Math.sin(seed * i) * 0.15;

    if (pos === 'GK') {
      // Goalkeeper: high concentration in goal area (rows 0-1)
      for (let i = 0; i < 2; i++) {
        for (let j = 2; j < 4; j++) {
          grid[i][j] = 0.8 + noise(i * j);
        }
      }
    } else if (pos === 'DEF') {
      // Defender: rows 1-3, spread across columns
      for (let i = 1; i < 4; i++) {
        for (let j = 0; j < 6; j++) {
          grid[i][j] = 0.6 + noise(i * j) + (Math.abs(j - 2.5) < 2 ? 0.2 : 0);
        }
      }
    } else if (pos === 'MID') {
      // Midfielder: rows 2-5, center-focused
      for (let i = 2; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          grid[i][j] = 0.5 + noise(i * j) + (Math.abs(j - 2.5) < 2 ? 0.3 : 0);
        }
      }
    } else if (pos === 'FWD') {
      // Forward: rows 4-7, attacking half
      for (let i = 4; i < 8; i++) {
        for (let j = 1; j < 5; j++) {
          grid[i][j] = 0.7 + noise(i * j);
        }
      }
    }

    return grid;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const heatZones = getHeatZones(position);
    const cellWidth = canvas.width / 6;
    const cellHeight = canvas.height / 8;

    // Draw heatmap gradient
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 6; j++) {
        const intensity = Math.min(heatZones[i][j], 1);

        // Green to red gradient
        const r = Math.floor(intensity * 200);
        const g = Math.floor((1 - intensity) * 150);
        const b = Math.floor((1 - intensity) * 100);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);

        // Cell border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      }
    }

    // Draw pitch overlay (SVG-like lines)
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 2;

    // Center line (vertical)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.12, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty boxes (left)
    ctx.strokeRect(0, canvas.height * 0.25, canvas.width * 0.2, canvas.height * 0.5);

    // Penalty boxes (right)
    ctx.strokeRect(canvas.width * 0.8, canvas.height * 0.25, canvas.width * 0.2, canvas.height * 0.5);

    // Goal areas
    ctx.strokeRect(0, canvas.height * 0.35, canvas.width * 0.08, canvas.height * 0.3);
    ctx.strokeRect(canvas.width * 0.92, canvas.height * 0.35, canvas.width * 0.08, canvas.height * 0.3);

    // Center spot
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [position, playerId]);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Position Heatmap</h3>
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={320}
          height={480}
          className="border border-dark-border rounded"
        />
        <div className="flex gap-6 text-xs w-full">
          <div>
            <p className="text-text-secondary mb-2">Role: {role || 'Unknown'}</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 rounded" style={{ background: 'rgb(200, 150, 100)' }} />
              <span className="text-text-secondary">Low Activity</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-4 rounded" style={{ background: 'rgb(0, 100, 0)' }} />
              <span className="text-text-secondary">High Activity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
