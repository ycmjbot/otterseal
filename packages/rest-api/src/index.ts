/**
 * OtterSeal REST API - Framework-agnostic package
 * Provides REST and WebSocket handlers for managing encrypted notes
 */

export { type APIHandlerContext, createAPIHandlers } from './handlers.ts';
export * from './types.ts';
export { type WSClient, WSManager, type WSManagerOptions } from './ws-manager.ts';
