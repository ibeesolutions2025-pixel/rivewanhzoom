
import { ReviewScene, AspectRatio } from "../types";

export async function exportVideo(
  scenes: ReviewScene[],
  aspectRatio: AspectRatio,
  onProgress: (p: number) => void
): Promise<Blob> {
  const width = aspectRatio === '9:16' ? 720 : 1080;
  const height = aspectRatio === '9:16' ? 1280 : 1080;
  const fps = 30;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();
  const stream = canvas.captureStream(fps);
  
  // Kết hợp stream video từ canvas và stream audio từ WebAudio
  const combinedStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 5000000 // 5Mbps
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    recorder.start();

    let totalDuration = 0;
    scenes.forEach(s => totalDuration += s.audioBuffer?.duration || 0);
    let currentTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const audioBuffer = scene.audioBuffer!;
      const duration = audioBuffer.duration;
      
      // Load image
      const img = new Image();
      img.src = scene.imageUrl;
      await new Promise((res) => (img.onload = res));

      // Play audio to destination
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      source.start();

      const frames = Math.ceil(duration * fps);

      for (let f = 0; f < frames; f++) {
        const frameTime = f / fps;
        const progress = frameTime / duration;
        
        // Hiệu ứng Ken Burns (Zoom)
        const scale = 1 + progress * 0.15; // Zoom từ 100% lên 115%
        const drawWidth = width * scale;
        const drawHeight = height * scale;
        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;

        // Vẽ ảnh
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // PHẦN VẼ VĂN BẢN (SUBTITLES) ĐÃ BỊ LOẠI BỎ THEO YÊU CẦU

        onProgress(((currentTime + frameTime) / totalDuration) * 100);
        
        // Sync frame rate
        await new Promise(r => setTimeout(r, 1000 / fps));
      }
      
      currentTime += duration;
      await new Promise(r => setTimeout(r, 100)); // Gap nhỏ giữa các cảnh
    }

    recorder.stop();
  });
}
