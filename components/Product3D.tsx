"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html, useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
          Loading Model {Math.round(progress)}%
        </p>
      </div>
    </Html>
  );
}

function WatchModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <primitive 
      object={scene} 
      scale={1.8} 
      position={[0, -0.5, 0]}
    />
  );
}

function ErrorFallback({ error }: { error: string }) {
  return (
    <Html center>
      <div className="text-center p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-red-200">
        <p className="text-red-500 text-sm font-bold mb-2">Model unavailable</p>
        <p className="text-gray-400 text-xs">{error}</p>
      </div>
    </Html>
  );
}

interface Product3DViewerProps {
  modelUrl?: string;
  modelGlbUrl?: string;
}

export default function Product3DViewer({ modelUrl, modelGlbUrl }: Product3DViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const toggleRotate = () => setAutoRotate((r) => !r);
  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  if (!modelUrl && !modelGlbUrl) {
    return (
      <div className="h-[500px] w-full bg-gray-100 rounded-[40px] flex items-center justify-center">
        <div className="text-center">
          <Maximize2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">3D Model unavailable</p>
        </div>
      </div>
    );
  }

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl" 
    : "h-[500px] w-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-[40px]";

  return (
    <div className={containerClass}>
      <AnimatePresence>
        {isFullscreen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleFullscreen}
            className="fixed top-6 right-6 z-[10000] p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <Maximize2 size={20} className="text-black" />
          </motion.button>
        )}
      </AnimatePresence>

      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            <Loader />
          </div>
        }
      >
        <Canvas
          dpr={[1, 2]}
          shadows
          camera={{ position: [0, 0, 5 / zoom], fov: 45 }}
          className="h-full w-full"
        >
          <ambientLight intensity={0.4} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Stage environment="studio" intensity={0.6} adjustCamera={false}>
            {modelGlbUrl ? (
              <ErrorBoundary>
                <WatchModel url={modelGlbUrl} />
              </ErrorBoundary>
            ) : null}
          </Stage>

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={3}
            maxDistance={10}
            zoomSpeed={0.5}
          />
        </Canvas>
      </Suspense>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomOut}
          className="p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 hover:border-black transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} className="text-black" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRotate}
          className={`p-3 rounded-xl shadow-lg border transition-colors ${
            autoRotate 
              ? "bg-[#D4AF37] border-[#D4AF37] text-black" 
              : "bg-white/90 backdrop-blur-md border-gray-100 text-gray-600 hover:border-black"
          }`}
          title={autoRotate ? "Stop Rotation" : "Auto Rotate"}
        >
          <RotateCcw size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomIn}
          className="p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 hover:border-black transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} className="text-black" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className="p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 hover:border-black transition-colors"
          title="Fullscreen"
        >
          <Maximize2 size={18} className="text-black" />
        </motion.button>
      </div>
    </div>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  try {
    return <>{children}</>;
  } catch (e: any) {
    return <ErrorFallback error={e.message || "Failed to load 3D model"} />;
  }
}

export function Product3DThumbnail({ 
  modelGlbUrl, 
  onClick 
}: { 
  modelGlbUrl?: string; 
  onClick?: () => void;
}) {
  if (!modelGlbUrl) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-24 h-28 shrink-0 border-2 border-[#D4AF37]/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-b from-[#D4AF37]/5 to-transparent hover:border-[#D4AF37] hover:shadow-md"
    >
      <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
        <Maximize2 size={18} className="text-black" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">3D View</span>
    </motion.button>
  );
}