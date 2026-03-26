import { createAdminClient } from '@/lib/supabase-admin';
import FileUpload from './file-upload';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const mimeIcons: Record<string, string> = {
  'image': '🖼️',
  'application/pdf': '📄',
  'text': '📝',
  'application/vnd': '📊',
  'default': '📎',
};

function getIcon(mime: string): string {
  if (mime.startsWith('image')) return mimeIcons['image'];
  if (mime === 'application/pdf') return mimeIcons['application/pdf'];
  if (mime.startsWith('text')) return mimeIcons['text'];
  if (mime.includes('sheet') || mime.includes('excel')) return mimeIcons['application/vnd'];
  return mimeIcons['default'];
}

export default async function AttachmentsSection({ workItemId }: { workItemId: string }) {
  const supabase = createAdminClient();

  const { data: attachments } = await supabase
    .from('attachments')
    .select('*, uploader:users!attachments_uploaded_by_fkey(full_name)')
    .eq('work_item_id', workItemId)
    .order('created_at', { ascending: false });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Anexos ({attachments?.length || 0})</h2>
        <FileUpload workItemId={workItemId} />
      </div>

      {attachments && attachments.length > 0 ? (
        <div className="mt-3 space-y-2">
          {attachments.map((att: { id: string; file_name: string; file_size: number; mime_type: string; created_at: string; uploader: { full_name: string } | null }) => (
            <div key={att.id} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="text-lg">{getIcon(att.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 truncate">{att.file_name}</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(att.file_size)} · {att.uploader?.full_name || 'Unknown'} · {new Date(att.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">Sem anexos. Clica em "Anexar ficheiro" para adicionar.</p>
      )}
    </div>
  );
}
