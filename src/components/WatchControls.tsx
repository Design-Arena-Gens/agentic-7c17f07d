'use client';

import clsx from 'clsx';
import { getPartInfo, useWatchStore, WatchLayer, WatchView } from '../state/useWatchStore';

const layerLabels: Record<WatchLayer, string> = {
  mainPlate: 'Main Plate',
  barrel: 'Barrel & Mainspring',
  gearTrain: 'Gear Train',
  escapement: 'Escapement',
  balance: 'Balance Assembly',
  hands: 'Hand Stack',
  bridges: 'Bridges',
};

const viewLabels: Record<WatchView, string> = {
  iso: 'Isometric',
  top: 'Top',
  side: 'Side',
  exploded: 'Exploded',
};

export function WatchControls() {
  const {
    layers,
    toggleLayer,
    explode,
    setExplode,
    speed,
    setSpeed,
    selectedPart,
    selectPart,
    view,
    setView,
  } = useWatchStore();

  const part = getPartInfo(selectedPart);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-slate-950/70 px-6 py-8 text-slate-100">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Layers
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(layers) as WatchLayer[]).map((key) => (
            <label
              key={key}
              className={clsx(
                'flex cursor-pointer items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 transition',
                layers[key] ? 'ring-1 ring-sky-500/40' : 'opacity-70'
              )}
            >
              <span className="text-sm font-medium text-slate-200">
                {layerLabels[key]}
              </span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-sky-500"
                checked={layers[key]}
                onChange={() => toggleLayer(key)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Exploded View
        </h2>
        <div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            onChange={(event) => setExplode(Number(event.target.value))}
            className="w-full accent-sky-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Separate layers for inspection ({Math.round(explode * 100)}%)
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Motion
        </h2>
        <div>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="w-full accent-sky-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Playback speed ×{speed.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Camera
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(viewLabels) as WatchView[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={clsx(
                'rounded-md border border-slate-700/70 px-3 py-2 text-sm font-medium transition',
                view === mode
                  ? 'bg-sky-600/80 text-white'
                  : 'bg-slate-900/60 text-slate-300 hover:border-sky-500/60 hover:text-white'
              )}
            >
              {viewLabels[mode]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 pb-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Inspector
        </h2>
        {part ? (
          <article className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/60 p-4">
            <header>
              <h3 className="text-base font-semibold text-slate-100">
                {part.title}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {part.description}
              </p>
            </header>
            <button
              type="button"
              onClick={() => {
                if (part.focusView) setView(part.focusView);
              }}
              className="inline-flex items-center rounded-md border border-sky-500/60 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/10"
            >
              Align camera
            </button>
            <button
              type="button"
              onClick={() => selectPart(undefined)}
              className="inline-flex items-center rounded-md border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700/40"
            >
              Clear selection
            </button>
          </article>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 px-4 py-6 text-sm text-slate-500">
            Select a component in the movement or use the controls above to
            activate a layer.
          </div>
        )}
      </section>
    </div>
  );
}
