// Loads backend/.env (if present) no matter which folder the server is started from.
// On hosts like Render there is no .env file; settings come from the host's environment.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
