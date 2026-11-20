import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Setup global E2E para o modo de demonstração pública sem login.
 * Garante estado limpo do navegador (zero cookies e zero localStorage).
 */
export default async function globalSetup(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '..');
  const authDir = path.join(projectRoot, 'playwright', '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const emptyStorageState = {
    cookies: [],
    origins: [],
  };

  fs.writeFileSync(
    path.join(authDir, 'user.json'),
    JSON.stringify(emptyStorageState, null, 2),
    'utf-8'
  );
}
