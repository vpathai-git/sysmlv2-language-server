import { ScopeProvider, type LangiumCoreServices } from 'langium';
import { createSysMLScopeProvider as createAdapter } from './adapters/scope-adapter.js';

export function createSysMLScopeProvider(services: LangiumCoreServices): ScopeProvider {
    return createAdapter(services);
}
