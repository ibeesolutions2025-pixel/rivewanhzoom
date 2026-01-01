
import React from 'react';
import { Plus, Trash2, Upload, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { RawSceneInput } from '../types';

interface Props {
  scenes: RawSceneInput[];
  onScenesChange: (scenes: RawSceneInput[]) => void;
}

const SceneBuilder: React.FC<Props> = ({ scenes, onScenesChange }) => {
  const addScene = () => {
    const newScene: RawSceneInput = {
      id: Math.random().toString(36).substr(2, 9),
      imageUrl: '',
      hint: ''
    };
    onScenesChange([...scenes, newScene]);
  };

  const updateScene = (id: string, updates: Partial<RawSceneInput>) => {
    onScenesChange(scenes.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeScene = (id: string) => {
    if (scenes.length === 1) {
      alert("Cần có ít nhất một phân cảnh.");
      return;
    }
    onScenesChange(scenes.filter(s => s.id !== id));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateScene(id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {scenes.map((scene, index) => (
        <div key={scene.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phân cảnh {index + 1}</span>
            <button 
              onClick={() => removeScene(scene.id)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="p-4 flex flex-col md:flex-row gap-4">
            {/* Image Section */}
            <div className="w-full md:w-40 shrink-0">
              {scene.imageUrl ? (
                <div className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={scene.imageUrl} alt="Cảnh" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload size={20} className="text-white" />
                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(scene.id, e)} />
                  </label>
                </div>
              ) : (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-200 transition-all">
                  <ImageIcon className="text-slate-300 mb-1" size={24} />
                  <span className="text-[10px] font-bold text-slate-400">ĐĂNG ẢNH</span>
                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(scene.id, e)} />
                </label>
              )}
            </div>

            {/* Hint Section */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <MessageSquare size={14} />
                <span className="text-xs font-semibold">Kịch bản gợi ý cho cảnh này?</span>
              </div>
              <textarea
                placeholder="Ví dụ: Giới thiệu về màu lá, nói về việc cây mới mua về rất tươi..."
                value={scene.hint}
                onChange={(e) => updateScene(scene.id, { hint: e.target.value })}
                className="w-full h-24 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addScene}
        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all"
      >
        <Plus size={20} />
        <span className="font-bold text-sm">Thêm phân cảnh mới</span>
      </button>
    </div>
  );
};

export default SceneBuilder;
