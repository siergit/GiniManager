'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs text-gray-400 hover:text-blue-600 transition-colors no-print"
    >
      🖨️ Imprimir
    </button>
  );
}
