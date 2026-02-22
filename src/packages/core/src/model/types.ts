// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

/**
 * Core type definitions for SysML v2 Model
 */

export type UUID = string;

export enum SysMLMetatype {
    PACKAGE = 'Package',
    PART_DEFINITION = 'PartDefinition',
    PART_USAGE = 'PartUsage',
    ATTRIBUTE_DEFINITION = 'AttributeDefinition',
    ATTRIBUTE_USAGE = 'AttributeUsage',
    REQUIREMENT = 'Requirement',
    PORT_DEFINITION = 'PortDefinition',
    PORT_USAGE = 'PortUsage',
    COMMENT = 'Comment',
    DOCUMENTATION = 'Documentation'
}

export enum EdgeType {
    SPECIALIZATION = 'specialization',
    TYPING = 'typing',
    FEATURE_MEMBERSHIP = 'featureMembership',
    SATISFY = 'satisfy',
    REFINE = 'refine',
    DERIVE = 'derive',
    REDEFINITION = 'redefinition'
}

export interface ElementData {
    id: UUID;
    metatype: SysMLMetatype;
    name?: string;
    qualifiedName?: string;
    attributes: Map<string, any>;
}

export interface ContainmentData {
    parent?: UUID;
    children: UUID[];
    owningNamespace?: UUID;
}

export interface ReferenceData {
    [key: string]: UUID[];
}
