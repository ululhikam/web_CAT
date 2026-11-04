/**
 * Entry server MSW untuk Node (dipakai `scripts/mock-api.ts`).
 * Browser memakai `setupWorker` dari `msw/browser`.
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
