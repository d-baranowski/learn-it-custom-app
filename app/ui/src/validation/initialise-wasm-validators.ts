import { RpgWindow } from '~/rpg';

let wasmInitPromise: Promise<void> | null = null;

function initialiseWasmValidators(): Promise<void> {
  // Return existing promise if already initializing/initialized
  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = doInit();
  return wasmInitPromise;
}

function waitForValidateMessage(w: RpgWindow, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // It may already be registered by the time we check
    if (typeof w.validateMessage === 'function') {
      resolve();
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (typeof w.validateMessage === 'function') {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('WASM validateMessage did not register within ' + timeoutMs + 'ms'));
      }
    }, 10);
  });
}

async function doInit(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  const w = window as unknown as RpgWindow;
  // @ts-ignore Go is defined by wasm_exec.js loaded in _document.tsx
  if (typeof Go !== 'function') {
    console.warn('Go is not a constructor — wasm_exec.js may not have loaded');
    return;
  }
  // @ts-ignore Go is defined by wasm_exec.js
  w.go = new Go();
  const nonce = Math.random().toString(36).substring(7);
  try {
    const result = await WebAssembly.instantiateStreaming(
      fetch(`/wasm/form-validator.wasm?${nonce}`),
      // @ts-ignore importObject comes from wasm_exec.js Go instance
      w.go.importObject
    );
    // go.run() returns a promise that never resolves because Go main()
    // blocks with `select {}` to keep validateMessage registered.
    // Fire it off without awaiting, then poll for the function to appear.
    // @ts-ignore run() starts the WASM instance
    w.go.run(result.instance);

    // Wait for Go's main() to register validateMessage on globalThis
    await waitForValidateMessage(w, 5000);
  } catch (err) {
    console.error('Failed to initialize WASM form-validator:', err);
    // Reset so a retry is possible on next call
    wasmInitPromise = null;
    throw err;
  }
}

/**
 * Returns a promise that resolves when the WASM validator is ready.
 * If already initialized, resolves immediately.
 */
export function waitForWasmReady(): Promise<void> {
  if (wasmInitPromise) {
    return wasmInitPromise;
  }
  return initialiseWasmValidators();
}

export default initialiseWasmValidators;
