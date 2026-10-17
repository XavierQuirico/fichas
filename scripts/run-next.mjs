import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.env.NEXT_TELEMETRY_DISABLED ??= '1';
const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const child = spawn(process.execPath, [nextCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (error) => {
  console.error('Could not start Next.js.', error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
