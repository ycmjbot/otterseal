import fs from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fs module before importing config
vi.mock('node:fs/promises');

describe('config.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and parse config from file', async () => {
    const mockConfig = { server_url: 'https://custom.example.com', editor: 'vim' };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

    // Import after mocking
    const { loadConfig } = await import('./config.js');
    const config = await loadConfig();
    expect(config).toEqual(mockConfig);
  });

  it('should return empty object if file does not exist', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

    const { loadConfig } = await import('./config.js');
    const config = await loadConfig();
    expect(config).toEqual({});
  });

  it('should return empty object if JSON is malformed', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('{ invalid json');

    const { loadConfig } = await import('./config.js');
    const config = await loadConfig();
    expect(config).toEqual({});
  });

  it('should return custom server URL from config', async () => {
    const mockConfig = { server_url: 'https://custom.example.com' };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

    const { getServerUrl } = await import('./config.js');
    const url = await getServerUrl();
    expect(url).toBe('https://custom.example.com');
  });

  it('should return default server URL if config is empty', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

    const { getServerUrl } = await import('./config.js');
    const url = await getServerUrl();
    expect(url).toBe('https://otterseal.ycmj.bot');
  });

  it('should return default server URL if config has no server_url', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ editor: 'nano' }));

    const { getServerUrl } = await import('./config.js');
    const url = await getServerUrl();
    expect(url).toBe('https://otterseal.ycmj.bot');
  });
});
