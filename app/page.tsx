export default async function Home() {
  let achievements = [];
  let errorMsg = null;

  try {
    const res = await fetch("http://localhost:8080/api/achievements", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status}`);
    }
    const data = await res.json();
    // In case the API returns an array directly, or a structured object
    achievements = Array.isArray(data) ? data : data.data || [];
  } catch (err: any) {
    errorMsg = err.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-4xl rounded-2xl bg-white p-12 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col items-center mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
            Achievements
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            A list of all achievements fetched entirely through our shiny new Gateway.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-6 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-800 mb-8">
            <p className="font-semibold text-center">{errorMsg}</p>
          </div>
        )}

        {!errorMsg && achievements.length === 0 && (
          <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">
            No achievements found yet! Start unlocking some!
          </div>
        )}

        {!errorMsg && achievements.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((item: any, idx: number) => (
              <li
                key={item.id || idx}
                className="group relative rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {item.name || "Unknown Achievement"}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-grow">
                    {item.description || "No description provided."}
                  </p>
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                      {item.amount ? `${item.amount} pts` : "Reward"}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">
                      ID: {item.id || idx}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

