import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_SERVER_URL = 'https://otterseal.ycmj.bot';
const CONFIG_FILE = path.join(os.homedir(), '.oseal.json');

export async function loadConfig() {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function getServerUrl() {
  const config = await loadConfig();
  return config.server_url || DEFAULT_SERVER_URL;
}
