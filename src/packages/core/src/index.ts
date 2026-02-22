// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

/**
 * SysML v2 Core Engine
 * Export public API
 */

export { SysMLModel, SysMLElement } from './model/sysml-model.js';
export { ContainmentTree, ContainmentNode } from './model/containment-tree.js';
export { ReferenceGraph } from './model/reference-graph.js';
export type { GraphEdge, Path, Cycle } from './model/reference-graph.js';
export { SysMLMetatype, EdgeType } from './model/types.js';
export type { UUID, ElementData } from './model/types.js';

export { LangiumResourceAdapter } from './adapters/resource-adapter.js';
export { augmentAst } from './adapters/ast-augmenter.js';

// Note: Adapters will be exported after grammar expansion
// export * from './model/metatypes.js';
// export * from './model/element-interfaces.js';
// export { BaseElementAdapter } from './adapters/base-adapter.js';
// export { AdapterFactory } from './adapters/adapter-factory.js';
