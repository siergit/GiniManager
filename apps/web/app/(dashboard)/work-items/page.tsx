import Link from 'next/link';

const mockAreas = [
  {
    id: '1',
    title: 'UnikRobotics',
    type: 'area' as const,
    state: 'in_progress',
    priority: 'high',
    children: [
      {
        id: '1.1',
        title: 'UnikOne - Projeto',
        type: 'project' as const,
        state: 'in_progress',
        priority: 'high',
        tasksCount: 45,
        doneCount: 32,
      },
      {
        id: '1.2',
        title: 'UnikAutoCharger',
        type: 'project' as const,
        state: 'in_progress',
        priority: 'medium',
        tasksCount: 12,
        doneCount: 5,
      },
      {
        id: '1.3',
        title: 'UnikSuperSpeed',
        type: 'project' as const,
        state: 'backlog',
        priority: 'low',
        tasksCount: 8,
        doneCount: 0,
      },
    ],
  },
  {
    id: '2',
    title: 'MACH4',
    type: 'area' as const,
    state: 'in_progress',
    priority: 'medium',
    children: [
      {
        id: '2.1',
        title: 'MACH4 - Cotovia - Sesimbra',
        type: 'project' as const,
        state: 'in_progress',
        priority: 'medium',
        tasksCount: 6,
        doneCount: 2,
      },
      {
        id: '2.2',
        title: 'MACH4 - Padrão da Légua',
        type: 'project' as const,
        state: 'planned',
        priority: 'medium',
        tasksCount: 4,
        doneCount: 0,
      },
    ],
  },
  {
    id: '3',
    title: 'Marketing Unik',
    type: 'area' as const,
    state: 'in_progress',
    priority: 'low',
    children: [
      {
        id: '3.1',
        title: 'Content & Videos',
        type: 'project' as const,
        state: 'in_progress',
        priority: 'medium',
        tasksCount: 7,
        doneCount: 1,
      },
    ],
  },
];

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  none: '⚪',
};

export default function WorkItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Items</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your project hierarchy</p>
        </div>
        <Link
          href="/work-items/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + New Item
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
          <option>All Types</option>
          <option>Area</option>
          <option>Project</option>
          <option>Delivery</option>
          <option>Task</option>
          <option>Subtask</option>
        </select>
        <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
          <option>All States</option>
          <option>Backlog</option>
          <option>In Progress</option>
          <option>Blocked</option>
          <option>Done</option>
        </select>
        <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
          <option>All Priorities</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input
          type="text"
          placeholder="Search..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Work Items Tree */}
      <div className="space-y-4">
        {mockAreas.map((area) => (
          <div key={area.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Area Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="text-lg">{priorityIcons[area.priority]}</span>
              <h3 className="text-base font-semibold text-gray-900">{area.title}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColors[area.state]}`}>
                {area.state.replace('_', ' ')}
              </span>
              <span className="ml-auto text-xs text-gray-400 uppercase tracking-wide">Area</span>
            </div>
            {/* Projects */}
            <div className="divide-y divide-gray-100">
              {area.children.map((project) => (
                <Link
                  key={project.id}
                  href={`/work-items/${project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="ml-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{priorityIcons[project.priority]}</span>
                      <p className="text-sm font-medium text-gray-900 truncate">{project.title}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColors[project.state]}`}>
                    {project.state.replace('_', ' ')}
                  </span>
                  {/* Progress */}
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${project.tasksCount > 0 ? (project.doneCount / project.tasksCount * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {project.doneCount}/{project.tasksCount}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide w-16 text-right">Project</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
