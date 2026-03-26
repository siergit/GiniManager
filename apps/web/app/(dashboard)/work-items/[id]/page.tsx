export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/work-items" className="text-gray-400 hover:text-gray-600">
          &larr; Back
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Work Item {id}</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-500">
          Work item detail page - will be populated with real data from Supabase.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Features: state transitions, checklists, comments, attachments, dependencies, time entries
        </p>
      </div>
    </div>
  );
}
