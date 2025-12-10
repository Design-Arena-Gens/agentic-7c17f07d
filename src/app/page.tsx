'use client';

import { WatchControls } from '../components/WatchControls';
import { WatchScene } from '../components/WatchScene';

export default function Home() {
  return (
    <main className="h-[100dvh] w-full bg-slate-950 text-slate-50">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6 lg:flex-row">
        <section className="relative flex flex-1 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-2xl min-h-[360px]">
          <WatchScene className="h-full w-full" />
          <header className="pointer-events-none absolute left-6 top-6 z-10 max-w-xs space-y-2 rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
              Mechanical Watch Trainer
            </p>
            <h1 className="text-lg font-semibold text-slate-50">
              Explore the layered watch movement in real time
            </h1>
            <p className="text-xs text-slate-400">
              Rotate, zoom, and select any component to learn how energy flows
              from the barrel to the escapement.
            </p>
          </header>
          <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-between px-6 pb-5 text-[0.7rem] uppercase tracking-[0.25em] text-slate-500">
            <span>Drag to pan · Scroll to zoom · Click components to inspect</span>
            <span className="hidden lg:inline">Orbit navigation enabled</span>
          </footer>
        </section>

        <aside className="h-full w-full overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-2xl lg:w-[22rem]">
          <WatchControls />
        </aside>
      </div>
    </main>
  );
}
