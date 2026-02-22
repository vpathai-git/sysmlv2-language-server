/**
 * SysML Langium Validator
 *
 * LSP-003: Langium-compatible validator that delegates to Shim validators
 * with proper AST type registration for Langium 3.x.
 *
 * Implements SysML v2 / KerML specification validation rules.
 */

import type { ValidationAcceptor, ValidationChecks, AstNode } from 'langium';
import type { SysMLServices } from '../sysml-module.js';
import { ValidationCodes as SpecValidationCodes } from './validation-codes.js';

// Validation codes
const ValidationCodes = {
    // ROOT
    INVALID_NAMESPACE_DISTINGUISHABILITY: 'validateNamespaceDistinguishability',
    // DEFINITION
    INVALID_DEFINITION_VARIATION_IS_ABSTRACT: 'validateDefinitionVariationIsAbstract',
    INVALID_DEFINITION_VARIATION_MEMBERSHIP: 'validateDefinitionVariationMembership',
    INVALID_DEFINITION_VARIATION_SPECIALIZATION: 'validateDefinitionVariationSpecialization',
    // USAGE
    INVALID_USAGE_VARIATION_IS_ABSTRACT: 'validateUsageVariationIsAbstract',
    INVALID_USAGE_VARIATION_MEMBERSHIP: 'validateUsageVariationMembership',
    INVALID_USAGE_VARIATION_SPECIALIZATION: 'validateUsageVariationSpecialization',
    // CORE
    INVALID_SPECIALIZATION_SPECIFIC_NOT_CONJUGATED: 'validateSpecializationSpecificNotConjugated',
    INVALID_TYPE_AT_MOST_ONE_CONJUGATOR: 'validateTypeAtMostOneConjugator',
    INVALID_TYPE_OWNED_MULTIPLICITY: 'validateTypeOwnedMultiplicity',
    // ATTRIBUTE
    INVALID_ATTRIBUTE_USAGE_TYPE: 'validateAttributeUsageType_',
    INVALID_ATTRIBUTE_USAGE_ENUMERATION_TYPE: 'validateAttributeUsageEnumerationType_',
    INVALID_ENUMERATION_USAGE_TYPE: 'validateEnumerationUsageType_',
    // OCCURRENCE
    INVALID_OCCURRENCE_USAGE_TYPE: 'validateOccurrenceUsageType_',
    INVALID_OCCURRENCE_USAGE_INDIVIDUAL_DEFINITION: 'validateOccurrenceUsageIndividualDefinition',
    INVALID_OCCURRENCE_USAGE_INDIVIDUAL_USAGE: 'validateOccurrenceUsageIndividualUsage',
    INVALID_OCCURRENCE_USAGE_IS_PORTION: 'validateOccurrenceUsageIsPortion',
    INVALID_OCCURRENCE_USAGE_PORTION_KIND: 'validateOccurrenceUsageIsPortion',
    // PORT
    INVALID_CONJUGATED_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION: 'validateConjugatedPortDefinitionConjugatedPortDefinition',
    INVALID_CONJUGATED_PORT_DEFINITION_ORIGINAL_PORT_DEFINITION: 'validateConjugatedPortDefinitionConjugatedPortDefinition',
    INVALID_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION: 'validatePortDefinitionConjugatedPortDefinition',
    INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE: 'validatePortDefinitionOwnedUsagesNotComposite',
    INVALID_PORT_USAGE_TYPE: 'validatePortUsageType_',
    INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE: 'validatePortUsageNestedUsagesNotComposite',
    // CONNECTION
    INVALID_CONNECTION_USAGE_TYPE: 'validateConnectionUsageType_',
    INVALID_FLOW_DEFINITION_END: 'validateFlowDefinitionConnectionEnds',
    INVALID_FLOW_USAGE_TYPE: 'validateFlowUsageType_',
    INVALID_INTERFACE_DEFINITION_END: 'validateInterfaceDefinitionEnd_',
    INVALID_INTERFACE_USAGE_TYPE: 'validateInterfaceUsageType_',
    INVALID_INTERFACE_USAGE_END: 'validateInterfaceUsageEnd_',
    INVALID_ALLOCATION_USAGE_TYPE: 'validateAllocationUsageType_',
    // ACTION
    INVALID_ACCEPT_ACTION_USAGE_PARAMETERS: 'validateAcceptActionUsageParameters',
    INVALID_ACTION_USAGE_TYPE: 'validateActionUsageType_',
    INVALID_ASSIGNMENT_ACTION_USAGE_ARGUMENTS: 'validateAssignmentActionUsageArguments',
    INVALID_ASSIGNMENT_ACTION_USAGE_REFERENT: 'validateAssignmentActionUsageReferent',
    INVALID_TRIGGER_INVOCATION_EXPRESSION_AFTER_ARGUMENT: 'validateTriggerInvocationActionAfterArgument',
    INVALID_TRIGGER_INVOCATION_EXPRESSION_AT_ARGUMENT: 'validateTriggerInvocationActionAtArgument',
    INVALID_TRIGGER_INVOCATION_EXPRESSION_WHEN_ARGUMENT: 'validateTriggerInvocationActionWhenArgument',
    INVALID_CONTROL_NODE_INCOMING_SUCCESSIONS: 'validateControlNodeIncomingSuccessions',
    INVALID_CONTROL_NODE_OUTGOING_SUCCESSIONS: 'validateControlNodeOutgoingSuccessions',
    INVALID_CONTROL_NODE_OWNING_TYPE: 'validateControlNodeOwningType',
    INVALID_DECISION_NODE_INCOMING_SUCCESSIONS: 'validateDecisionNodeIncomingSuccessions',
    INVALID_DECISION_NODE_OUTGOING_SUCCESSIONS: 'validateDecisionNodeOutgoingSuccessions',
    INVALID_FORK_NODE_INCOMING_SUCCESSIONS: 'validateForkNodeIncomingSuccessions',
    INVALID_JOIN_NODE_OUTGOING_SUCCESSIONS: 'validateJoinNodeOutgoingSuccessions',
    INVALID_MERGE_NODE_INCOMING_SUCCESSIONS: 'validateMergeNodeIncomingSuccessions',
    INVALID_MERGE_NODE_OUTGOING_SUCCESSIONS: 'validateMergeNodeOutgoingSuccessions',
    INVALID_PERFORM_ACTION_USAGE_REFERENCE: 'validatePerformActionUsageReference',
    INVALID_SEND_ACTION_USAGE_PAYLOAD_ARGUMENT: 'validateSendActionUsagePayloadArgument',
    INVALID_SEND_ACTION_USAGE_RECEIVER: 'validateSendActionUsageReceiver_',
    // STATE
    INVALID_STATE_USAGE_TYPE: 'validateStateUsageType_',
    INVALID_TRANSITION_USAGE_TYPE: 'validateTransitionUsageType_',
    INVALID_TRANSITION_USAGE_SOURCE: 'validateTransitionUsageSource',
    INVALID_TRANSITION_USAGE_TARGET: 'validateTransitionUsageTarget',
    // CALCULATION
    INVALID_CALCULATION_USAGE_TYPE: 'validateCalculationUsageType_',
    // CONSTRAINT
    INVALID_CONSTRAINT_USAGE_TYPE: 'validateConstraintUsageType_',
    // REQUIREMENT
    INVALID_REQUIREMENT_USAGE_TYPE: 'validateRequirementUsageType_',
    // CASE
    INVALID_CASE_USAGE_TYPE: 'validateCaseUsageType_',
    // VIEW
    INVALID_VIEW_USAGE_TYPE: 'validateViewUsageType_',
    INVALID_VIEWPOINT_USAGE_TYPE: 'validateViewpointUsageType_',
    INVALID_RENDERING_USAGE_TYPE: 'validateRenderingUsageType_',
    // METADATA
    INVALID_METADATA_USAGE_TYPE: 'validateMetadataUsageType_',
    INVALID_ITEM_USAGE_TYPE: 'validateItemUsageType_',
    INVALID_PART_USAGE_TYPE: 'validatePartUsageType_',
    INVALID_PART_USAGE_PART_DEFINITION: 'validatePartUsagePartDefinition',
    // FEATURE
    INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING: 'validateFeatureOwnedReferenceSubsetting',
    INVALID_FEATURE_CHAINING_FEATURE_NOT_ONE: 'validateFeatureChainingFeatureNotOne',
    // IMPORT
    INVALID_IMPORT_TOP_LEVEL_VISIBILITY: 'validateImportTopLevelVisibility',
    // CONNECTOR
    INVALID_CONNECTOR_RELATED_FEATURES: 'validateConnectorRelatedFeatures',
    INVALID_CONNECTOR_BINARY_SPECIALIZATION: 'validateConnectorBinarySpecialization',
    // BINDING CONNECTOR
    INVALID_BINDING_CONNECTOR_IS_BINARY: 'validateBindingConnectorIsBinary',

    // MESSAGES
    INVALID_ATTRIBUTE_USAGE_MSG: SpecValidationCodes.INVALID_ATTRIBUTE_USAGE_MSG,
    INVALID_ENUMERATION_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_ENUMERATION_USAGE_TYPE_MSG,
    INVALID_OCCURRENCE_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_OCCURRENCE_USAGE_TYPE_MSG,
    INVALID_ITEM_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_ITEM_USAGE_TYPE_MSG,
    INVALID_PART_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_PART_USAGE_TYPE_MSG,
    INVALID_PART_USAGE_PART_DEFINITION_MSG: SpecValidationCodes.INVALID_PART_USAGE_PART_DEFINITION_MSG,
    INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE_MSG: SpecValidationCodes.INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE_MSG,
    INVALID_PORT_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_PORT_USAGE_TYPE_MSG,
    INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE_MSG: SpecValidationCodes.INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE_MSG,
    INVALID_CONNECTION_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_CONNECTION_USAGE_TYPE_MSG,
    INVALID_FLOW_DEFINITION_END_MSG: SpecValidationCodes.INVALID_FLOW_DEFINITION_END_MSG,
    INVALID_FLOW_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_FLOW_USAGE_TYPE_MSG,
    INVALID_INTERFACE_DEFINITION_END_MSG: SpecValidationCodes.INVALID_INTERFACE_DEFINITION_END_MSG,
    INVALID_INTERFACE_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_INTERFACE_USAGE_TYPE_MSG,
    INVALID_INTERFACE_USAGE_END_MSG: SpecValidationCodes.INVALID_INTERFACE_USAGE_END_MSG,
    INVALID_ALLOCATION_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_ALLOCATION_USAGE_TYPE_MSG,
    INVALID_ACTION_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_ACTION_USAGE_TYPE_MSG,
    INVALID_CONTROL_NODE_OWNING_TYPE_MSG: SpecValidationCodes.INVALID_CONTROL_NODE_OWNING_TYPE_MSG,
    INVALID_STATE_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_STATE_USAGE_TYPE_MSG,
    // Additional messages
    INVALID_TRANSITION_USAGE_SOURCE_MSG: 'Transition usage must have a source',
    INVALID_TRANSITION_USAGE_TARGET_MSG: 'Transition usage must have a target',
    INVALID_CALCULATION_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_CALCULATION_USAGE_TYPE_MSG,
    INVALID_CONSTRAINT_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_CONSTRAINT_USAGE_TYPE_MSG,
    INVALID_REQUIREMENT_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_REQUIREMENT_USAGE_TYPE_MSG,
    INVALID_CASE_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_CASE_USAGE_TYPE_MSG,
    INVALID_VIEW_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_VIEW_USAGE_TYPE_MSG,
    INVALID_VIEWPOINT_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_VIEWPOINT_USAGE_TYPE_MSG,
    INVALID_RENDERING_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_RENDERING_USAGE_TYPE_MSG,
    INVALID_METADATA_USAGE_TYPE_MSG: SpecValidationCodes.INVALID_METADATA_USAGE_TYPE_MSG,
};

