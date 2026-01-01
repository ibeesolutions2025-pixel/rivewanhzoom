
import React from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ImageUploader: React.FC<Props> = ({ images, onImagesChange }) => {
  // Fix: Handle file change by explicitly casting to File[] and ensuring results are strings
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files = Array.from(fileList) as File[];
    const newResults: string[] = [];
    let processed = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newResults.push(reader.result);
        }
        processed++;
        // Update state once all files in this batch are read
        if (processed === files.length) {
          onImagesChange([...images, ...newResults]);
        }
      };
      // Explicitly treat 'file' as a Blob (File extends Blob)
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((img, i) => (
          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-green-100 group">
            <img src={img} alt={`Plant ${i}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-green-200 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
          <Upload className="text-green-500 mb-1" size={20} />
          <span className="text-[10px] text-green-600 font-medium">Upload</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      {images.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <ImageIcon className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-sm text-gray-500">Add up to 5 photos of your plant to start</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
