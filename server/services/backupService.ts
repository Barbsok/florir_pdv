import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 7;

function buildTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
}

function pruneOldBackups(): void {
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => path.join(BACKUPS_DIR, f))
    .sort()
    .reverse();

  files.slice(MAX_BACKUPS).forEach(f => {
    fs.unlinkSync(f);
    console.log(`[backup] Removed old backup: ${path.basename(f)}`);
  });
}

async function runBackup(): Promise<string> {
  const file = path.join(BACKUPS_DIR, `backup_${buildTimestamp()}.sql`);
  const user = process.env.POSTGRES_USER;
  const db = process.env.POSTGRES_DB;

  try {
    await execAsync(
      `docker compose exec -T postgres pg_dump -U ${user} ${db} --clean --if-exists > "${file}"`,
    );
  } catch (err) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    throw err;
  }

  pruneOldBackups();
  return file;
}

export function initBackupSchedule(): void {
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  cron.schedule('0 2 * * *', async () => {
    try {
      const file = await runBackup();
      console.log(`[backup] Created: ${path.basename(file)}`);
    } catch (err: any) {
      console.error('[backup] Failed:', err.message);
    }
  });

  console.log('[backup] Scheduled — daily at 02:00');
}
