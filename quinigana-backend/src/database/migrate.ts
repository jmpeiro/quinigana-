import fs from 'fs';
import path from 'path';
import pool from '../config/database';

interface MigrationFile {
  id: string;
  filename: string;
  absolutePath: string;
}

function getMigrationFiles(migrationsDir: string): MigrationFile[] {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  return files.map((filename) => ({
    id: filename.split('_')[0],
    filename,
    absolutePath: path.join(migrationsDir, filename),
  }));
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(32) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationIds(): Promise<Set<string>> {
  const [rows] = await pool.execute('SELECT id FROM schema_migrations');
  const set = new Set<string>();
  for (const row of rows as Array<{ id: string }>) {
    set.add(row.id);
  }
  return set;
}

async function run(): Promise<void> {
  const migrationsDir = path.join(process.cwd(), 'database', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  await ensureMigrationsTable();
  const appliedIds = await getAppliedMigrationIds();
  const migrationFiles = getMigrationFiles(migrationsDir);

  for (const migration of migrationFiles) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    const sql = fs.readFileSync(migration.absolutePath, 'utf8');
    if (!sql.trim()) {
      continue;
    }

    await pool.query(sql);
    await pool.execute(
      'INSERT INTO schema_migrations (id, filename) VALUES (?, ?)',
      [migration.id, migration.filename]
    );

    console.log(`Applied migration ${migration.filename}`);
  }

  console.log('Migrations up to date');
  await pool.end();
}

run().catch(async (error) => {
  console.error('Migration failed:', error);
  try {
    await pool.end();
  } catch {
    // ignore connection close errors
  }
  process.exit(1);
});
