// Hermes provides queueMicrotask. The React Native TypeScript lib does not declare it.
declare function queueMicrotask(callback: () => void): void;

declare function btoa(data: string): string;
declare function atob(data: string): string;

interface Performance {
  now(): number;
}
declare var performance: Performance | undefined;

declare const process: {
  execPath: string;
};

declare const global: typeof globalThis;

declare module 'fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function existsSync(path: string): boolean;
}

declare module 'path' {
  export function join(...paths: string[]): string;
}

declare module 'child_process' {
  export function execFileSync(
    file: string,
    args: readonly string[],
    options: { encoding: 'utf8' },
  ): string;
}

declare const __dirname: string;
