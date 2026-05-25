import { useRef, useState, type DragEvent } from "react";

interface FileDropZoneProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  accept?: string;
  dimensions: string;
}

export function FileDropZone({ onFileSelect, file, accept = "image/*", dimensions }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
        dragOver
          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
          : file
            ? "border-green-400 bg-green-50/50 dark:border-green-600 dark:bg-green-900/10"
            : "border-gray-300 bg-gray-50/50 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-white/[0.02] dark:hover:border-brand-600 dark:hover:bg-white/[0.04]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
        }}
        className="hidden"
      />

      {preview ? (
        <div className="flex items-center gap-4 p-4">
          <img src={preview} alt="Preview" className="h-20 w-28 rounded-lg object-cover shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/80">{file?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{(file!.size / 1024).toFixed(1)} KB</p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Listo para subir</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (inputRef.current) inputRef.current.value = "";
              onFileSelect(null);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-3 rounded-full bg-brand-50 p-3 dark:bg-brand-500/10">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Arrastra una imagen o <span className="text-brand-500">haz clic aquí</span>
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WebP · {dimensions}</p>
        </div>
      )}
    </div>
  );
}
