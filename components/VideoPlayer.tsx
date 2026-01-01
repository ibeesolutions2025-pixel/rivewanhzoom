
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Maximize2 } from 'lucide-react';
import { ReviewScene, AspectRatio } from '../types';

interface Props {
  scenes: ReviewScene[];
  aspectRatio: AspectRatio;
}

const VideoPlayer: React.FC<Props> = ({ scenes, aspectRatio }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const isPlayingRef = useRef(false);
  const currentSceneIndexRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Đồng bộ ref với state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentSceneIndexRef.current = currentSceneIndex;
  }, [currentSceneIndex]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignored if already stopped
      }
      sourceRef.current = null;
    }
  };

  const playScene = (index: number, offset: number = 0) => {
    if (!audioContextRef.current || !scenes[index]?.audioBuffer) {
      setIsPlaying(false);
      return;
    }
    
    stopAudio();
    setCurrentSceneIndex(index);
    
    const context = audioContextRef.current;
    const source = context.createBufferSource();
    source.buffer = scenes[index].audioBuffer!;
    source.connect(context.destination);
    
    source.onended = () => {
      // Sử dụng ref để kiểm tra giá trị mới nhất của isPlaying
      if (isPlayingRef.current && index < scenes.length - 1) {
        playScene(index + 1);
      } else if (index === scenes.length - 1) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentSceneIndex(0); // Quay lại cảnh đầu khi hết
      }
    };

    startTimeRef.current = context.currentTime - offset;
    source.start(0, offset);
    sourceRef.current = source;
  };

  const togglePlay = () => {
    initAudioContext();
    if (isPlaying) {
      const offset = audioContextRef.current!.currentTime - startTimeRef.current;
      pausedTimeRef.current = offset;
      stopAudio();
    } else {
      // Nếu đang ở cuối video, quay lại từ đầu
      const startIndex = currentSceneIndexRef.current >= scenes.length ? 0 : currentSceneIndexRef.current;
      playScene(startIndex, pausedTimeRef.current);
    }
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    stopAudio();
    setCurrentSceneIndex(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
    pausedTimeRef.current = 0;
    setProgress(0);
  };

  useEffect(() => {
    let animationFrame: number;
    const updateProgress = () => {
      if (isPlaying && audioContextRef.current && scenes[currentSceneIndex]?.audioBuffer) {
        const currentOffset = audioContextRef.current.currentTime - startTimeRef.current;
        const duration = scenes[currentSceneIndex].audioBuffer!.duration;
        
        // Tính tổng tiến trình dựa trên số lượng phân cảnh
        const totalProgress = ((currentSceneIndex + Math.min(currentOffset / duration, 1)) / scenes.length) * 100;
        setProgress(Math.min(totalProgress, 100));
      }
      animationFrame = requestAnimationFrame(updateProgress);
    };
    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, currentSceneIndex, scenes]);

  const containerClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square';

  return (
    <div className={`relative w-full max-w-md mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl ${containerClass}`}>
      {/* Cinematic Viewport */}
      {scenes.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <img 
            key={`scene-${currentSceneIndex}`} // Key quan trọng để restart animation Ken Burns
            src={scenes[currentSceneIndex].imageUrl} 
            className="w-full h-full object-cover ken-burns"
            alt={`Cảnh review ${currentSceneIndex + 1}`}
          />
          {/* Script Overlay đã bị loại bỏ theo yêu cầu */}
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 z-10">
        <div 
          className="h-full bg-green-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(34,197,94,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white hover:text-green-400 transition-transform active:scale-90">
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>
          <button onClick={reset} className="text-white hover:text-green-400 transition-transform active:scale-90">
            <RotateCcw size={22} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-white/70 bg-black/40 px-2 py-1 rounded">
            {currentSceneIndex + 1} / {scenes.length}
          </div>
          <Volume2 size={22} className="text-white" />
          <button className="text-white">
            <Maximize2 size={22} />
          </button>
        </div>
      </div>

      {/* Play Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] group cursor-pointer z-0" onClick={togglePlay}>
          <div className="w-20 h-20 rounded-full bg-green-500/90 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-all duration-300">
            <Play size={40} fill="currentColor" className="ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
