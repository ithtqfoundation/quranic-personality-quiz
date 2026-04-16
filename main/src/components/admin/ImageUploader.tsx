'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  uploadEndpoint?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  uploadEndpoint = '/api/admin/landing/upload',
  accept = 'image/*',
  maxSizeMB = 5,
  className = '',
  label = 'Upload Image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      onChange(data.url || data.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-300 mb-2 block">{label}</label>

      {value ? (
        /* Preview */
        <div className="relative group rounded-lg overflow-hidden border border-white/10">
          <div className="aspect-video relative bg-[#0f1117]">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-gray-300 hover:text-red-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-1.5 text-[10px] text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
            {value}
          </div>
        </div>
      ) : (
        /* Drop Zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all
            ${dragOver
              ? 'border-emerald-400 bg-emerald-500/5'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-500 border-t-emerald-400" />
              <p className="text-sm text-gray-400">Uploading...</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-white/5">
                {dragOver ? <ImageIcon size={24} className="text-emerald-400" /> : <Upload size={24} className="text-gray-500" />}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Drop image here or <span className="text-emerald-400">browse</span></p>
                <p className="text-[10px] text-gray-500 mt-1">Max {maxSizeMB}MB • PNG, JPG, WebP</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
}