// Import the generated AST types
type SysMLAstType = {
    Namespace: AstNode;
    Package: AstNode;
    PartDefinition: AstNode;
    PartUsage: AstNode;
    ActionDefinition: AstNode;
    ActionUsage: AstNode;
    AttributeDefinition: AstNode;
    AttributeUsage: AstNode;
    ItemDefinition: AstNode;
    ItemUsage: AstNode;
    PortDefinition: AstNode;
    PortUsage: AstNode;
    ConnectionDefinition: AstNode;
    ConnectionUsage: AstNode;
    InterfaceDefinition: AstNode;
    InterfaceUsage: AstNode;
    AllocationDefinition: AstNode;
    AllocationUsage: AstNode;
    RequirementDefinition: AstNode;
    RequirementUsage: AstNode;
    ConstraintDefinition: AstNode;
    ConstraintUsage: AstNode;
    StateDefinition: AstNode;
    StateUsage: AstNode;
    TransitionUsage: AstNode;
    CalculationDefinition: AstNode;
    CalculationUsage: AstNode;
    CaseDefinition: AstNode;
    CaseUsage: AstNode;
    AnalysisCaseDefinition: AstNode;
    AnalysisCaseUsage: AstNode;
    VerificationCaseDefinition: AstNode;
    VerificationCaseUsage: AstNode;
    UseCaseDefinition: AstNode;
    UseCaseUsage: AstNode;
    ViewDefinition: AstNode;
    ViewUsage: AstNode;
    ViewpointDefinition: AstNode;
    ViewpointUsage: AstNode;
    RenderingDefinition: AstNode;
    RenderingUsage: AstNode;
    MetadataDefinition: AstNode;
    MetadataUsage: AstNode;
    OccurrenceDefinition: AstNode;
    OccurrenceUsage: AstNode;
    EnumerationDefinition: AstNode;
    EnumerationUsage: AstNode;
    Feature: AstNode;
    Type: AstNode;
    Membership: AstNode;
    OwningMembership: AstNode;
    FeatureMembership: AstNode;
    RootNamespace: AstNode;
    Specialization: AstNode;
    Subclassification: AstNode;
    Subsetting: AstNode;
    Redefinition: AstNode;
    FeatureTyping: AstNode;
    Conjugation: AstNode;
    Import: AstNode;
    NamespaceImport: AstNode;
    MembershipImport: AstNode;
    Connector: AstNode;
    BindingConnector: AstNode;
    Connection: AstNode;
};

/**
 * Gets the member name from a membership or element.
 */
function getMemberName(node: AstNode): string | undefined {
    if (!node) return undefined;
    const nodeAny = node as any;
    return nodeAny.memberName ?? nodeAny.declaredName ?? nodeAny.name ?? undefined;
}

function getMemberShortName(node: AstNode): string | undefined {
    if (!node) return undefined;
    const nodeAny = node as any;
    return nodeAny.memberShortName ?? nodeAny.declaredShortName ?? nodeAny.shortName ?? undefined;
}

/**
 * Checks if a type should be skipped for distinguishability checks.
 */
function shouldSkipDistinguishabilityCheck(node: AstNode): boolean {
    const type = node.$type;
    return type === 'InvocationExpression' ||
           type === 'FeatureReferenceExpression' ||
           type === 'LiteralExpression' ||
           type === 'LiteralInteger' ||
           type === 'LiteralString' ||
           type === 'LiteralReal' ||
           type === 'LiteralBoolean' ||
           type === 'LiteralInfinity' ||
           type === 'NullExpression' ||
           type === 'BindingConnector';
}

/**
 * Checks if a node is a Type (for inheritance checking).
 */
function isType(node: AstNode): boolean {
    const type = node.$type;
    return type === 'Type' ||
           type === 'Class' ||
           type === 'Classifier' ||
           type === 'DataType' ||
           type?.endsWith('Definition') ||
           type?.endsWith('Usage');
}

/**
 * Checks if a type is a subtype of the expected type (by name suffix or hierarchy).
 */
