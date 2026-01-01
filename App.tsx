
import React, { useState } from 'react';
import { analyzePlantAndHints, generateTTS, decodeAudioBuffer } from './services/geminiService';
import { exportVideo } from './services/exportService';
import { ReviewStyle, PlantAnalysis, ReviewScene, AspectRatio, RawSceneInput } from './types';
import SceneBuilder from './components/SceneBuilder';
import VideoPlayer from './components/VideoPlayer';
import { Leaf, Sparkles, Loader2, Play, CheckCircle, ChevronRight, Share2, Download, Video, History } from 'lucide-react';

const App: React.FC = () => {
  const [scenesInput, setScenesInput] = useState<RawSceneInput[]>([
    { id: '1', imageUrl: '', hint: '' }
  ]);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ReviewStyle>(ReviewStyle.EDUCATIONAL);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [finalScenes, setFinalScenes] = useState<ReviewScene[]>([]);
  const [step, setStep] = useState(1);

  const handleProcess = async () => {
    const validScenes = scenesInput.filter(s => s.imageUrl && s.hint);
    if (validScenes.length === 0) {
      alert("Vui lòng thêm ít nhất một phân cảnh có ảnh và gợi ý kịch bản.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await analyzePlantAndHints(validScenes, selectedStyle);
      setAnalysis(result);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const readyScenes: ReviewScene[] = [];

      for (let i = 0; i < result.polishedScripts.length; i++) {
        const scriptText = result.polishedScripts[i];
        const audioBytes = await generateTTS(scriptText, selectedStyle);
        const audioBuffer = await decodeAudioBuffer(audioBytes, audioCtx);
        
        readyScenes.push({
          imageUrl: validScenes[i].imageUrl,
          scriptText,
          audioBuffer
        });
      }

      setFinalScenes(readyScenes);
      setStep(3);
    } catch (error) {
      console.error("Lỗi xử lý:", error);
      alert("Không thể tạo video review. Vui lòng kiểm tra kết nối hoặc API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (finalScenes.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const videoBlob = await exportVideo(finalScenes, aspectRatio, (p) => setExportProgress(p));
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Review_${analysis?.name || 'Cay_Trong'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi xuất video:", error);
      alert("Có lỗi xảy ra khi xuất video. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
              <Leaf size={24} />
            </div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">PlantReview <span className="text-green-600">AI</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${step >= 1 ? 'text-green-600' : 'text-slate-300'}`}>1. XÂY DỰNG</span>
                <ChevronRight size={14} className="text-slate-300" />
                <span className={`text-xs font-bold ${step >= 3 ? 'text-green-600' : 'text-slate-300'}`}>2. XUẤT VIDEO</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Kể chuyện về cây của bạn</h2>
              <p className="text-slate-500 text-lg">Thêm ảnh thực tế và gợi ý kịch bản review chân thực.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-green-500" />
                Chọn phong cách review
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: ReviewStyle.EDUCATIONAL, label: 'Kiến thức', desc: 'Sâu sắc, tỉ mỉ' },
                  { id: ReviewStyle.ENTHUSIASTIC, label: 'Hào hứng', desc: 'Năng lượng cao' },
                  { id: ReviewStyle.RELAXING, label: 'Thư giãn', desc: 'Nhẹ nhàng, chill' },
                  { id: ReviewStyle.QUICK, label: 'Ngắn gọn', desc: 'Nhanh, súc tích' },
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id as ReviewStyle)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${selectedStyle === style.id ? 'border-green-600 bg-green-50 shadow-inner' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                  >
                    <div className={`text-sm font-bold mb-0.5 ${selectedStyle === style.id ? 'text-green-700' : 'text-slate-600'}`}>
                      {style.label}
                    </div>
                    <div className="text-[10px] text-slate-400">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 ml-1">
                <Video size={18} className="text-green-500" />
                Thiết kế từng phân cảnh
              </h3>
              <SceneBuilder scenes={scenesInput} onScenesChange={setScenesInput} />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="text-sm font-bold text-slate-700">Tỷ lệ khung hình đầu ra</span>
              <div className="flex gap-2">
                {(['1:1', '9:16'] as AspectRatio[]).map(format => (
                  <button
                    key={format}
                    onClick={() => setAspectRatio(format)}
                    className={`flex-1 md:flex-none px-6 py-2 text-xs font-bold border-2 rounded-lg transition-all ${aspectRatio === format ? 'border-green-600 bg-green-50 text-green-600' : 'border-slate-100 text-slate-400'}`}
                  >
                    {format === '1:1' ? 'Vuông (Post)' : 'Dọc (Story/TikTok)'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-black disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 group"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  AI đang gom cảnh và tạo video review...
                </>
              ) : (
                <>
                  Gom toàn bộ phân cảnh & Tạo Review
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        {step === 3 && analysis && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-slate-900">Review: {analysis.name}</h2>
              <p className="text-slate-500 italic">{analysis.scientificName}</p>
            </div>

            <VideoPlayer scenes={finalScenes} aspectRatio={aspectRatio} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-widest text-green-600 flex items-center gap-2">
                  <CheckCircle size={14} />
                  Mẹo Chăm Sóc Thực Tế
                </h4>
                <ul className="space-y-3">
                  {analysis.careTips.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-green-600">{i+1}</span>
                      </div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setStep(1)}
                  disabled={isExporting}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <History size={18} />
                  Chỉnh sửa phân cảnh
                </button>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 flex flex-col items-center justify-center gap-1 hover:bg-green-700 disabled:bg-slate-400 transition-all relative overflow-hidden"
                >
                  {isExporting ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        Đang xuất video... {Math.round(exportProgress)}%
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all" style={{ width: `${exportProgress}%` }} />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Download size={20} />
                        Xuất Video Hoàn Chỉnh
                      </div>
                      <span className="text-[10px] font-normal opacity-80">Ghi lại toàn bộ phân cảnh thành MP4</span>
                    </>
                  )}
                </button>
                <div className="flex gap-3">
                  <button className="flex-1 p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-black">
                    <Share2 size={20} />
                    <span className="font-bold text-sm">Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
