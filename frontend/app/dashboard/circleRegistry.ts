const STORAGE_KEY = "circleRegistry";

type Registry = Record<string, string>;

function readRegistry(): Registry {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Registry) : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry: Registry) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // noop
  }
}

export function saveCircleLabel(address: string, label: string) {
  if (!address || !label) return;
  const registry = readRegistry();
  registry[address.toLowerCase()] = label;
  writeRegistry(registry);
}

export function getCircleLabel(address: string): string | undefined {
  if (!address) return undefined;
  const registry = readRegistry();
  return registry[address.toLowerCase()];
}

export function getAllCircleLabels(): Registry {
  return readRegistry();
}