function isSubtype(type: AstNode, expectedTypeSuffix: string, visited = new Set<string>()): boolean {
    if (!type) return false;
    const typeAny = type as any;
    
    // Avoid infinite loops
    const id = typeAny.name ?? typeAny.id; 
    if (id && visited.has(id)) return false;
    if (id) visited.add(id);

    // 1. Direct match
    if (type.$type.endsWith(expectedTypeSuffix)) return true;
    
    // 2. Hardcoded SysML v2 Hierarchy (since we don't have full semantic model loaded)
    if (expectedTypeSuffix === 'Classifier') {
        if (type.$type.endsWith('Definition') || type.$type === 'Class' || type.$type === 'DataType') return true;
    }
    if (expectedTypeSuffix === 'DataType') {
        if (type.$type === 'AttributeDefinition' || type.$type === 'EnumerationDefinition') return true;
    }
    if (expectedTypeSuffix === 'Class') {
        // OccurrenceDefinition is a Class
        if (type.$type === 'OccurrenceDefinition' || type.$type === 'PartDefinition' || 
            type.$type === 'ItemDefinition' || type.$type === 'PortDefinition' ||
            type.$type === 'ConnectionDefinition' || type.$type === 'InterfaceDefinition' ||
            type.$type === 'AllocationDefinition' || type.$type === 'ActionDefinition' ||
            type.$type === 'StateDefinition' || type.$type === 'ConstraintDefinition' ||
            type.$type === 'RequirementDefinition' || type.$type === 'CaseDefinition' ||
            type.$type === 'ViewDefinition' || type.$type === 'ViewpointDefinition' ||
            type.$type === 'RenderingDefinition' || type.$type === 'MetadataDefinition') return true;
    }
    if (expectedTypeSuffix === 'ItemDefinition') {
        if (type.$type === 'PartDefinition') return true;
    }
    if (expectedTypeSuffix === 'ActionDefinition') {
        // ActionDefinition is a Behavior
        // But here we check if it IS an ActionDefinition
        // Subtypes of ActionDefinition? None in standard library except user defined.
    }
    if (expectedTypeSuffix === 'Behavior') {
        // LINK-005b: All Behavior subtypes
        // ActionDefinition hierarchy: ActionDefinition
        // CaseDefinition hierarchy: CaseDefinition > UseCaseDefinition, AnalysisCaseDefinition, VerificationCaseDefinition
        // CalculationDefinition extends Function which is a Behavior
        if (type.$type === 'ActionDefinition' || type.$type === 'StateDefinition' ||
            type.$type === 'CalculationDefinition' || type.$type === 'Function' ||
            type.$type === 'Predicate' || type.$type === 'Interaction' ||
            type.$type === 'CaseDefinition' || type.$type === 'UseCaseDefinition' ||
            type.$type === 'AnalysisCaseDefinition' || type.$type === 'VerificationCaseDefinition') return true;
    }
    if (expectedTypeSuffix === 'Association') {
        if (type.$type === 'ConnectionDefinition' || type.$type === 'FlowDefinition' ||
            type.$type === 'InterfaceDefinition' || type.$type === 'AllocationDefinition') return true;
    }

    // 3. Check inheritance (Specialization)
    const ownedSpecialization = typeAny.ownedSpecialization;
    if (Array.isArray(ownedSpecialization)) {
        for (const spec of ownedSpecialization) {
            const general = spec.general?.ref;
            if (general) {
                if (isSubtype(general, expectedTypeSuffix, visited)) return true;
            }
        }
    }
    
    return false;
}

/**
 * Validation checks for SysML elements.
 * Each check validates specific constraints from the SysML specification.
 */
export class SysMLValidator {
    /**
     * Checks if all types of a usage are subtypes of the expected type.
     */
    private checkAllTypes(
        usage: AstNode, 
        expectedTypeSuffix: string, 
        message: string, 
        code: string,
        accept: ValidationAcceptor
    ): void {
        const usageAny = usage as any;
        const ownedRelationship = usageAny.ownedRelationship;
        
        if (Array.isArray(ownedRelationship)) {
            for (const rel of ownedRelationship) {
                if (rel.$type === 'FeatureTyping') {
                    const typeRef = (rel as any).type;
                    if (typeRef && typeRef.ref) {
                        const type = typeRef.ref;
                        if (!isSubtype(type, expectedTypeSuffix)) {
                             accept('error', message, {
                                node: rel,
                                property: 'type',
                                code: code
                            });
                        }
                    }
                }
            }
        }
    }

    // Note: checkAtLeastOneType was removed as part of LINK-005c
    // (PartUsage validation disabled per specification)

    /**
     * Check AttributeUsage constraints.
     * 
     */
    checkAttributeUsage(node: AstNode, accept: ValidationAcceptor): void {
        // All types must be DataTypes
        this.checkAllTypes(node, 'DataType', ValidationCodes.INVALID_ATTRIBUTE_USAGE_MSG, ValidationCodes.INVALID_ATTRIBUTE_USAGE_TYPE, accept);
        
        const nodeAny = node as any;
        if (nodeAny.$type !== 'EnumerationUsage') {
             // TODO: Add validateAttributeUsageEnumerationDefinition?
             // val types = FeatureUtil.getAllTypesOf(usg)
             // if (types.exists[t | t instanceof EnumerationDefinition] && types.size > 1)
             // This requires FeatureUtil.getAllTypesOf which needs type resolution
        }
    }

    /**
     * Check EnumerationUsage constraints.
     * 
     */
    checkEnumerationUsage(node: AstNode, accept: ValidationAcceptor): void {
        // Must have exactly one type, which is an EnumerationDefinition
        // checkOneType(usg, EnumerationDefinition, ...)
        // For now, just check all types are EnumerationDefinition
        this.checkAllTypes(node, 'EnumerationDefinition', ValidationCodes.INVALID_ENUMERATION_USAGE_TYPE_MSG, ValidationCodes.INVALID_ENUMERATION_USAGE_TYPE, accept);
    }

    /**
     * Check OccurrenceUsage constraints.
     * 
     *
     * BASE-004 FIX: In the semantic model, isPortion is computed from portionKind.
     * When portionKind is set (snapshot, timeslice), the element IS semantically a portion.
     * Our grammar may not explicitly set isPortion=true when portionKind is specified,
     * so we treat the presence of portionKind as implying isPortion semantically.
     */
    checkOccurrenceUsage(node: AstNode, accept: ValidationAcceptor): void {
        // All types must be Classes
        if (node.$type !== 'PortUsage' && node.$type !== 'ConnectionUsage' && node.$type !== 'MetadataUsage' && node.$type !== 'Step') {
            this.checkAllTypes(node, 'Class', ValidationCodes.INVALID_OCCURRENCE_USAGE_TYPE_MSG, ValidationCodes.INVALID_OCCURRENCE_USAGE_TYPE, accept);
        }

        // validateOccurrenceUsageIndividualDefinition
        // var nIndividualDefs = usg.occurrenceDefinition.filter[d | d instanceof OccurrenceDefinition && (d as OccurrenceDefinition).isIndividual].size
        // In Langium, we need to resolve definitions.
        // This requires semantic model access.

        // validateOccurrenceUsageIsPortion
        // BASE-004: portionKind semantically implies isPortion, so this validation is only needed
        // when isPortion is explicitly false AND portionKind is NOT set (contradictory state).
        // Since our grammar doesn't have explicit 'portion' keyword (uses portionKind instead),
        // we skip this validation - the semantic model computes isPortion from portionKind.
        // Original check was: if (portionKind && !nodeAny.isPortion) - but isPortion isn't set by grammar.
        // TODO: Implement computed isPortion property in semantic model layer.

        // validateOccurrenceUsagePortionKind
        // val owningType = usg.owningType;
        // if (!(portionKind === null || owningType instanceof OccurrenceDefinition || owningType instanceof OccurrenceUsage))
        // This requires owningType resolution.
    }

