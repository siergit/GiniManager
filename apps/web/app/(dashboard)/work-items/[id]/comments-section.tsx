'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user: { id: string; full_name: string } | null;
}

export default function CommentsSection({ workItemId, comments }: { workItemId: string; comments: Comment[] }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/work-items/${workItemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        setBody('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  function getReplies(parentId: string) {
    return replies.filter(r => r.parent_id === parentId);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Comments ({comments.length})</h2>

      {comments.length > 0 && (
        <div className="mt-4 space-y-4">
          {topLevel.map(comment => (
            <div key={comment.id}>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {comment.user?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{comment.user?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
              {/* Replies */}
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="ml-11 mt-3 flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {reply.user?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{reply.user?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(reply.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
