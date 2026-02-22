/**
 * SysML Validator
 *
 * Implements SysML v2 / KerML specification validation rules
 * using the EObject Shim API.
 *
 * Validation rules:
 * - checkAnnotation: Annotation ownership validation
 * - checkType: Type conjugator and multiplicity validation
 * - checkVariantMembership: Variant membership ownership
 * - checkNamespaceDuplicates: Duplicate member names (simplified)
 */

import { EObject } from '@sysml/shim';

// ============================================================================
// Validation Issue Types (Shim-specific, prefixed to avoid conflict with validation/src)
// ============================================================================

export type ShimSeverity = 'error' | 'warning' | 'info';

export interface ShimValidationIssue {
    severity: ShimSeverity;
    message: string;
    source: EObject;
    feature?: string;
    code: string;
}

// ============================================================================
// Error Codes
// ============================================================================

export const ValidationCodes = {
    // Annotation
    INVALID_ANNOTATION_ANNOTATING_ELEMENT: 'invalid_annotation_annotating_element',
    INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP: 'invalid_annotation_annotated_element_ownership',

    // Type
    INVALID_TYPE_AT_MOST_ONE_CONJUGATOR: 'invalid_type_at_most_one_conjugator',
    INVALID_TYPE_OWNED_MULTIPLICITY: 'invalid_type_owned_multiplicity',
    INVALID_TYPE_OWNED_DIFFERENCING_NOT_ONE: 'invalid_type_owned_differencing_not_one',
    INVALID_TYPE_OWNED_INTERSECTING_NOT_ONE: 'invalid_type_owned_intersecting_not_one',
    INVALID_TYPE_OWNED_UNIONING_NOT_ONE: 'invalid_type_owned_unioning_not_one',

    // Namespace
    INVALID_NAMESPACE_DISTINGUISHABILITY: 'invalid_namespace_distinguishability',

    // VariantMembership
    INVALID_VARIANT_MEMBERSHIP_OWNING_NAMESPACE: 'invalid_variant_membership_owning_namespace',

    // Feature
    INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING: 'invalid_feature_owned_reference_subsetting',
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ValidationMessages = {
    INVALID_ANNOTATION_ANNOTATING_ELEMENT:
        'Must either own or be owned by its annotating element',
    INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP_1:
        'Must own its annotating element',
    INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP_2:
        'Must be owned by its annotated element',
    INVALID_TYPE_AT_MOST_ONE_CONJUGATOR:
        'Cannot have more than one conjugator',
    INVALID_TYPE_OWNED_MULTIPLICITY:
        'Only one multiplicity is allowed',
    INVALID_TYPE_OWNED_DIFFERENCING_NOT_ONE:
        'Cannot have only one differencing',
    INVALID_TYPE_OWNED_INTERSECTING_NOT_ONE:
        'Cannot have only one intersecting',
    INVALID_TYPE_OWNED_UNIONING_NOT_ONE:
        'Cannot have only one unioning',
    INVALID_NAMESPACE_DISTINGUISHABILITY:
        'Duplicate of other owned member name',
    INVALID_VARIANT_MEMBERSHIP_OWNING_NAMESPACE:
        'VariantMembership owner must be a variation',
    INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING:
        'At most one reference subsetting is allowed',
} as const;

// ============================================================================
// Abstract Validator Base Class (Shim-specific, prefixed to avoid conflict)
// ============================================================================

export abstract class ShimAbstractValidator {
    protected issues: ShimValidationIssue[] = [];

    protected error(message: string, source: EObject, feature: string | undefined, code: string): void {
        this.issues.push({ severity: 'error', message, source, feature, code });
    }

    protected warning(message: string, source: EObject, feature: string | undefined, code: string): void {
        this.issues.push({ severity: 'warning', message, source, feature, code });
    }

    protected info(message: string, source: EObject, feature: string | undefined, code: string): void {
        this.issues.push({ severity: 'info', message, source, feature, code });
    }

    /**
     * Validate all nodes in the tree rooted at `root`.
     * Returns accumulated validation issues.
     */
    validate(root: EObject): ShimValidationIssue[] {
        this.issues = [];
        this.traverseAndValidate(root);
        return this.issues;
    }

    private traverseAndValidate(obj: EObject): void {
        this.dispatch(obj);
        for (const child of obj.eContents()) {
            this.traverseAndValidate(child);
        }
    }

    /**
     * Dispatch to type-specific check methods.
     * Subclasses override this to add type-specific validation.
     */
    protected abstract dispatch(obj: EObject): void;
}

// ============================================================================
// SysML/KerML Validator Implementation
// ============================================================================

export class SysMLValidator extends ShimAbstractValidator {

    /**
     * Dispatch to type-specific check methods based on eClass name.
     * This mirrors the @Check annotation behavior.
     */
    protected dispatch(obj: EObject): void {
        const typeName = obj.eClass().getName();

        switch (typeName) {
            case 'Annotation':
                this.checkAnnotation(obj);
                break;
            case 'Type':
            case 'Classifier':
            case 'Class':
            case 'DataType':
            case 'Structure':
            case 'Association':
            case 'AssociationStructure':
            case 'Behavior':
            case 'Function':
            case 'Predicate':
            case 'Interaction':
            // SysML types that extend Type
            case 'Definition':
            case 'Usage':
            case 'PartDefinition':
            case 'PartUsage':
            case 'ItemDefinition':
            case 'ItemUsage':
            case 'PortDefinition':
            case 'PortUsage':
            case 'AttributeDefinition':
            case 'AttributeUsage':
            case 'ActionDefinition':
            case 'ActionUsage':
            case 'StateDefinition':
            case 'StateUsage':
            case 'RequirementDefinition':
            case 'RequirementUsage':
                this.checkType(obj);
                break;
            case 'VariantMembership':
                this.checkVariantMembership(obj);
                break;
            case 'Namespace':
            case 'Package':
                this.checkNamespace(obj);
                break;
            case 'Feature':
                this.checkFeature(obj);
                break;
        }
    }

    // ========================================================================
    // ========================================================================

    /**
     * @Check def checkAnnotation(Annotation ann)
     *
     * Validates:
     * - validateAnnotationAnnotatingElement: Must either own or be owned by annotating element
     * - validateAnnotationAnnotatedElementOwnership: Ownership consistency
     */
    private checkAnnotation(ann: EObject): void {
        // validateAnnotationAnnotatingElement
        const ownedAnnotatingElement = ann.eGet('ownedAnnotatingElement');
        const owningAnnotatingElement = ann.eGet('owningAnnotatingElement');

        if ((ownedAnnotatingElement === null && owningAnnotatingElement === null) ||
            (ownedAnnotatingElement !== null && owningAnnotatingElement !== null)) {
            this.error(
                ValidationMessages.INVALID_ANNOTATION_ANNOTATING_ELEMENT,
                ann,
                undefined,
                ValidationCodes.INVALID_ANNOTATION_ANNOTATING_ELEMENT
            );
        }

        // validateAnnotationAnnotatedElementOwnership
        const owningAnnotatedElement = ann.eGet('owningAnnotatedElement');
        if (owningAnnotatedElement !== null && ownedAnnotatingElement === null) {
            this.error(
                ValidationMessages.INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP_1,
                ann,
                undefined,
                ValidationCodes.INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP
            );
        }
        if (owningAnnotatedElement === null && ownedAnnotatingElement !== null) {
            this.error(
                ValidationMessages.INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP_2,
                ann,
                undefined,
                ValidationCodes.INVALID_ANNOTATION_ANNOTATED_ELEMENT_OWNERSHIP
            );
        }
    }

    // ========================================================================
    // ========================================================================

    /**
     * @Check def checkType(Type t)
     *
     * Validates:
     * - validateTypeAtMostOneConjugator: Cannot have more than one conjugator
     * - validateTypeOwnedMultiplicity: Only one multiplicity allowed
     * - validateTypeOwnedDifferencingNotOne: Cannot have exactly one differencing
     * - validateTypeOwnedIntersectingNotOne: Cannot have exactly one intersecting
     * - validateTypeOwnedUnioningNotOne: Cannot have exactly one unioning
     */
    private checkType(t: EObject): void {
        // validateTypeAtMostOneConjugator
        const ownedRelationship = t.eGet('ownedRelationship') as EObject[] | null;
        if (ownedRelationship) {
            const conjugations = ownedRelationship.filter(r =>
                r.eClass().getName() === 'Conjugation'
            );
            if (conjugations.length > 1) {
                this.error(
                    ValidationMessages.INVALID_TYPE_AT_MOST_ONE_CONJUGATOR,
                    t,
                    undefined,
                    ValidationCodes.INVALID_TYPE_AT_MOST_ONE_CONJUGATOR
                );
            }
        }

        // validateTypeOwnedDifferencingNotOne
        const ownedDifferencing = t.eGet('ownedDifferencing') as EObject[] | null;
        this.checkNotOne(
            ownedDifferencing,
            t,
            ValidationMessages.INVALID_TYPE_OWNED_DIFFERENCING_NOT_ONE,
            ValidationCodes.INVALID_TYPE_OWNED_DIFFERENCING_NOT_ONE
        );

        // validateTypeOwnedIntersectingNotOne
        const ownedIntersecting = t.eGet('ownedIntersecting') as EObject[] | null;
        this.checkNotOne(
            ownedIntersecting,
            t,
            ValidationMessages.INVALID_TYPE_OWNED_INTERSECTING_NOT_ONE,
            ValidationCodes.INVALID_TYPE_OWNED_INTERSECTING_NOT_ONE
        );

        // validateTypeOwnedUnioningNotOne
        const ownedUnioning = t.eGet('ownedUnioning') as EObject[] | null;
        this.checkNotOne(
            ownedUnioning,
            t,
            ValidationMessages.INVALID_TYPE_OWNED_UNIONING_NOT_ONE,
            ValidationCodes.INVALID_TYPE_OWNED_UNIONING_NOT_ONE
        );

        // validateTypeOwnedMultiplicity
        const ownedMembership = t.eGet('ownedMembership') as EObject[] | null;
        if (ownedMembership) {
            const multiplicityMemberships = ownedMembership.filter(m => {
                const memberElement = m.eGet('memberElement') as EObject | null;
                return memberElement && memberElement.eClass().getName() === 'Multiplicity';
            });
            if (multiplicityMemberships.length > 1) {
                this.error(
                    ValidationMessages.INVALID_TYPE_OWNED_MULTIPLICITY,
                    t,
                    'memberElement',
                    ValidationCodes.INVALID_TYPE_OWNED_MULTIPLICITY
                );
            }
        }
    }

    // ========================================================================
    // ========================================================================

    /**
     * @Check def checkVariantMembership(VariantMembership mem)
     *
     * Validates:
     * - validateVariantMembershipOwningNamespace: Owner must be a variation
     */
    private checkVariantMembership(mem: EObject): void {
        const owningNamespace = mem.eGet('membershipOwningNamespace') as EObject | null;
        if (owningNamespace) {
            const isVariation = owningNamespace.eGet('isVariation') as boolean;
            if (!isVariation) {
                this.error(
                    ValidationMessages.INVALID_VARIANT_MEMBERSHIP_OWNING_NAMESPACE,
                    mem,
                    undefined,
                    ValidationCodes.INVALID_VARIANT_MEMBERSHIP_OWNING_NAMESPACE
                );
            }
        }
    }

    // ========================================================================
    // Simplified version - checks duplicate names in owned memberships
    // ========================================================================

    /**
     * @Check def checkNamespace(Namespace namesp)
     *
     * Validates:
     * - validateNamespaceDistinguishability: No duplicate member names
     * (Simplified: only checks ownedMembership, not inherited)
     *
     * Note: Langium AST uses different property names than EMF:
     * - ownedRelationship instead of ownedMembership
     * - ownedRelatedElement instead of memberElement
     */
    private checkNamespace(ns: EObject): void {
        const ownedRelationship = ns.eGet('ownedRelationship') as EObject[] | null;
        if (!ownedRelationship || ownedRelationship.length < 2) return;

        // Filter to OwningMembership types
        const owningMemberships = ownedRelationship.filter(r =>
            r.eClass().getName() === 'OwningMembership'
        );

        if (owningMemberships.length < 2) return;

        // Build name map
        const nameMap = new Map<string, { membership: EObject; element: EObject }[]>();
        for (const mem of owningMemberships) {
            // In Langium AST: ownedRelatedElement is an array of owned elements
            const ownedElements = mem.eGet('ownedRelatedElement') as EObject[] | null;
            if (ownedElements) {
                for (const element of ownedElements) {
                    const name = element.eGet('declaredName') as string | null;
                    if (name) {
                        const existing = nameMap.get(name) || [];
                        existing.push({ membership: mem, element });
                        nameMap.set(name, existing);
                    }
                }
            }
        }

        // Report duplicates
        for (const [name, entries] of nameMap.entries()) {
            if (entries.length > 1) {
                // Error on all but the first
                for (let i = 1; i < entries.length; i++) {
                    this.error(
                        `${ValidationMessages.INVALID_NAMESPACE_DISTINGUISHABILITY}: '${name}'`,
                        entries[i].element,
                        'declaredName',
                        ValidationCodes.INVALID_NAMESPACE_DISTINGUISHABILITY
                    );
                }
            }
        }
    }

    // ========================================================================
    // Partial: only reference subsetting check
    // ========================================================================

    /**
     * @Check def checkFeature(Feature f)
     *
     * Validates:
     * - validateFeatureOwnedReferenceSubsetting: At most one reference subsetting
     */
    private checkFeature(f: EObject): void {
        const ownedRelationship = f.eGet('ownedRelationship') as EObject[] | null;
        if (ownedRelationship) {
            const refSubsettings = ownedRelationship.filter(r =>
                r.eClass().getName() === 'ReferenceSubsetting'
            );
            if (refSubsettings.length > 1) {
                // Error on all but the first
                for (let i = 1; i < refSubsettings.length; i++) {
                    this.error(
                        ValidationMessages.INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING,
                        refSubsettings[i],
                        undefined,
                        ValidationCodes.INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING
                    );
                }
            }
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Check that collection does not have exactly one element.
     * (Having 0 or 2+ is valid, having exactly 1 is invalid)
     */
    private checkNotOne(
        collection: EObject[] | null,
        source: EObject,
        message: string,
        code: string
    ): void {
        if (collection && collection.length === 1) {
            this.error(message, source, undefined, code);
        }
    }
}

// ============================================================================
// Export convenience function
// ============================================================================

/**
 * Validate an EObject tree and return all issues.
 */
export function validateSysML(root: EObject): ShimValidationIssue[] {
    const validator = new SysMLValidator();
    return validator.validate(root);
}