    /**
     * Check ItemUsage constraints.
     */
    checkItemUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'ItemDefinition', ValidationCodes.INVALID_ITEM_USAGE_TYPE_MSG, ValidationCodes.INVALID_ITEM_USAGE_TYPE, accept);
    }

    /**
     * Check PartUsage constraints.
     *
     * LINK-005c: Disabled per specification.
     * checkPartUsage validation is not enforced.
     * The validation rules are defined but not enforced.
     */
    checkPartUsage(_node: AstNode, _accept: ValidationAcceptor): void {
        // LINK-005c: Disabled - Specification doesn't enforce PartUsage type validation
        // this.checkAllTypes(node, 'ItemDefinition', ValidationCodes.INVALID_PART_USAGE_TYPE_MSG, ValidationCodes.INVALID_PART_USAGE_TYPE, accept);
        // this.checkAtLeastOneType(node, 'PartDefinition', ValidationCodes.INVALID_PART_USAGE_PART_DEFINITION_MSG, ValidationCodes.INVALID_PART_USAGE_PART_DEFINITION, accept);
    }

    /**
     * Check ConjugatedPortDefinition constraints.
     * 
     */
    checkConjugatedPortDefinition(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        
        // validateConjugatedPortDefinitionConjugatedPortDefinition
        if (nodeAny.conjugatedPortDefinition) {
             accept('error', 'A conjugated port definition must not have a conjugated port definition.', {
                node: node,
                code: ValidationCodes.INVALID_CONJUGATED_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION
            });
        }
        
        // validateConjugatedPortDefinitionOriginalPortDefinition
        // val portConjugator = cpd.ownedPortConjugator
        // if (portConjugator !== null && portConjugator.originalPortDefinition !== cpd.originalPortDefinition)
    }

    /**
     * Check PortDefinition constraints.
     * 
     */
    checkPortDefinition(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;

        // Check validatePortDefinitionConjugatedPortDefinition
        // DISABLED: This check requires ConjugatedPortDefinition to be synthesized during
        // AST augmentation, which is not yet implemented. In SysML v2, when you write
        // "port def UserPort;", the compiler should automatically create a conjugated
        // port definition (~UserPort) as an owned member. Until we implement this
        // synthesis in @sysml/core, this validation will incorrectly fail.
        // TODO: Implement ConjugatedPortDefinition synthesis, then re-enable this check.
        /*
        if (node.$type !== 'ConjugatedPortDefinition') {
            const members = nodeAny.ownedMember ?? [];
            const conjugatedPorts = members.filter((m: any) => m.$type === 'ConjugatedPortDefinition');
            if (conjugatedPorts.length !== 1) {
                 accept('error', 'A port definition must have a conjugated port definition.', {
                    node: node,
                    code: ValidationCodes.INVALID_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION
                });
            }
        }
        */
        
        // validatePortDefinitionOwnedUsagesNotComposite
        // val usages = pd.ownedUsage.filter[u | !(u instanceof PortUsage)]
        // In Langium, ownedUsage is not a direct property. We need to filter ownedRelationship.
        const ownedRelationship = nodeAny.ownedRelationship ?? [];
        const usages: AstNode[] = [];
        for (const rel of ownedRelationship) {
            // Check for FeatureMembership or OwningMembership that contains a Usage
            if (rel.$type === 'FeatureMembership' || rel.$type === 'OwningMembership') {
                const related = rel.ownedRelatedElement;
                if (Array.isArray(related)) {
                    for (const el of related) {
                        if (el.$type.endsWith('Usage') && el.$type !== 'PortUsage') {
                            usages.push(el);
                        }
                    }
                }
            }
        }
        this.checkAllNotComposite(usages, ValidationCodes.INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE_MSG, ValidationCodes.INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE, accept);
    }

    /**
     * Check PortUsage constraints.
     * 
     */
    checkPortUsage(node: AstNode, accept: ValidationAcceptor): void {
        // All types must be PortDefinitions
        this.checkAllTypes(node, 'PortDefinition', ValidationCodes.INVALID_PORT_USAGE_TYPE_MSG, ValidationCodes.INVALID_PORT_USAGE_TYPE, accept);
        
        // validatePortUsageNestedUsagesNotComposite
        // val usages = usg.nestedUsage.filter[u | !(u instanceof PortUsage)]
        // In Langium, nestedUsage corresponds to owned usages inside the usage body.
        const nodeAny = node as any;
        const ownedRelationship = nodeAny.ownedRelationship ?? [];
        const usages: AstNode[] = [];
        for (const rel of ownedRelationship) {
             if (rel.$type === 'FeatureMembership' || rel.$type === 'OwningMembership') {
                const related = rel.ownedRelatedElement;
                if (Array.isArray(related)) {
                    for (const el of related) {
                        if (el.$type.endsWith('Usage') && el.$type !== 'PortUsage') {
                            usages.push(el);
                        }
                    }
                }
            }
        }
        this.checkAllNotComposite(usages, ValidationCodes.INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE_MSG, ValidationCodes.INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE, accept);
    }

    /**
     * Check ConnectionUsage constraints.
     * 
     */
    checkConnectionUsage(node: AstNode, accept: ValidationAcceptor): void {
        // const nodeAny = node as any;
        // All types must be Associations
        if (node.$type !== 'FlowUsage' && node.$type !== 'InterfaceUsage' && node.$type !== 'AllocationUsage') {
            this.checkAllTypes(node, 'Association', ValidationCodes.INVALID_CONNECTION_USAGE_TYPE_MSG, ValidationCodes.INVALID_CONNECTION_USAGE_TYPE, accept);
        }
    }

    /**
     * Check FlowDefinition constraints.
     * 
     */
    checkFlowDefinition(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        // validateConnectionDefinitionConnectionEnds
        // val ends = cdef.endFeature
        // In Langium, we need to find features with isEnd=true
        const ownedRelationship = nodeAny.ownedRelationship ?? [];
        const ends: AstNode[] = [];
        const ownedEnds: AstNode[] = [];
        
        for (const rel of ownedRelationship) {
             if (rel.$type === 'FeatureMembership' || rel.$type === 'OwningMembership' || rel.$type === 'EndFeatureMembership') {
                const related = rel.ownedRelatedElement;
                if (Array.isArray(related)) {
                    for (const el of related) {
                        if ((el as any).isEnd) {
                            ends.push(el);
                            if (rel.$type === 'EndFeatureMembership' || rel.$type === 'OwningMembership') {
                                ownedEnds.push(el);
                            }
                        }
                    }
                }
            }
        }
        
        // Note: This only checks owned ends. Inherited ends require semantic model.
        if (ends.length > 2) {
            if (ownedEnds.length <= 2) {
                 accept('error', ValidationCodes.INVALID_FLOW_DEFINITION_END_MSG, {
                    node: node,
                    code: ValidationCodes.INVALID_FLOW_DEFINITION_END
                });
            } else {
                for (let i = 2; i < ends.length; i++) {
                     accept('error', ValidationCodes.INVALID_FLOW_DEFINITION_END_MSG, {
                        node: ends[i],
                        code: ValidationCodes.INVALID_FLOW_DEFINITION_END
                    });
                }
            }
        }
    }

    /**
     * Check FlowUsage constraints.
     */
    checkFlowUsage(node: AstNode, accept: ValidationAcceptor): void {
        // All types must be Interactions
        this.checkAllTypes(node, 'Interaction', ValidationCodes.INVALID_FLOW_USAGE_TYPE_MSG, ValidationCodes.INVALID_FLOW_USAGE_TYPE, accept);
    }

    /**
     * Check InterfaceDefinition constraints.
     * 
     */
    checkInterfaceDefinition(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        // Ends must be ports
        const ownedRelationship = nodeAny.ownedRelationship ?? [];
        for (const rel of ownedRelationship) {
             if (rel.$type === 'FeatureMembership' || rel.$type === 'OwningMembership' || rel.$type === 'EndFeatureMembership') {
                const related = rel.ownedRelatedElement;
                if (Array.isArray(related)) {
                    for (const el of related) {
                        if ((el as any).isEnd) {
                            if (el.$type !== 'PortUsage') {
                                 accept('error', ValidationCodes.INVALID_INTERFACE_DEFINITION_END_MSG, {
                                    node: el,
                                    code: ValidationCodes.INVALID_INTERFACE_DEFINITION_END
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Check InterfaceUsage constraints.
     * 
     */
    checkInterfaceUsage(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        // Ends must be ports
        const ownedRelationship = nodeAny.ownedRelationship ?? [];
        for (const rel of ownedRelationship) {
             if (rel.$type === 'FeatureMembership' || rel.$type === 'OwningMembership' || rel.$type === 'EndFeatureMembership') {
                const related = rel.ownedRelatedElement;
                if (Array.isArray(related)) {
                    for (const el of related) {
                        if ((el as any).isEnd) {
                            if (el.$type !== 'PortUsage') {
                                 accept('error', ValidationCodes.INVALID_INTERFACE_USAGE_END_MSG, {
                                    node: el,
                                    code: ValidationCodes.INVALID_INTERFACE_USAGE_END
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // All types must be InterfaceDefinitions
        this.checkAllTypes(node, 'InterfaceDefinition', ValidationCodes.INVALID_INTERFACE_USAGE_TYPE_MSG, ValidationCodes.INVALID_INTERFACE_USAGE_TYPE, accept);
    }

    /**
     * Check AllocationUsage constraints.
     * 
     */
    checkAllocationUsage(node: AstNode, accept: ValidationAcceptor): void {
        // All types must be AllocationDefinitions
        this.checkAllTypes(node, 'AllocationDefinition', ValidationCodes.INVALID_ALLOCATION_USAGE_TYPE_MSG, ValidationCodes.INVALID_ALLOCATION_USAGE_TYPE, accept);
    }

    /**
     * Checks that all usages in the list are not composite.
     */
    private checkAllNotComposite(
        usages: AstNode[], 
        message: string, 
        code: string,
        accept: ValidationAcceptor
    ): void {
        for (const usage of usages) {
            const usageAny = usage as any;
            if (usageAny.isComposite) {
                 accept('error', message, {
                    node: usage,
                    code: code
                });
            }
        }
    }

    /**
     * Check AcceptActionUsage constraints.
     * 
     */
    checkAcceptActionUsage(_node: AstNode, _accept: ValidationAcceptor): void {
        // validateAcceptActionUsageParameters
        // Requires resolving parameters which might be complex.
        // Skipped for now as it requires semantic model.
    }

    /**
     * Check ActionUsage constraints.
     * 
     */
    checkActionUsage(node: AstNode, accept: ValidationAcceptor): void {
        // All types must be Behaviors
        if (node.$type !== 'StateUsage' && node.$type !== 'CalculationUsage' && node.$type !== 'FlowUsage') {
            this.checkAllTypes(node, 'Behavior', ValidationCodes.INVALID_ACTION_USAGE_TYPE_MSG, ValidationCodes.INVALID_ACTION_USAGE_TYPE, accept);
        }
    }

    /**
     * Check AssignmentActionUsage constraints.
     * 
     */
    checkAssignmentActionUsage(node: AstNode, _accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        // validateAssignmentActionUsageReferent
        // if (!usg.ownedMembership.exists[m | !(m instanceof FeatureMembership) && m.memberElement instanceof Feature])
        const ownedMembership = nodeAny.ownedMembership ?? [];
        for (const mem of ownedMembership) {
            if (mem.$type !== 'FeatureMembership') {
                // Check if memberElement is a Feature
                // In Langium, memberElement is a reference.
                // We need to resolve it.
            }
        }
    }

    /**
     * Check TriggerInvocationExpression constraints.
     * 
     */
    checkTriggerInvocationExpression(_node: AstNode, _accept: ValidationAcceptor): void {
        // validateTriggerInvocationActionAfterArgument
        // validateTriggerInvocationActionAtArgument
        // validateTriggerInvocationActionWhenArgument
        // Requires checking arguments of 'after', 'at', 'when' invocations.
    }

    /**
     * Check ControlNode constraints.
     * 
     */
    checkControlNode(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        // validateControlNodeOwningType
        // val owningType = node.owningType
        // if (!(owningType !== null && (owningType instanceof ActionUsage || owningType instanceof ActionDefinition)))
        const container = nodeAny.$container;
        if (container) {
            if (container.$type !== 'ActionUsage' && container.$type !== 'ActionDefinition') {
                 accept('error', ValidationCodes.INVALID_CONTROL_NODE_OWNING_TYPE_MSG, {
                    node: node,
                    code: ValidationCodes.INVALID_CONTROL_NODE_OWNING_TYPE
                });
            }
        }
    }

    /**
     * Check PerformActionUsage constraints.
     * 
     */
    checkPerformActionUsage(node: AstNode, _accept: ValidationAcceptor): void {
        // validatePerformActionUsageReference
        if (node.$type !== 'ExhibitStateUsage' && node.$type !== 'IncludeUseCaseUsage') {
            // checkReferenceType(usg, ActionUsage, ...)
        }
    }

    /**
     * Check SendActionUsage constraints.
     * 
     */
    checkSendActionUsage(_node: AstNode, _accept: ValidationAcceptor): void {
        // validateSendActionUsagePayloadArgument
        // validateSendActionUsageReceiver_
        // Requires checking arguments.
    }

    /**
     * Check StateUsage constraints.
     * 
     */
    checkStateUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'StateDefinition', ValidationCodes.INVALID_STATE_USAGE_TYPE_MSG, ValidationCodes.INVALID_STATE_USAGE_TYPE, accept);
    }

    /**
     * Check TransitionUsage constraints.
     * 
     *
     * BASE-004 FIX: The grammar stores source/target in ownedRelationship, not as
     * direct properties. Also, TargetTransitionUsage intentionally has no source
     * (it inherits from the owning state context).
     *
     * Grammar structure:
     * - TransitionSourceMember: Membership with memberElement OR OwningMembership with ownedRelatedElement
     * - TransitionSuccessionMember: OwningMembership containing SuccessionAsUsage/TransitionSuccession
     */
    checkTransitionUsage(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const ownedRelationship = nodeAny.ownedRelationship ?? [];

        // Detect if this is a TargetTransitionUsage (no source expected)
        // TargetTransitionUsage is used for transitions attached to states that inherit source from context
        // Detection: Check if the node was parsed from a context that doesn't expect an explicit source
        // Heuristic: If there's no 'first' keyword usage, no source member should be expected
        // The grammar uses EmptyParameterMember as the first element for TargetTransitionUsage
        const isTargetTransition = this.isTargetTransitionUsage(nodeAny, ownedRelationship);

        // Check for source member in ownedRelationship
        // Source is stored as: Membership with memberElement OR OwningMembership with feature chain
        const hasSource = ownedRelationship.some((rel: any) => {
            // Membership with memberElement = source state reference
            if (rel.$type === 'Membership' && rel.memberElement) {
                return true;
            }
            // OwningMembership with ownedRelatedElement = feature chain to source
            if (rel.$type === 'OwningMembership') {
                const elements = rel.ownedRelatedElement ?? [];
                // Check for feature chain (not succession, not trigger)
                if (elements.some((e: any) =>
                    e.$type === 'FeatureChaining' ||
                    e.$type === 'Feature' ||
                    e.$type === 'OwnedFeatureChain')) {
                    return true;
                }
            }
            return false;
        });

        // Check for target member in ownedRelationship
        // Target can be:
        // 1. In TransitionSuccessionMember (OwningMembership containing SuccessionAsUsage) - "first X then Y" pattern
        // 2. Direct target property on the node - "accept X then Y" pattern
        const hasTargetInRelationship = ownedRelationship.some((rel: any) => {
            if (rel.$type === 'OwningMembership') {
                const elements = rel.ownedRelatedElement ?? [];
                return elements.some((e: any) =>
                    e.$type === 'SuccessionAsUsage' ||
                    e.$type === 'TransitionSuccession' ||
                    e.$type === 'Succession');
            }
            return false;
        });

        // Also check for direct target property (used in "accept X then Y" pattern)
        const hasDirectTarget = nodeAny.target !== undefined && nodeAny.target !== null;
        const hasTarget = hasTargetInRelationship || hasDirectTarget;

        // Only validate source if this is NOT a TargetTransitionUsage
        if (!isTargetTransition && !hasSource) {
             accept('error', ValidationCodes.INVALID_TRANSITION_USAGE_SOURCE_MSG, {
                node: node,
                code: ValidationCodes.INVALID_TRANSITION_USAGE_SOURCE
            });
        }

        // Target is always required
        if (!hasTarget) {
             accept('error', ValidationCodes.INVALID_TRANSITION_USAGE_TARGET_MSG, {
                node: node,
                code: ValidationCodes.INVALID_TRANSITION_USAGE_TARGET
            });
        }
    }

    /**
     * Detect if this TransitionUsage is a TargetTransitionUsage.
     * TargetTransitionUsage doesn't have an explicit source - it inherits from context.
     *
     * Heuristic: TargetTransitionUsage starts with EmptyParameterMember, not a source member.
     * Also check for the absence of the 'first' keyword indicator.
     */
    private isTargetTransitionUsage(nodeAny: any, ownedRelationship: any[]): boolean {
        // If there's a declaredName before 'first', it's a named TransitionUsage (has source)
        if (nodeAny.declaredName) {
            return false;
        }

        // Check if first relationship is EmptyParameterMember pattern
        // TransitionUsage with source: first rel is TransitionSourceMember
        // TargetTransitionUsage without source: first rel is EmptyParameterMember
        if (ownedRelationship.length > 0) {
            const firstRel = ownedRelationship[0];
            // EmptyParameterMember pattern: OwningMembership with empty or parameter-like element
            if (firstRel.$type === 'OwningMembership') {
                const elements = firstRel.ownedRelatedElement ?? [];
                if (elements.length === 0) {
                    // Empty parameter member - this is a TargetTransitionUsage
                    return true;
                }
                // Check for parameter-like elements (not source state references)
                if (elements.some((e: any) =>
                    e.$type === 'ReferenceUsage' && e.direction)) {
                    return true;
                }
            }
        }

        // Check for patterns where source is implicit (not explicit "first X"):
        // 1. "accept <Signal> then <target>" - ParameterMembership with ReferenceUsage
        // 2. "if <condition> then <target>" - ParameterMembership with expression/literal
        // Both patterns have the source implicit (from context or condition result)
        const hasImplicitSourcePattern = ownedRelationship.some((rel: any) => {
            // ParameterMembership = trigger or condition, not explicit source
            if (rel.$type === 'ParameterMembership') {
                return true; // Any ParameterMembership indicates implicit source pattern
            }
            // Also check OwningMembership for trigger patterns
            if (rel.$type === 'OwningMembership') {
                const elements = rel.ownedRelatedElement ?? [];
                return elements.some((e: any) =>
                    e.$type === 'AcceptActionUsage' ||
                    e.$type === 'TransitionFeatureMembership' ||
                    e.$type === 'TriggerInvocationExpression');
            }
            return false;
        });

        // If there's an implicit source pattern and no explicit source member, this is a TargetTransitionUsage
        if (hasImplicitSourcePattern) {
            // Check if we have an explicit source (Membership with memberElement)
            const hasExplicitSource = ownedRelationship.some((rel: any) => {
                // Explicit source: Membership with memberElement
                if (rel.$type === 'Membership' && rel.memberElement) {
                    return true;
                }
                return false;
            });
            if (!hasExplicitSource) {
                return true;
            }
        }

        // Also check container - if parent is a StateUsage/StateDefinition with entry/do/exit/transition
        // those transitions don't need explicit source
        const container = nodeAny.$container;
        if (container && (container.$type === 'StateUsage' || container.$type === 'StateDefinition')) {
            // Check if this transition appears in action body context
            const containerRel = nodeAny.$containerProperty;
            if (containerRel === 'do' || containerRel === 'entry' || containerRel === 'exit') {
                return true;
            }
        }

        return false;
    }

    /**
     * Check CalculationUsage constraints.
     * 
     */
    checkCalculationUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'CalculationDefinition', 'Calculation usage must be typed by calculation definitions', ValidationCodes.INVALID_CALCULATION_USAGE_TYPE, accept);
    }

    /**
     * Check ConstraintUsage constraints.
     * 
     */
    checkConstraintUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'ConstraintDefinition', 'Constraint usage must be typed by constraint definitions', ValidationCodes.INVALID_CONSTRAINT_USAGE_TYPE, accept);
    }

    /**
     * Check RequirementUsage constraints.
     * 
     */
    checkRequirementUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'RequirementDefinition', 'Requirement usage must be typed by requirement definitions', ValidationCodes.INVALID_REQUIREMENT_USAGE_TYPE, accept);
    }

    /**
     * Check CaseUsage constraints.
     * 
     */
    checkCaseUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'CaseDefinition', 'Case usage must be typed by case definitions', ValidationCodes.INVALID_CASE_USAGE_TYPE, accept);
    }

    /**
     * Check ViewUsage constraints.
     * 
     */
    checkViewUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'ViewDefinition', 'View usage must be typed by view definitions', ValidationCodes.INVALID_VIEW_USAGE_TYPE, accept);
    }

    /**
     * Check ViewpointUsage constraints.
     * 
     */
    checkViewpointUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'ViewpointDefinition', 'Viewpoint usage must be typed by viewpoint definitions', ValidationCodes.INVALID_VIEWPOINT_USAGE_TYPE, accept);
    }

    /**
     * Check RenderingUsage constraints.
     * 
     */
    checkRenderingUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'RenderingDefinition', 'Rendering usage must be typed by rendering definitions', ValidationCodes.INVALID_RENDERING_USAGE_TYPE, accept);
    }

    /**
     * Check MetadataUsage constraints.
     * 
     */
    checkMetadataUsage(node: AstNode, accept: ValidationAcceptor): void {
        this.checkAllTypes(node, 'MetadataDefinition', 'Metadata usage must be typed by metadata definitions', ValidationCodes.INVALID_METADATA_USAGE_TYPE, accept);
    }

    /**
     * Check Definition-level constraints.
     *  (checkDefinition)
     *
     * validateDefinitionVariationMembership:
     * An owned usage of a variation must be a variant.
     *
     * validateDefinitionVariationSpecialization:
     * A variation must not specialize another variation.
     */
    checkDefinition(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        
        if (nodeAny.isVariation) {
            // validateDefinitionVariationIsAbstract
            if (!nodeAny.isAbstract) {
                accept('error', 'A variation must be abstract.', {
                    node: node,
                    property: 'name', // Point to name as isAbstract might not be a token
                    code: ValidationCodes.INVALID_DEFINITION_VARIATION_IS_ABSTRACT
                });
            }

            // validateDefinitionVariationMembership
            // Use ownedRelationship because ownedFeatureMembership might not be populated in Langium AST
            const ownedRelationship = nodeAny.ownedRelationship;
            if (Array.isArray(ownedRelationship)) {
                for (const mem of ownedRelationship) {
                    // Check for non-variant memberships
                    // FeatureMembership (e.g. attribute a) and OwningMembership (e.g. part a) are standard usages.
                    // If they appear in a variation, they must be variants (VariantMembership).
                    // ParameterMembership and ObjectiveMembership are explicitly allowed.
                    
                    if (mem.$type === 'FeatureMembership' || mem.$type === 'OwningMembership') {
                         accept('error', 'An owned usage of a variation must be a variant.', {
                                node: mem,
                                code: ValidationCodes.INVALID_DEFINITION_VARIATION_MEMBERSHIP
                            });
                    }
                }
            }

            // validateDefinitionVariationSpecialization
            const ownedSpecialization = nodeAny.ownedSpecialization;
            if (Array.isArray(ownedSpecialization)) {
                for (const ownedSpec of ownedSpecialization) {
                    // In Langium AST, references are usually wrapped.
                    // So we need `ownedSpec.general?.ref`.
                    const generalType = ownedSpec.general?.ref;
                    if (generalType && (generalType as any).isVariation) {
                         accept('error', 'A variation must not specialize another variation.', {
                            node: ownedSpec,
                            property: 'general',
                            code: ValidationCodes.INVALID_DEFINITION_VARIATION_SPECIALIZATION
                        });
                    }
                }
            }
        }
    }

    /**
     * Check Usage-level constraints.
     * 
     */
    checkUsage(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        
        if (nodeAny.isVariation) {
             // validateUsageVariationIsAbstract
            if (!nodeAny.isAbstract) {
                accept('error', 'A variation must be abstract.', {
                    node: node,
                    property: 'name',
                    code: ValidationCodes.INVALID_USAGE_VARIATION_IS_ABSTRACT
                });
            }

            // validateUsageVariationMembership
            const ownedRelationship = nodeAny.ownedRelationship;
            if (Array.isArray(ownedRelationship)) {
                for (const mem of ownedRelationship) {
                    if (mem.$type === 'FeatureMembership' || mem.$type === 'OwningMembership') {
                         accept('error', 'An owned usage of a variation must be a variant.', {
                                node: mem,
                                code: ValidationCodes.INVALID_USAGE_VARIATION_MEMBERSHIP
                            });
                    }
                }
            }
            
            // validateUsageVariationSpecialization
             const ownedSpecialization = nodeAny.ownedSpecialization;
            if (Array.isArray(ownedSpecialization)) {
                for (const ownedSpec of ownedSpecialization) {
                    const generalType = ownedSpec.general?.ref;
                    if (generalType && (generalType as any).isVariation) {
                         accept('error', 'A variation must not specialize another variation.', {
                            node: ownedSpec,
                            property: 'general',
                            code: ValidationCodes.INVALID_USAGE_VARIATION_SPECIALIZATION
                        });
                    }
                }
            }
        }
    }

    /**
     * Check for duplicate member names in a namespace.
     *  (checkNamespace)
     *
     * validateNamespaceDistinguishability:
     * - Check ownedMemberships for duplicate names
     * - Check aliases against owned members
     * - Check inherited members for conflicts (if Type)
     */
    checkNamespace(node: AstNode, accept: ValidationAcceptor): void {
        // Skip performance-expensive checks for certain node types
        if (shouldSkipDistinguishabilityCheck(node)) return;

        const nodeAny = node as any;
        const ownedMembership = nodeAny.ownedMembership ?? nodeAny.ownedRelationship;

        if (!Array.isArray(ownedMembership)) return;

        // Build name maps
        const owningMemberships: AstNode[] = [];
        const aliasMemberships: AstNode[] = [];

        for (const mem of ownedMembership) {
            if (mem?.$type === 'OwningMembership') {
                owningMemberships.push(mem);
            } else if (mem) {
                aliasMemberships.push(mem);
            }
        }

        // Check owning memberships for duplicates
        const owningMap = this.buildNameMap(owningMemberships);
        this.checkDistinguishability(owningMemberships, owningMap, accept,
            'Duplicate of other owned member name');

        // Check alias memberships
        const aliasMap = this.buildNameMap(aliasMemberships);
        for (const mem of aliasMemberships) {
            // Check against owned members
            this.checkMemberAgainstMap(mem, owningMap, accept,
                'Duplicate of owned member name');
            // Check against other aliases
            this.checkMemberAgainstMap(mem, aliasMap, accept,
                'Duplicate of other alias name');
        }

        // Check inherited members if this is a Type
        if (isType(node)) {
            const inheritedMembership = nodeAny.inheritedMembership;
            if (Array.isArray(inheritedMembership)) {
                const inheritedMap = this.buildNameMap(inheritedMembership);
                for (const mem of ownedMembership) {
                    this.checkMemberAgainstMap(mem, inheritedMap, accept,
                        'Duplicate of inherited member name');
                }
            }
        }
    }

    /**
     * Build a map of names to memberships.
     *  (nameMap)
     */
    private buildNameMap(memberships: AstNode[]): Map<string, AstNode[]> {
        const nameMap = new Map<string, AstNode[]>();

        for (const mem of memberships) {
            const memAny = mem as any;
            const memberElement = memAny.ownedMemberElement ?? memAny.memberElement ?? memAny.ownedRelatedElement;

            // Get actual element for comparison
            const element = Array.isArray(memberElement) ? memberElement[0] : memberElement;

            const shortName = getMemberShortName(mem) ?? getMemberShortName(element);
            const name = getMemberName(mem) ?? getMemberName(element);

            if (shortName) {
                const existing = nameMap.get(shortName) ?? [];
                existing.push(mem);
                nameMap.set(shortName, existing);
            }
            if (name && name !== shortName) {
                const existing = nameMap.get(name) ?? [];
                existing.push(mem);
                nameMap.set(name, existing);
            }
        }

        return nameMap;
    }

    /**
     * Check for duplicates in a name map.
     *  (checkDistinguishibility)
     */
    private checkDistinguishability(
        memberships: AstNode[],
        nameMap: Map<string, AstNode[]>,
        accept: ValidationAcceptor,
        msg: string
    ): void {
        for (const mem of memberships) {
            this.checkMemberAgainstMap(mem, nameMap, accept, msg);
        }
    }

    /**
     * Check a single member against a name map.
     * 
     */
    private checkMemberAgainstMap(
        mem: AstNode,
        nameMap: Map<string, AstNode[]>,
        accept: ValidationAcceptor,
        msg: string
    ): void {
        const memAny = mem as any;
        const memberElement = memAny.ownedMemberElement ?? memAny.memberElement ?? memAny.ownedRelatedElement;
        const element = Array.isArray(memberElement) ? memberElement[0] : memberElement;

        const shortName = getMemberShortName(mem) ?? getMemberShortName(element);
        const name = getMemberName(mem) ?? getMemberName(element);

        if (shortName) {
            const dups = nameMap.get(shortName)?.filter(m => {
                const mAny = m as any;
                const mElement = mAny.ownedMemberElement ?? mAny.memberElement ?? mAny.ownedRelatedElement;
                const mEl = Array.isArray(mElement) ? mElement[0] : mElement;
                return mEl !== element && m !== mem;
            });
            if (dups && dups.length > 0) {
                accept('warning', `${msg}: '${shortName}'`, {
                    node: element ?? mem,
                    property: 'declaredShortName',
                    code: ValidationCodes.INVALID_NAMESPACE_DISTINGUISHABILITY
                });
            }
        }

        if (name && name !== shortName) {
            const dups = nameMap.get(name)?.filter(m => {
                const mAny = m as any;
                const mElement = mAny.ownedMemberElement ?? mAny.memberElement ?? mAny.ownedRelatedElement;
                const mEl = Array.isArray(mElement) ? mElement[0] : mElement;
                return mEl !== element && m !== mem;
            });
            if (dups && dups.length > 0) {
                accept('warning', `${msg}: '${name}'`, {
                    node: element ?? mem,
                    property: 'declaredName',
                    code: ValidationCodes.INVALID_NAMESPACE_DISTINGUISHABILITY
                });
            }
        }
    }

    /**
     * Check that conjugated types cannot be specialized.
     *  (checkSpecialization)
     *
     * validateSpecializationSpecificNotConjugated:
     * A Specialization's specific type cannot be a conjugated type.
     */
    checkSpecialization(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const specific = nodeAny.specific;

        if (specific) {
            const specificAny = specific as any;
            // Check if the specific type is conjugated
            if (specificAny.isConjugated || specificAny.ownedConjugator) {
                accept('error', 'Conjugated type cannot be a specialized type', {
                    node: node,
                    property: 'specific',
                    code: ValidationCodes.INVALID_SPECIALIZATION_SPECIFIC_NOT_CONJUGATED
                });
            }
        }
    }

    /**
     * Check Type-level constraints.
     *  (checkType)
     *
     * validateTypeAtMostOneConjugator:
     * A Type can have at most one Conjugation.
     *
     * validateTypeOwnedMultiplicity:
     * A Type can have at most one owned Multiplicity.
     */
    checkType(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const ownedRelationship = nodeAny.ownedRelationship;

        if (!Array.isArray(ownedRelationship)) return;

        // validateTypeAtMostOneConjugator
        let conjugationCount = 0;
        for (const rel of ownedRelationship) {
            if (rel?.$type === 'Conjugation') {
                conjugationCount++;
            }
        }
        if (conjugationCount > 1) {
            accept('error', 'Cannot have more than one conjugator', {
                node: node,
                code: ValidationCodes.INVALID_TYPE_AT_MOST_ONE_CONJUGATOR
            });
        }

        // validateTypeOwnedMultiplicity
        let multiplicityCount = 0;
        for (const rel of ownedRelationship) {
            const memberElement = rel?.memberElement ?? rel?.ownedMemberElement;
            const elem = Array.isArray(memberElement) ? memberElement[0] : memberElement;
            if (elem?.$type === 'Multiplicity' || elem?.$type === 'MultiplicityRange') {
                multiplicityCount++;
            }
        }
        if (multiplicityCount > 1) {
            accept('error', 'Only one multiplicity is allowed', {
                node: node,
                code: ValidationCodes.INVALID_TYPE_OWNED_MULTIPLICITY
            });
        }
    }

    /**
     * Check Feature-level constraints.
     *  (checkFeature)
     *
     * validateFeatureOwnedReferenceSubsetting:
     * A Feature can have at most one ReferenceSubsetting.
     *
     * validateFeatureChainingFeatureNotOne:
     * Cannot have only one chaining feature.
     */
    checkFeature(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const ownedRelationship = nodeAny.ownedRelationship;

        if (!Array.isArray(ownedRelationship)) return;

        // validateFeatureOwnedReferenceSubsetting
        const refSubsettings: AstNode[] = [];
        for (const rel of ownedRelationship) {
            if (rel?.$type === 'ReferenceSubsetting') {
                refSubsettings.push(rel);
            }
        }

        if (refSubsettings.length > 1) {
            // Error on all but the first ReferenceSubsetting
            for (let i = 1; i < refSubsettings.length; i++) {
                accept('error', 'At most one reference subsetting is allowed', {
                    node: refSubsettings[i],
                    code: ValidationCodes.INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING
                });
            }
        }

        // validateFeatureChainingFeatureNotOne
        const featureChainings: AstNode[] = [];
        for (const rel of ownedRelationship) {
            if (rel?.$type === 'FeatureChaining') {
                featureChainings.push(rel);
            }
        }

        if (featureChainings.length === 1) {
            accept('error', 'Cannot have only one chaining feature', {
                node: featureChainings[0],
                code: ValidationCodes.INVALID_FEATURE_CHAINING_FEATURE_NOT_ONE
            });
        }
    }

    /**
     * Check Import-level constraints.
     *  (checkImport)
     *
     * validateImportTopLevelVisibility:
     * Top level import must be private.
     */
    checkImport(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const importOwningNamespace = nodeAny.importOwningNamespace;

        // Check if this is a top-level import
        if (importOwningNamespace) {
            const owner = (importOwningNamespace as any).owner ?? (importOwningNamespace as any).$container;
            // If no owner, this is top-level
            if (!owner && nodeAny.visibility !== 'private') {
                accept('error', 'Top level import must be private', {
                    node: node,
                    code: ValidationCodes.INVALID_IMPORT_TOP_LEVEL_VISIBILITY
                });
            }
        }
    }

    /**
     * Check Connector-level constraints.
     *  (checkConnector)
     *
     * validateConnectorRelatedFeatures:
     * A Connector must have at least two related elements.
     *
     * validateConnectorBinarySpecialization:
     * A binary Connector cannot have more than two ends.
     */
    checkConnector(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const connectorEnd = nodeAny.connectorEnd ?? nodeAny.ownedFeature?.filter(
            (f: any) => f?.isEnd
        );

        if (Array.isArray(connectorEnd)) {
            // validateConnectorRelatedFeatures
            if (connectorEnd.length < 2) {
                accept('error', 'Must have at least two related elements', {
                    node: node,
                    code: ValidationCodes.INVALID_CONNECTOR_RELATED_FEATURES
                });
            }

            // validateConnectorBinarySpecialization
            // Check if it's binary (has BinaryAssociation in supertypes or default)
            if (connectorEnd.length > 2) {
                accept('error', 'Cannot have more than two ends', {
                    node: node,
                    code: ValidationCodes.INVALID_CONNECTOR_BINARY_SPECIALIZATION
                });
            }
        }
    }

    /**
     * Check BindingConnector-level constraints.
     *  (checkBindingConnector)
     *
     * validateBindingConnectorIsBinary:
     * A BindingConnector must be binary (exactly two ends).
     */
    checkBindingConnector(node: AstNode, accept: ValidationAcceptor): void {
        const nodeAny = node as any;
        const connectorEnd = nodeAny.connectorEnd ?? nodeAny.ownedFeature?.filter(
            (f: any) => f?.isEnd
        );

        if (Array.isArray(connectorEnd) && connectorEnd.length !== 2) {
            accept('error', 'Binding connector must be binary', {
                node: node,
                code: ValidationCodes.INVALID_BINDING_CONNECTOR_IS_BINARY
            });
        }
    }
}

