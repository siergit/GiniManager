'use client';

import { useState } from 'react';

export default function ExportCSV({ endpoint, filename }: { endpoint: string; filename: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();

      let csvContent = '';
      const items = data.data || data.users || data.tasks || [];
      if (items.length === 0) return;

      // Headers from first item
      const headers = Object.keys(items[0]).filter(k => typeof items[0][k] !== 'object');
      csvContent += headers.join(';') + '\n';

      // Rows
      items.forEach((item: Record<string, unknown>) => {
        const row = headers.map(h => {
          const val = item[h];
          if (val === null || val === undefined) return '';
          return String(val).replace(/;/g, ',');
        });
        csvContent += row.join(';') + '\n';
      });

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? 'A exportar...' : '📥 CSV'}
    </button>
  );
}
