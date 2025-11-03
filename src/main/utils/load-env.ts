import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const getProjectRoot = () => {
  const currentDir = fileURLToPath(new URL('.', import.meta.url));
  return resolve(currentDir, '../..');
};

const ENV_PATHS = [
  'config/.env',
  'config/.env.production',
  'config/.env.development',
  'config/.env.local',
  '.env',
  '.env.development',
  '.env.local'
];

export const loadEnvironment = (searchRoots: string[] = []) => {
  const roots = [...new Set([getProjectRoot(), ...searchRoots])];
  const loaded: string[] = [];

  for (const root of roots) {
    for (const candidate of ENV_PATHS) {
      const filePath = join(root, candidate);
      if (existsSync(filePath)) {
        loadDotenv({ path: filePath, override: true });
        loaded.push(filePath);
      }
    }
  }

  return loaded;
};
