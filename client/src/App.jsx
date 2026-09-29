function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 p-8 font-sans">

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mb-2">
          Tailwind CSS v4 ✅
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Visual test for utilities, colors, layout & dark mode
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-10">

        {/* Typography */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Typography
          </h2>
          <p className="text-xs text-gray-400 mb-1">text-xs</p>
          <p className="text-sm text-gray-500 mb-1">text-sm</p>
          <p className="text-base mb-1">text-base (default)</p>
          <p className="text-lg font-medium mb-1">text-lg font-medium</p>
          <p className="text-2xl font-bold mb-1">text-2xl font-bold</p>
          <p className="text-4xl font-extrabold tracking-tight">text-4xl extrabold</p>
        </section>

        {/* Color Palette */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Color Palette
          </h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {["bg-red-400","bg-orange-400","bg-amber-400","bg-yellow-400","bg-lime-400",
              "bg-green-400","bg-teal-400","bg-cyan-400","bg-blue-400","bg-indigo-400",
              "bg-violet-400","bg-purple-400","bg-fuchsia-400","bg-pink-400","bg-rose-400",
              "bg-slate-400","bg-gray-400","bg-zinc-400","bg-neutral-400","bg-stone-400",
            ].map((c) => (
              <div key={c} className={`${c} h-8 rounded-lg`} title={c} />
            ))}
          </div>
        </section>

        {/* Flexbox */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Flexbox
          </h2>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {["justify-start","justify-center","justify-end","items-stretch"].map((label) => (
              <span key={label} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-mono">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-indigo-200 dark:bg-indigo-800 rounded-lg h-12 flex items-center justify-center text-sm font-medium">flex-1</div>
            <div className="flex-2 bg-indigo-300 dark:bg-indigo-700 rounded-lg h-12 flex items-center justify-center text-sm font-medium">flex-2</div>
            <div className="flex-1 bg-indigo-200 dark:bg-indigo-800 rounded-lg h-12 flex items-center justify-center text-sm font-medium">flex-1</div>
          </div>
        </section>

        {/* Grid */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Grid (responsive)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {["One","Two","Three","Four","Five","Six"].map((n) => (
              <div key={n} className="bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-700 rounded-xl p-4 text-center text-violet-700 dark:text-violet-300 font-semibold">
                {n}
              </div>
            ))}
          </div>
        </section>

        {/* Hover & Focus States */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Interactive States
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer">
              Hover me
            </button>
            <button className="border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer">
              Outline button
            </button>
            <input
              type="text"
              placeholder="Focus me..."
              className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder-gray-400"
            />
          </div>
        </section>

        {/* Spacing & Sizing */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Spacing & Sizing
          </h2>
          <div className="flex items-end gap-2">
            {[4,8,12,16,20,24].map((s) => (
              <div
                key={s}
                style={{ height: `${s * 4}px`, width: `${s * 4}px` }}
                className="bg-teal-400 dark:bg-teal-600 rounded flex items-center justify-center text-xs font-bold text-white"
              >
                {s}
              </div>
            ))}
          </div>
        </section>

        {/* Dark Mode */}
        <section className="bg-gray-900 rounded-2xl shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">Dark Mode</h2>
          <p className="text-gray-400 text-sm">
            This card is always dark. Toggle your OS/browser theme to see the rest of the page adapt via{" "}
            <code className="text-pink-400 bg-gray-800 px-1 py-0.5 rounded text-xs">dark:</code> variants.
          </p>
        </section>

      </main>

      <footer className="max-w-4xl mx-auto mt-12 text-center text-sm text-gray-400 dark:text-gray-600">
        Tailwind CSS v4 · Vite · React — all systems go 🚀
      </footer>
    </div>
  )
}

export default App