/**
 * Register validation checks with Langium's validation registry.
 * Uses type-specific registration for Langium 3.x compatibility.
 */
export function registerSysMLValidationChecks(_services: SysMLServices): ValidationChecks<SysMLAstType> {
    const validator = new SysMLValidator();

    return {
        AstNode: (node, accept) => {
            // Definition checks
            if (node.$type.endsWith('Definition')) {
                validator.checkDefinition(node, accept);
                
                if (node.$type === 'ConjugatedPortDefinition') {
                    validator.checkConjugatedPortDefinition(node, accept);
                } else if (node.$type === 'PortDefinition') {
                    validator.checkPortDefinition(node, accept);
                } else if (node.$type === 'FlowDefinition') {
                    validator.checkFlowDefinition(node, accept);
                } else if (node.$type === 'InterfaceDefinition') {
                    validator.checkInterfaceDefinition(node, accept);
                }
            }
            
            // Usage checks
            if (node.$type.endsWith('Usage')) {
                validator.checkUsage(node, accept);
                
                if (node.$type === 'AttributeUsage') {
                    validator.checkAttributeUsage(node, accept);
                } else if (node.$type === 'EnumerationUsage') {
                    validator.checkEnumerationUsage(node, accept);
                } else if (node.$type === 'OccurrenceUsage') {
                    validator.checkOccurrenceUsage(node, accept);
                } else if (node.$type === 'PortUsage') {
                    validator.checkPortUsage(node, accept);
                } else if (node.$type === 'ItemUsage') {
                    validator.checkItemUsage(node, accept);
                } else if (node.$type === 'PartUsage') {
                    validator.checkPartUsage(node, accept);
                } else if (node.$type === 'ConnectionUsage') {
                    validator.checkConnectionUsage(node, accept);
                } else if (node.$type === 'FlowUsage') {
                    validator.checkFlowUsage(node, accept);
                } else if (node.$type === 'InterfaceUsage') {
                    validator.checkInterfaceUsage(node, accept);
                } else if (node.$type === 'AllocationUsage') {
                    validator.checkAllocationUsage(node, accept);
                } else if (node.$type === 'AcceptActionUsage') {
                    validator.checkAcceptActionUsage(node, accept);
                } else if (node.$type === 'ActionUsage') {
                    validator.checkActionUsage(node, accept);
                } else if (node.$type === 'AssignmentActionUsage') {
                    validator.checkAssignmentActionUsage(node, accept);
                } else if (node.$type === 'PerformActionUsage') {
                    validator.checkPerformActionUsage(node, accept);
                } else if (node.$type === 'SendActionUsage') {
                    validator.checkSendActionUsage(node, accept);
                } else if (node.$type === 'StateUsage') {
                    validator.checkStateUsage(node, accept);
                } else if (node.$type === 'TransitionUsage') {
                    validator.checkTransitionUsage(node, accept);
                } else if (node.$type === 'CalculationUsage') {
                    validator.checkCalculationUsage(node, accept);
                } else if (node.$type === 'ConstraintUsage') {
                    validator.checkConstraintUsage(node, accept);
                } else if (node.$type === 'RequirementUsage') {
                    validator.checkRequirementUsage(node, accept);
                } else if (node.$type === 'CaseUsage') {
                    validator.checkCaseUsage(node, accept);
                } else if (node.$type === 'ViewUsage') {
                    validator.checkViewUsage(node, accept);
                } else if (node.$type === 'ViewpointUsage') {
                    validator.checkViewpointUsage(node, accept);
                } else if (node.$type === 'RenderingUsage') {
                    validator.checkRenderingUsage(node, accept);
                } else if (node.$type === 'MetadataUsage') {
                    validator.checkMetadataUsage(node, accept);
                }
            }

            // Namespace checks
            // Most definitions are namespaces
            if (node.$type === 'Namespace' || node.$type === 'Package' || node.$type.endsWith('Definition')) {
                 validator.checkNamespace(node, accept);
            }
            
            // Type checks
            if (isType(node)) {
                validator.checkType(node, accept);
            }
            
            // Feature checks
            if (node.$type === 'Feature' || node.$type.endsWith('Usage')) {
                validator.checkFeature(node, accept);
            }
            
            // Import checks
            if (node.$type.includes('Import')) {
                validator.checkImport(node, accept);
            }
            
            // Specialization checks
            if (node.$type === 'Specialization' || node.$type === 'Subclassification' || node.$type === 'Subsetting' || node.$type === 'Redefinition') {
                validator.checkSpecialization(node, accept);
            }
            
            // Connector checks
            if (node.$type.includes('Connector') || node.$type === 'Connection') {
                 if (node.$type === 'BindingConnector') {
                     validator.checkBindingConnector(node, accept);
                 } else {
                     validator.checkConnector(node, accept);
                 }
            }
        }
    };
}
