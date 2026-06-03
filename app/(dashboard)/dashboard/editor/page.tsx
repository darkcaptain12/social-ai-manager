"use client";

import { useState, useRef, useEffect } from "react";
import { Image, Type, Download, RotateCcw, Square, Move, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type ToolMode = "select" | "text" | "image" | "shape";
type Layer = {
  id: string;
  type: "text" | "image" | "shape";
  x: number; y: number; w: number; h: number;
  text?: string; color?: string; fontSize?: number;
  imageUrl?: string; fill?: string; opacity?: number;
};

const CANVAS_PRESETS = [
  { label: "Post (1:1)", w: 1080, h: 1080 },
  { label: "Story (9:16)", w: 1080, h: 1920 },
  { label: "Reel (9:16)", w: 1080, h: 1920 },
  { label: "Banner (4:5)", w: 1080, h: 1350 },
];

const BG_COLORS = [
  "#0f0f1a", "#1a1a2e", "#16213e", "#0d1b2a",
  "#6371f5", "#a855f7", "#ec4899", "#f59e0b",
  "#1a1a1a", "#ffffff",
];

export default function EditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolMode>("select");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#0f0f1a");
  const [preset, setPreset] = useState(CANVAS_PRESETS[0]);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => { drawCanvas(); }, [layers, bgColor, selected]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    layers.forEach((layer) => {
      ctx.globalAlpha = layer.opacity ?? 1;
      if (layer.type === "text" && layer.text) {
        ctx.font = `bold ${layer.fontSize ?? 40}px Inter, sans-serif`;
        ctx.fillStyle = layer.color ?? "#ffffff";
        ctx.fillText(layer.text, layer.x, layer.y + (layer.fontSize ?? 40));
      } else if (layer.type === "shape") {
        ctx.fillStyle = layer.fill ?? "#6371f5";
        ctx.fillRect(layer.x, layer.y, layer.w, layer.h);
      } else if (layer.type === "image" && layer.imageUrl) {
        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, layer.x, layer.y, layer.w, layer.h);
          if (layer.id === selected) {
            ctx.strokeStyle = "#6371f5";
            ctx.lineWidth = 2;
            ctx.strokeRect(layer.x, layer.y, layer.w, layer.h);
          }
        };
        img.src = layer.imageUrl;
        return;
      }
      if (layer.id === selected) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#6371f5";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(layer.x - 2, layer.y - 2, layer.w + 4, layer.h + 4);
        ctx.setLineDash([]);
      }
    });
    ctx.globalAlpha = 1;
  }

  function addText() {
    const layer: Layer = {
      id: Date.now().toString(),
      type: "text", x: 100, y: 100, w: 300, h: 60,
      text: "Metni düzenle...", color: "#ffffff", fontSize: 40,
    };
    setLayers((prev) => [...prev, layer]);
    setSelected(layer.id);
  }

  function addShape() {
    const layer: Layer = {
      id: Date.now().toString(),
      type: "shape", x: 100, y: 100, w: 200, h: 100,
      fill: "#6371f5", opacity: 0.8,
    };
    setLayers((prev) => [...prev, layer]);
    setSelected(layer.id);
  }

  function addImageFromUrl() {
    if (!imageUrl) return;
    const layer: Layer = {
      id: Date.now().toString(),
      type: "image", x: 50, y: 50, w: 400, h: 400, imageUrl,
    };
    setLayers((prev) => [...prev, layer]);
    setImageUrl("");
    toast.success("Görsel eklendi");
  }

  function deleteSelected() {
    if (!selected) return;
    setLayers((prev) => prev.filter((l) => l.id !== selected));
    setSelected(null);
  }

  function downloadCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "social-ai-design.png";
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Görsel indirildi!");
  }

  const selectedLayer = layers.find((l) => l.id === selected);

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="w-14 bg-surface-card border border-surface-border rounded-xl flex flex-col items-center py-3 gap-2">
        {[
          { mode: "select" as ToolMode, icon: Move, title: "Seç" },
          { mode: "text" as ToolMode, icon: Type, title: "Metin" },
          { mode: "image" as ToolMode, icon: Image, title: "Görsel" },
          { mode: "shape" as ToolMode, icon: Square, title: "Şekil" },
        ].map(({ mode, icon: Icon, title }) => (
          <button
            key={mode}
            title={title}
            onClick={() => { setTool(mode); if (mode === "text") addText(); if (mode === "shape") addShape(); }}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              tool === mode ? "bg-brand-950 text-brand-400 border border-brand-700" : "text-gray-500 hover:text-white hover:bg-surface-muted"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <div className="flex-1" />
        {selected && (
          <button onClick={deleteSelected} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button onClick={downloadCanvas} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-muted transition-colors" title="İndir">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => { setLayers([]); setSelected(null); }} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-muted transition-colors" title="Temizle">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center bg-surface-muted border border-surface-border rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="max-w-full max-h-full shadow-2xl rounded"
          style={{ cursor: tool === "select" ? "default" : "crosshair" }}
          onClick={(e) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            const scaleX = 500 / rect.width;
            const scaleY = 500 / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const hit = [...layers].reverse().find(
              (l) => x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h
            );
            setSelected(hit?.id ?? null);
          }}
        />
      </div>

      {/* Right panel */}
      <div className="w-56 bg-surface-card border border-surface-border rounded-xl flex flex-col overflow-y-auto no-scrollbar">
        {/* Format */}
        <div className="p-3 border-b border-surface-border">
          <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Format</p>
          <div className="space-y-1">
            {CANVAS_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPreset(p)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                  preset.label === p.label ? "bg-brand-950 text-brand-300" : "text-gray-500 hover:text-white hover:bg-surface-muted"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="p-3 border-b border-surface-border">
          <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Arka Plan</p>
          <div className="grid grid-cols-5 gap-1.5">
            {BG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-all",
                  bgColor === c ? "border-brand-400 scale-110" : "border-transparent hover:border-gray-600"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Add image from URL */}
        <div className="p-3 border-b border-surface-border">
          <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Görsel URL</p>
          <input
            className="input text-xs mb-2"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <button onClick={addImageFromUrl} className="btn-secondary w-full text-xs justify-center">
            <Plus className="w-3 h-3" />
            Ekle
          </button>
        </div>

        {/* Selected layer */}
        {selectedLayer && (
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Seçili Katman</p>
            {selectedLayer.type === "text" && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Metin</label>
                  <input
                    className="input text-xs mt-1"
                    value={selectedLayer.text ?? ""}
                    onChange={(e) => setLayers((prev) =>
                      prev.map((l) => l.id === selected ? { ...l, text: e.target.value } : l)
                    )}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Font Boyutu</label>
                  <input
                    type="range" min="12" max="120" className="w-full mt-1 accent-brand-500"
                    value={selectedLayer.fontSize ?? 40}
                    onChange={(e) => setLayers((prev) =>
                      prev.map((l) => l.id === selected ? { ...l, fontSize: parseInt(e.target.value) } : l)
                    )}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Renk</label>
                  <input
                    type="color" className="w-full h-8 mt-1 rounded cursor-pointer"
                    value={selectedLayer.color ?? "#ffffff"}
                    onChange={(e) => setLayers((prev) =>
                      prev.map((l) => l.id === selected ? { ...l, color: e.target.value } : l)
                    )}
                  />
                </div>
              </div>
            )}
            {selectedLayer.type === "shape" && (
              <div>
                <label className="text-xs text-gray-500">Şekil Rengi</label>
                <input
                  type="color" className="w-full h-8 mt-1 rounded cursor-pointer"
                  value={selectedLayer.fill ?? "#6371f5"}
                  onChange={(e) => setLayers((prev) =>
                    prev.map((l) => l.id === selected ? { ...l, fill: e.target.value } : l)
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* Layers */}
        <div className="p-3 mt-auto border-t border-surface-border">
          <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Katmanlar ({layers.length})</p>
          <div className="space-y-1">
            {[...layers].reverse().map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l.id)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2",
                  selected === l.id ? "bg-brand-950 text-brand-300" : "text-gray-500 hover:text-white hover:bg-surface-muted"
                )}
              >
                {l.type === "text" ? <Type className="w-3 h-3" /> :
                 l.type === "image" ? <Image className="w-3 h-3" /> :
                 <Square className="w-3 h-3" />}
                <span className="truncate">{l.type === "text" ? l.text?.slice(0, 15) : l.type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
