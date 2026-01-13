import React from 'react';
import { FileData } from '../types';

interface FileCardProps {
  file: FileData;
  onDelete: (id: string) => void;
  onEdit: (file: FileData) => void; 
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onEdit }) => {

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border hover:shadow-md transition flex flex-col h-full">
      
      {/* 1. AREA PREVIEW: Tetap gunakan filePath (nama fisik file) agar gambar tidak hilang */}
      <div className="aspect-video bg-slate-100 relative overflow-hidden rounded-t-xl">
        {file.fileType === 'image' ? (
          <img
            src={file.filePath} 
            alt={file.fileLabel || file.fileName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <video src={file.filePath} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* 2. NAMA JUDUL: Prioritaskan fileLabel agar nama "keren" muncul di list */}
        <h3 className="font-semibold truncate text-slate-800 mb-1" title={file.fileLabel || file.fileName}>
          {file.fileLabel || file.fileName}
        </h3>

        <div className="text-[10px] text-slate-500 flex justify-between mb-4">
          <span>{new Date(file.uploadDate).toLocaleDateString('id-ID')}</span>
          <span>{formatSize(file.fileSize)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto text-[11px]">
          <button
            onClick={() => onEdit(file)}
            className="border border-blue-600 text-blue-600 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-bold"
          >
            Edit
          </button>

          {/* 3. DOWNLOAD: Gunakan fileLabel sebagai nama file saat diunduh agar lebih rapi */}
          <a
            href={file.filePath}
            download={file.fileLabel || file.fileName}
            className="bg-blue-600 text-white py-1.5 text-center rounded-lg hover:bg-blue-700 transition-colors font-bold flex items-center justify-center"
          >
            Unduh
          </a>

          <button
            onClick={() => onDelete(file.id)}
            className="bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition-colors font-bold"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};