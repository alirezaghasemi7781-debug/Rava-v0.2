
import React, { useRef, useEffect, useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Scan, Sparkles, Loader2 } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useGeminiLive } from '../../hooks/useGeminiLive';

// Fix for Framer Motion type resolution issues in the current environment
const motion = _motion as any;

export const VisionOverlay: React.FC = () => {
  const { showVision, setShowVision, isRecording } = useUIStore();
  const { sendVisionFrame } = useGeminiLive();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let frameInterval: number;

    if (showVision) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        // Start streaming frames if the AI session is recording
        frameInterval = window.setInterval(() => {
          if (canvasRef.current && videoRef.current && isRecording) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            if (context) {
              canvas.width = 320; // Lower res for efficiency
              canvas.height = (video.videoHeight / video.videoWidth) * 320;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
              sendVisionFrame(base64);
              setIsAnalyzing(true);
              setTimeout(() => setIsAnalyzing(false), 500);
            }
          }
        }, 1500); // 1.5 FPS is plenty for tour guide vision
      })
      .catch(err => console.error("Camera error:", err));
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    }

    return () => clearInterval(frameInterval);
  }, [showVision, isRecording, sendVisionFrame]);

  return (
    <AnimatePresence>
      {showVision && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] bg-black"
        >
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-80"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div 
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-72 h-72 border-2 border-yellow-500/30 rounded-[3rem] relative"
            >
              {/* Corners */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-yellow-500 -mt-1 -ml-1 rounded-tl-[2rem]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-yellow-500 -mt-1 -mr-1 rounded-tr-[2rem]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-yellow-500 -mb-1 -ml-1 rounded-bl-[2rem]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-yellow-500 -mb-1 -mr-1 rounded-br-[2rem]" />
              
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.8)] z-10"
              />

              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-yellow-500/5 backdrop-blur-[2px] rounded-[3rem]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="text-yellow-500 animate-pulse" />
                      <span className="text-yellow-500 text-[10px] font-black uppercase tracking-tighter">Analyzing Reality</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-8">
            <div className="glass px-6 py-3 rounded-full flex items-center gap-3 border-yellow-500/20">
              <Loader2 size={16} className="text-yellow-500 animate-spin" />
              <span className="text-white font-bold text-xs">راوا داره محیط رو اسکن میکنه...</span>
            </div>

            <button 
              onClick={() => setShowVision(false)}
              className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"
            >
              <X size={32} />
            </button>
          </div>
          
          <div className="absolute top-16 left-0 right-0 px-8 flex justify-between items-start">
             <div className="glass p-4 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/60 text-[10px] font-black uppercase">Live Vision Session</span>
             </div>
             <div className="text-right">
                <h2 className="text-white font-black text-xl mb-1">چشم هوشمند راوا</h2>
                <p className="text-white/40 text-xs font-medium">دوربین رو بگیر سمت هر چیزی تا برات توضیح بدم</p>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
