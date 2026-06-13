interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, handler: (data: unknown) => void) => void;
    removeListener: (event: string, handler: (data: unknown) => void) => void;
  };
}
