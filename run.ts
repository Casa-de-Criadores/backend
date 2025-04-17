import '@std/dotenv/load';
import { bootstrap } from './src/bootstrap.ts';

if (import.meta.main) {
    bootstrap().catch(err => {
        console.error(err);
        Deno.exit(1);
    });
}