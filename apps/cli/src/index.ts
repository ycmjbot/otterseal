#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { type ApplicationContext, buildApplication, buildRouteMap, run } from '@stricli/core';
import { noteRoutes } from './routes/note.js';
import { secretRoutes } from './routes/secret.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

const app = buildApplication(
  buildRouteMap({
    routes: {
      note: noteRoutes,
      secret: secretRoutes,
    },
    docs: { brief: '🦦 OtterSeal - Zero-knowledge encrypted secrets' },
  }),
  {
    name: 'oseal',
    versionInfo: {
      currentVersion: pkg.version,
    },
  },
);

const context: ApplicationContext = {
  process,
};

await run(app, process.argv.slice(2), context);
