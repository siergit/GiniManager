export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">GiniManager</h1>
        <p className="mt-4 text-lg text-gray-600">
          Operational Team Management
        </p>
        <p className="mt-2 text-sm text-gray-400">
          SIER - UnikRobotics / MACH4
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  );
}
