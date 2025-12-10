import { create } from 'zustand';

export type WatchView = 'iso' | 'top' | 'side' | 'exploded';

export type WatchLayer =
  | 'mainPlate'
  | 'barrel'
  | 'gearTrain'
  | 'escapement'
  | 'balance'
  | 'hands'
  | 'bridges';

export interface PartInfo {
  id: string;
  title: string;
  description: string;
  focusView?: WatchView;
}

const partCatalog: Record<string, PartInfo> = {
  mainPlate: {
    id: 'mainPlate',
    title: 'Main Plate',
    description:
      'The structural foundation of the movement that carries the gear train pivots, barrel, and bridges.',
    focusView: 'top',
  },
  barrel: {
    id: 'barrel',
    title: 'Barrel & Mainspring',
    description:
      'Stores the wound energy that powers the mechanism and drives the first wheel via the barrel teeth.',
    focusView: 'iso',
  },
  thirdWheel: {
    id: 'thirdWheel',
    title: 'Third Wheel',
    description:
      'Intermediate gear that passes torque from the barrel to the fourth wheel while increasing rotational speed.',
  },
  fourthWheel: {
    id: 'fourthWheel',
    title: 'Fourth Wheel',
    description:
      'Drives the seconds hand; rotates once per minute with a fine pinion engaging the escape wheel.',
  },
  escapeWheel: {
    id: 'escapeWheel',
    title: 'Escape Wheel',
    description:
      'Delivers impulses to the pallet fork, releasing energy to the balance wheel in precise increments.',
    focusView: 'exploded',
  },
  palletFork: {
    id: 'palletFork',
    title: 'Pallet Fork',
    description:
      'Oscillates between the escape wheel teeth, locking and unlocking the train while transmitting impulses to the balance.',
  },
  balance: {
    id: 'balance',
    title: 'Balance Wheel',
    description:
      'Regulates the watch by oscillating at a steady frequency, returning via the hairspring after each impulse.',
    focusView: 'iso',
  },
  hands: {
    id: 'hands',
    title: 'Hand Stack',
    description:
      'Hour, minute, and seconds hands mounted concentrically for time indication above the dial plane.',
    focusView: 'top',
  },
  bridges: {
    id: 'bridges',
    title: 'Bridge Assembly',
    description:
      'Secures the upper pivots of the train and balances while providing rigidity and precise endshake.',
  },
};

interface WatchState {
  layers: Record<WatchLayer, boolean>;
  explode: number;
  speed: number;
  view: WatchView;
  selectedPart?: string;
  partCatalog: Record<string, PartInfo>;
  toggleLayer: (layer: WatchLayer) => void;
  setExplode: (value: number) => void;
  setSpeed: (value: number) => void;
  setView: (view: WatchView) => void;
  selectPart: (id?: string) => void;
}

export const useWatchStore = create<WatchState>((set) => ({
  layers: {
    mainPlate: true,
    barrel: true,
    gearTrain: true,
    escapement: true,
    balance: true,
    hands: true,
    bridges: true,
  },
  explode: 0,
  speed: 1,
  view: 'iso',
  selectedPart: 'mainPlate',
  partCatalog,
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),
  setExplode: (value) => set(() => ({ explode: value })),
  setSpeed: (value) => set(() => ({ speed: value })),
  setView: (view) => set(() => ({ view })),
  selectPart: (id) => set(() => ({ selectedPart: id })),
}));

export const getPartInfo = (id?: string) => {
  if (!id) return undefined;
  return partCatalog[id];
};
