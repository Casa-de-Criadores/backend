import { MigrationService } from './migrations.service.ts';
import { DbClient } from './client.ts';

const db = new DbClient();
const migrationService = new MigrationService(db);

await migrationService.runMigrations();
await db.end();