import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/run-cloudflared.mjs <cloudflared args...>');
  process.exit(1);
}

const systemRoot = process.env.SystemRoot || 'C:\\Windows';
const programFiles = process.env.ProgramFiles || 'C:\\Program Files';

const candidates = [
  { label: 'PATH', cmd: 'cloudflared' },
  { label: 'System32', cmd: join(systemRoot, 'System32', 'cloudflared.exe') },
  { label: 'ProgramFiles', cmd: join(programFiles, 'Cloudflare', 'cloudflared.exe') }
];

function trySpawn(index) {
  if (index >= candidates.length) {
    console.error(
      'cloudflared blev ikke fundet.\n' +
      '- Åbn en NY terminal (så PATH opdateres), eller\n' +
      '- reinstallér cloudflared, eller\n' +
      '- sørg for at cloudflared.exe findes i C:\\Windows\\System32'
    );
    process.exit(1);
  }

  const { label, cmd } = candidates[index];

  if (cmd.toLowerCase().endsWith('.exe') && !existsSync(cmd)) {
    return trySpawn(index + 1);
  }

  const child = spawn(cmd, args, { stdio: 'inherit' });

  child.on('error', (err) => {
    if (err && err.code === 'ENOENT') {
      return trySpawn(index + 1);
    }
    console.error(`[cloudflared:${label}] Fejl:`, err);
    process.exit(1);
  });

  child.on('exit', (code) => process.exit(code ?? 1));
}

trySpawn(0);
