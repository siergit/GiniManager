'use client';

interface Template {
  name: string;
  icon: string;
  description: string;
  defaults: Record<string, string | number>;
}

const templates: Template[] = [
  {
    name: 'Maquinação CNC',
    icon: '🔧',
    description: 'Preparação CAM, Verificação material, Corte, Maquinação, Acabamento, SN',
    defaults: { item_type: 'delivery', priority: 'medium', estimated_hours: '8' },
  },
  {
    name: 'Montagem Mecânica',
    icon: '⚙️',
    description: 'Montagem de componentes mecânicos com testes',
    defaults: { item_type: 'task', priority: 'medium', estimated_hours: '4' },
  },
  {
    name: 'Montagem Eletrónica',
    icon: '⚡',
    description: 'Cablagem, montagem quadro, parametrização',
    defaults: { item_type: 'task', priority: 'medium', estimated_hours: '6' },
  },
  {
    name: 'Desenho CAD',
    icon: '📐',
    description: 'Desenho no Fusion 360, BOM, atualização documentação',
    defaults: { item_type: 'task', priority: 'medium', estimated_hours: '4' },
  },
  {
    name: 'Teste & Validação',
    icon: '🧪',
    description: 'Teste funcional, parametrização, burn-in',
    defaults: { item_type: 'task', priority: 'high', estimated_hours: '3' },
  },
  {
    name: 'Instalação no Cliente',
    icon: '🏢',
    description: 'Projeto instalação, preparação, deslocação, montagem',
    defaults: { item_type: 'delivery', priority: 'high', estimated_hours: '16' },
  },
  {
    name: 'Manutenção',
    icon: '🔨',
    description: 'Manutenção periódica ou reparação',
    defaults: { item_type: 'task', priority: 'medium', estimated_hours: '2' },
  },
  {
    name: 'Produção de Peças',
    icon: '🏭',
    description: 'Preparação CAM, corte, maquinação, acabamento, SN, embalamento',
    defaults: { item_type: 'delivery', priority: 'medium', estimated_hours: '12' },
  },
];

export default function Templates({ onSelect }: { onSelect: (defaults: Record<string, string | number>) => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Templates</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {templates.map(t => (
          <button
            key={t.name}
            type="button"
            onClick={() => onSelect({ ...t.defaults, title: t.name })}
            className="text-left rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="text-lg">{t.icon}</span>
            <p className="mt-1 text-xs font-medium text-gray-900">{t.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
