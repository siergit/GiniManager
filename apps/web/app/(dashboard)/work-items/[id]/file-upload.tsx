'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function FileUpload({ workItemId }: { workItemId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/work-items/${workItemId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        onChange={handleUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="text-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
      >
        {uploading ? 'A enviar...' : '📎 Anexar ficheiro'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
