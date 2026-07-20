"use client";

import { useRef, useState, useEffect } from "react";

export default function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dessineRef = useRef(false);
  const [vide, setVide] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  function position(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function debuter(e: React.MouseEvent | React.TouchEvent) {
    dessineRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = position(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function dessiner(e: React.MouseEvent | React.TouchEvent) {
    if (!dessineRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = position(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setVide(false);
  }

  function terminer() {
    if (!dessineRef.current) return;
    dessineRef.current = false;
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL("image/png"));
  }

  function effacer() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVide(true);
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        className="w-full border border-slate-300 rounded-md bg-white touch-none"
        onMouseDown={debuter}
        onMouseMove={dessiner}
        onMouseUp={terminer}
        onMouseLeave={terminer}
        onTouchStart={debuter}
        onTouchMove={dessiner}
        onTouchEnd={terminer}
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-slate-400">
          Signer avec la souris ou le doigt (écran tactile)
        </p>
        {!vide && (
          <button
            type="button"
            onClick={effacer}
            className="text-xs text-red-600 hover:underline"
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}
