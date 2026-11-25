import { useSyncExternalStore } from 'react';

// Estado global del sonido de la página. Empieza silenciado (sonido desactivado)
// y lo controla el botón SoundToggle.
let soundOn = false;
const listeners = new Set<() => void>();

export function isSoundOn(): boolean {
  return soundOn;
}

export function setSoundOn(value: boolean): void {
  if (soundOn === value) return;
  soundOn = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Estado reactivo del sonido para componentes. */
export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, isSoundOn);
}

/**
 * Mantiene silenciadas (`muted`) todas las etiquetas <audio> de la página,
 * incluidas las que se añadan al DOM más adelante. Devuelve la función de limpieza.
 */
export function syncAudioElements(): () => void {
  const apply = (root: ParentNode) => {
    root.querySelectorAll('audio').forEach((a) => {
      a.muted = !soundOn;
    });
  };
  const applyToNode = (node: Node) => {
    if (node instanceof HTMLAudioElement) node.muted = !soundOn;
    else if (node instanceof Element) apply(node);
  };

  apply(document);
  const unsubscribe = subscribe(() => apply(document));
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => m.addedNodes.forEach(applyToNode));
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    unsubscribe();
    observer.disconnect();
  };
}
