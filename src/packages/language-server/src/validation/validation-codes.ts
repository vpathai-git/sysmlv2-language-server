/**
 * Validation Codes and Messages
 *
 * Standard validation codes for SysML v2 / KerML specification compliance.
 */

// ============================================================================
// VALIDATION CODES
// ============================================================================

export const ValidationCodes = {
    // ELEMENT
    INVALID_ELEMENT_FILTER_MEMBERSHIP_IS_BOOLEAN: "validateElementFilterMembershipIsBoolean",
    INVALID_ELEMENT_FILTER_MEMBERSHIP_IS_MODEL_LEVEL_EVALUABLE: "validateElementFilterMembershipIsModelLevelEvaluable",
    INVALID_ELEMENT_IS_IMPLIED_INCLUDED: "validateElementIsImpliedIncluded",

    // ANNOTATION
    INVALID_ANNOTATION_ANNOTATED_ELEMNT_OWNERSHIP: "validateAnnotationAnnotatedElementOwnership",
    INVALID_ANNOTATION_ANNOTATING_ELEMENT: "validateAnnotationAnnotatingElement",

    // NAMESPACE
    INVALID_NAMESPACE_DISTINGUISHABILITY: "validateNamespaceDistinguishablity",

    // IMPORT
    INVALID_IMPORT_TOP_LEVEL_VISIBILITY: "validateImportTopLevelVisibility",

    // SPECIALIZATION
    INVALID_SPECIALIZATION_SPECIFIC_NOT_CONJUGATED: "validateSpecializationSpecificNotConjugated",

    // TYPE
    INVALID_TYPE_AT_MOST_ONE_CONJUGATOR: "validateTypeAtMostOneConjugator",
    INVALID_TYPE_DIFFERENCING_TYPES_NOT_SELF: "validateTypeDifferencingTypesNotSelf",
    INVALID_TYPE_INTERSECTING_TYPES_NOT_SELF: "validateTypeIntersectingTypesNotSelf",
    INVALID_TYPE_OWNED_DIFFERENCING_NOT_ONE: "validateOwnedDifferencingNotOne",
    INVALID_TYPE_OWNED_INTERSECTING_NOT_ONE: "validateOwnedIntersectingNotOne",
    INVALID_TYPE_OWNED_MULTIPLICITY: "validateTypeOwnedMultiplicity",
    INVALID_TYPE_OWNED_UNIONING_NOT_ONE: "validateOwnedUnioningNotOne",
    INVALID_TYPE_UNIONING_TYPES_NOT_SELF: "validateTypeUnioningTypesNotSelf",

    // CLASSIFIER
    INVALID_CLASSIFIER_DEFAULT_SUPERTYPE: "validateClassifierDefaultSupertype_",
    INVALID_CLASSIFIER_MULTIPLICITY_DOMAIN: "validateClassifierMultiplicityDomain",

    // CLASS
    INVALID_CLASS_SPECIALIZATION: "validateClassSpecialization",

    // STRUCTURE
    INVALID_STRUCTURE_SPECIALIZATION: "validateStructureSpecialization",

    // ASSOCIATION
    INVALID_ASSOCIATION_BINARY_SPECIALIZATION: "validateAssociationBinarySpecialization",
    INVALID_ASSOCIATION_END_TYPES: "validateAssociationEndTypes",
    INVALID_ASSOCIATION_RELATED_TYPES: "validateAssociationRelatedTypes",
    INVALID_ASSOCIATION_STRUCTURE_INTERSECTION: "validateAssociationStructureIntersection",

    // FEATURE
    INVALID_FEATURE_CHAINING_FEATURES_NOT_SELF: "validateFeatureChainingFeaturesNotSelf",
    INVALID_FEATURE_CHAINING_FEATURE_CONFORMANCE: "validateFeatureChainingFeatureConformance",
    INVALID_FEATURE_CHAINING_FEATURE_NOT_ONE: "validateFeatureChainingFeatureNotOne",
    INVALID_FEATURE_CHAIN_EXPRESSION_FEATURE_CONFORMANCE: "validateFeatureChainExpressionFeatureConformance",
    INVALID_FEATURE_CONSTANT_IS_VARIABLE: "validateFeatureConstantIsVariable",
    INVALID_FEATURE_CROSSING_SPECIALIZATION: "checkFeatureCrossingSpecialization",
    INVALID_FEATURE_CROSS_FEATURE_SPECIALIZATION: "validateFeatureCrossFeatureSpecialization",
    INVALID_FEATURE_CROSS_FEATURE_TYPE: "validateFeatureCrossFeatureType",
    INVALID_FEATURE_END_FEATURE_MULTIPLICITY: "validateFeatureEndFeatureMultiplicity",
    INVALID_FEATURE_END_IS_CONSTANT: "validateFeatureEndIsConstant",
    INVALID_FEATURE_END_NOT_DERIVED_ABSTRACT_COMPOSITE_OR_PORTION: "validateFeatureEndNotDerivedAbstractCompositeOrPortion",
    INVALID_FEATURE_END_NO_DIRECTION: "validateFeatureEndNoDirection",
    INVALID_FEATURE_HAS_TYPE: "validateFeatureHasType_",
    INVALID_FEATURE_IS_VARIABLE: "validateFeatureIsVariable",
    INVALID_FEATURE_MULTIPLICITY_DOMAIN: "validateFeatureMultiplicityDomain",
    INVALID_FEATURE_OWNED_CROSS_SUBSETTING: "validateFeatureOwnedCrossSubsetting",
    INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING: "validateFeatureOwnedReferenceSubsetting",
    INVALID_FEATURE_PORTION_NOT_VARIABLE: "validateFeaturePortionNotVariable",
    INVALID_FEATURE_REFERENCE_EXPRESSION_REFERENT_IS_FEATURE: "validateFeatureReferenceExpressionReferentIsFeature",
    INVALID_FEATURE_REFERENCE_EXPRESSION_RESULT: "validateFeatureReferenceExpressionResult",
    INVALID_FEATURE_VALUE_IS_INITIAL: "validateFeatureValueIsInitial",
    INVALID_FEATURE_VALUE_OVERRIDING: "validateFeatureValueOverriding",

    // SUBSETTING
    INVALID_SUBSETTING_CONSTANT_CONFORMANCE: "validateSubsettingConstantConformance",
    INVALID_SUBSETTING_FEATURING_TYPES: "validateSubsettingFeaturingTypes",
    INVALID_SUBSETTING_MULTIPLICITY_CONFORMANCE: "validateSubsettingMultiplicityConformance",
    INVALID_SUBSETTING_PORTION_CONFORMANCE: "validateSubsettingPortionConformance",
    INVALID_SUBSETTING_UNIQUENESS_CONFORMANCE: "validateSubsettingUniquenessConformance",

    // REDEFINITION
    INVALID_REDEFINITION_DIRECTION_CONFORMANCE: "validateRedefinitionDirectionConformance",
    INVALID_REDEFINITION_END_CONFORMANCE: "validateRedefinitionEndConformance",
    INVALID_REDEFINITION_FEATURING_TYPES: "validateRedefinitionFeaturingTypes",
    INVALID_REDEFINITION_MULTIPLICITY_CONFORMANCE: "validateRedefinitionMultiplicityConformance",

    // MULTIPLICITY
    INVALID_MULTIPLICITY_RANGE_BOUNDS: "validateMultiplicityRangeBounds",
    INVALID_MULTIPLICITY_RANGE_BOUND_RESULT_TYPES: "validateMultiplicityRangeResultTypes",

    // CONNECTOR
    INVALID_CONNECTOR_BINARY_SPECIALIZATION: "validateConnectorBinarySpecialization",
    INVALID_CONNECTOR_RELATED_FEATURES: "validateConnectorRelatedFeatures",
    INVALID_CONNECTOR_TYPE_FEATURING: "validateConnectorTypeFeaturing",

    // BINDING
    INVALID_BINDING_CONNECTOR_ARGUMENT_TYPE_CONFORMANCE: "validateBindingConnectorArgumentTypeConformance",
    INVALID_BINDING_CONNECTOR_IS_BINARY: "validateBindingConnectorIsBinary",
    INVALID_BINDING_CONNECTOR_TYPE_CONFORMANCE: "validateBindingConnectorTypeConformance",

    // BEHAVIOR
    INVALID_BEHAVIOR_SPECIALIZATION: "validateBehaviorSpecialization",

    // FUNCTION
    INVALID_FUNCTION_RESULT_EXPRESSION_MEMBERSHIP: "validateFunctionResultExpressionMembership",
    INVALID_FUNCTION_RESULT_PARAMETER_MEMBERSHIP: "validateFunctionResultParameterMembership",

    // EXPRESSION
    INVALID_EXPRESSION_RESULT_EXPRESSION_MEMBERSHIP: "validateExpressionResultExpressionMembership",
    INVALID_EXPRESSION_RESULT_PARAMETER_MEMBERSHIP: "validateExpressionResultParameterMembership",

    // INVOCATION
    INVALID_INVOCATION_EXPRESSION_INSTANTIATED_TYPE: "validateInvocationExpressionInstantiatedType",
    INVALID_INVOCATION_EXPRESSION_NO_DUPLICATE_PARAMETER_REDEFINITION: "validateInvocationExpressionNoDuplicateParameterRedefinition",
    INVALID_INVOCATION_EXPRESSION_OWNED_FEATURES: "validateInvocationExpressionOwnedFeatures",
    INVALID_INVOCATION_EXPRESSION_PARAMETER_REDEFINITION: "validateInvocationExpressionParameterRedefinition",

    // OPERATOR
    INVALID_OPERATOR_EXPRESSION_BRACKET_OPERATOR: "validateOperatorExpressionBracketOperator_",
    INVALID_OPERATOR_EXPRESSION_CAST_CONFORMANCE_TYPE: "validateOperatorExpressionCastConformance",
    INVALID_OPERATOR_EXPRESSION_QUANTITY: "validateOperatorExpressionQuantity",

    // CONSTRUCTOR
    INVALID_CONSTRUCTOR_EXPRESSION_NO_DUPLICATE_FEATURE_REDEFINITION: "validateConstructorExpressionNoDuplicateFeatureRedefinition",
    INVALID_CONSTRUCTOR_EXPRESSION_OWNED_FEATURES: "validateConstructorExpressionOwnedFeatures",
    INVALID_CONSTRUCTOR_EXPRESSION_RESULT_FEATURE_REDEFINITION: "checkConstructorExpressionResultFeatureRedefinition",

    // METADATA
    INVALID_METADATA_FEATURE_ANNOTATED_ELEMENT: "validateMetadataFeatureAnnotatedElement",
    INVALID_METADATA_FEATURE_BODY: "invalidateMetadataFeatureBody",
    INVALID_METADATA_FEATURE_METACLASS: "validateMetadataFeatureMetadata",
    INVALID_METADATA_FEATURE_METACLASS_NOT_ABSTRACT: "validateMetadataFeatureMetadataNotAbstract",
    INVALID_METADATA_USAGE_TYPE: "validateMetadataUsageType_",

    // DEFINITION
    INVALID_DEFINITION_VARIATION_IS_ABSTRACT: "validateDefinitionVariationIsAbstract",
    INVALID_DEFINITION_VARIATION_MEMBERSHIP: "validateDefinitionVariationMembership",
    INVALID_DEFINITION_VARIATION_SPECIALIZATION: "validateDefinitionVariationSpecialization",

    // USAGE
    INVALID_USAGE_TYPE: "validateUsageType_",
    INVALID_USAGE_VARIATION_IS_ABSTRACT: "validateUsageVariationIsAbstract",
    INVALID_USAGE_VARIATION_MEMBERSHIP: "validateUsageVariationMembership",
    INVALID_USAGE_VARIATION_SPECIALIZATION: "validateUsageVariationSpecialization",

    // OCCURRENCE
    INVALID_OCCURRENCE_USAGE_INDIVIDUAL_DEFINITION: "validateOccurrenceUsageIndividualDefinition",
    INVALID_OCCURRENCE_USAGE_INDIVIDUAL_USAGE: "validateOccurrenceUsageIndividualUsage",
    INVALID_OCCURRENCE_USAGE_IS_PORTION: "validateOccurrenceUsageIsPortion",
    INVALID_OCCURRENCE_USAGE_PORTION_KIND: "validateOccurrenceUsageIsPortion",
    INVALID_OCCURRENCE_USAGE_TYPE: "validateOccurrenceUsageType_",

    // ITEM
    INVALID_ITEM_DEFINITION_SPECIALIZATION: "validateClassSpecialization",
    INVALID_ITEM_USAGE_TYPE: "validateItemUsageType_",

    // PART
    INVALID_PART_USAGE_PART_DEFINITION: "validatePartUsagePartDefinition",
    INVALID_PART_USAGE_TYPE: "validatePartUsageType_",

    // ATTRIBUTE
    INVALID_ATTRIBUTE_DEFINITION_FEATURES: "validateAttributeDefinitionFeatures",
    INVALID_ATTRIBUTE_DEFINITION_SPECIALIZATION: "validateDataTypeSpecialization",
    INVALID_ATTRIBUTE_USAGE_ENUMERATION_TYPE: "validateAttributeUsageEnumerationType_",
    INVALID_ATTRIBUTE_USAGE_FEATURES: "validateAttributeUsageFeatures",
    INVALID_ATTRIBUTE_USAGE_TYPE: "validateAttributeUsageType_",

    // ENUMERATION
    INVALID_ENUMERATION_USAGE_TYPE: "validateEnumerationUsageType_",

    // PORT
    INVALID_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION: "validatePortDefinitionConjugatedPortDefinition",
    INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE: "validatePortDefinitionOwnedUsagesNotComposite",
    INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE: "validatePortUsageNestedUsagesNotComposite",
    INVALID_PORT_USAGE_TYPE: "validatePortUsageType_",

    // CONNECTION
    INVALID_CONNECTION_USAGE_TYPE: "validateConnectionUsageType_",

    // INTERFACE
    INVALID_INTERFACE_DEFINITION_END: "validateInterfaceDefinitionEnd_",
    INVALID_INTERFACE_USAGE_END: "validateInterfaceUsageEnd_",
    INVALID_INTERFACE_USAGE_TYPE: "validateInterfaceUsageType_",

    // ALLOCATION
    INVALID_ALLOCATION_USAGE_TYPE: "validateAllocationUsageType_",

    // FLOW
    INVALID_FLOW_DEFINITION_END: "validateFlowDefinitionConnectionEnds",
    INVALID_FLOW_END_IMPLICIT_SUBSETTING: "validateFlowEndImplicitSubsetting",
    INVALID_FLOW_END_NESTED_FEATURE: "validateFlowEndNestedFeature",
    INVALID_FLOW_END_OWNING_TYPE: "validateFlowEndOwningType",
    INVALID_FLOW_END_SUBSETTING: "validateFlowEndSubsetting",
    INVALID_FLOW_ITEM_FEATURE: "validateFlowItemFeature",
    INVALID_FLOW_USAGE_TYPE: "validateFlowUsageType_",

    // ACTION
    INVALID_ACTION_USAGE_TYPE: "validateActionUsageType_",

    // CONTROL
    INVALID_CONTROL_NODE_INCOMING_SUCCESSIONS: "validateControlNodeIncomingSuccessions",
    INVALID_CONTROL_NODE_OUTGOING_SUCCESSIONS: "validateControlNodeOutgoingSuccessions",
    INVALID_CONTROL_NODE_OWNING_TYPE: "validateControlNodeOwningType",

    // DECISION
    INVALID_DECISION_NODE_INCOMING_SUCCESSIONS: "validateDecisionNodeIncomingSuccessions",
    INVALID_DECISION_NODE_OUTGOING_SUCCESSIONS: "validateDecisionNodeOutgoingSuccessions",

    // FORK
    INVALID_FORK_NODE_INCOMING_SUCCESSIONS: "validateForkNodeIncomingSuccessions",

    // JOIN
    INVALID_JOIN_NODE_OUTGOING_SUCCESSIONS: "validateJoinNodeOutgoingSuccessions",

    // MERGE
    INVALID_MERGE_NODE_INCOMING_SUCCESSIONS: "validateMergeNodeIncomingSuccessions",
    INVALID_MERGE_NODE_OUTGOING_SUCCESSIONS: "validateMergeNodeOutgoingSuccessions",

    // PERFORM
    INVALID_PERFORM_ACTION_USAGE_REFERENCE: "validatePerformActionUsageReference",

    // SEND
    INVALID_SEND_ACTION_USAGE_PAYLOAD_ARGUMENT: "validateSendActionUsagePayloadArgument",
    INVALID_SEND_ACTION_USAGE_RECEIVER: "validateSendActionUsageReceiver_",

    // ACCEPT
    INVALID_ACCEPT_ACTION_USAGE_PARAMETERS: "validateAcceptActionUsageParameters",

    // ASSIGNMENT
    INVALID_ASSIGNMENT_ACTION_USAGE_ARGUMENTS: "validateAssignmentActionUsageArguments",
    INVALID_ASSIGNMENT_ACTION_USAGE_REFERENT: "validateAssignmentActionUsageReferent",

    // TRIGGER
    INVALID_TRIGGER_INVOCATION_EXPRESSION_AFTER_ARGUMENT: "validateTriggerInvocationActionAfterArgument",
    INVALID_TRIGGER_INVOCATION_EXPRESSION_AT_ARGUMENT: "validateTriggerInvocationActionAtArgument",
    INVALID_TRIGGER_INVOCATION_EXPRESSION_WHEN_ARGUMENT: "validateTriggerInvocationActionWhenArgument",

    // IF
    INVALID_IF_ACTION_USAGE_PARAMETERS: "validateIfActionUsageParameters",

    // WHILE
    INVALID_WHILE_LOOP_ACTION_USAGE_PARAMETERS: "validateWhileLoopActionUsageParameters",

    // FOR
    INVALID_FOR_LOOP_ACTION_USAGE_LOOP_VARIABLE: "validateForLoopActionUsageLoopVariable",
    INVALID_FOR_LOOP_ACTION_USAGE_PARAMETERS: "validateForLoopActionUsageParameters",

    // STATE
    INVALID_STATE_DEFINITION_PARALLEL_SUBACTIONS: "validateStateDefinitionParallelSubactions",
    INVALID_STATE_DEFINITION_SUBACTION_KIND: "validateStateDefinitionSubactionKind",
    INVALID_STATE_SUBACTION_MEMBERSHIP_OWNING_TYPE: "validateStateSubactionMembershioOwningType",
    INVALID_STATE_USAGE_PARALLEL_SUBACTIONS: "validateStateUsageParallelSubactions",
    INVALID_STATE_USAGE_SUBACTION_KIND: "validateStateUsageSubactionKind",
    INVALID_STATE_USAGE_TYPE: "validateStateUsageType_",

    // TRANSITION
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_EFFECT_ACTION: "validateTransitionFeatureMembershipEffectAction",
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_GUARD_EXPRESSION: "validateTransitionFeatureMembershipGuardExpression",
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_OWNING_TYPE: "validateTransitionFeatureMembershipOwningType",
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_TRIGGER_ACTION: "validateTransitionFeatureMembershipTriggerAction",
    INVALID_TRANSITION_USAGE_PARAMETERS: "validateTransitionUsageParameters",
    INVALID_TRANSITION_USAGE_SUCCESSION: "validateTransitionUsageSuccession",
    INVALID_TRANSITION_USAGE_TRIGGER_ACTIONS: "validateTransitionUsageTriggerActions",

    // EXHIBIT
    INVALID_EXHIBIT_STATE_USAGE_REFERENCE: "validateExhibitStateUsageReference",

    // CALCULATION
    INVALID_CALCULATION_USAGE_TYPE: "validateCalculationUsageType_",

    // CONSTRAINT
    INVALID_CONSTRAINT_USAGE_TYPE: "Invalid Constraint Usage - invalid type",

    // ASSERT
    INVALID_ASSERT_CONSTRAINT_USAGE_REFERENCE: "validateAssertConstraintUsageReference",

    // REQUIREMENT
    INVALID_REQUIREMENT_CONSTRAINT_MEMBERSHIP_IS_COMPOSITE: "validateRequirementConstraintMembershipIsComposite",
    INVALID_REQUIREMENT_CONSTRAINT_MEMBERSHIP_OWNING_TYPE: "validateRequirementConstraintMembershipOwningType",
    INVALID_REQUIREMENT_DEFINITION_ONLY_ONE_SUBJECT: "validateRequirementDefinitionOnlyOneSubject",
    INVALID_REQUIREMENT_DEFINITION_SUBJECT_PARAMETER_POSITION: "validateRequirementDefinitionSubjectParameterPosition",
    INVALID_REQUIREMENT_USAGE_ONLY_ONE_SUBJECT: "validateRequirementUsageOnlyOneSubject",
    INVALID_REQUIREMENT_USAGE_SUBJECT_PARAMETER_POSITION: "validateRequirementUsageSubjectParameterPosition",
    INVALID_REQUIREMENT_USAGE_TYPE: "validateRequirementUsageType_",
    INVALID_REQUIREMENT_VERIFICATION_MEMBERSHIP_KIND: "validateRequirementVerificationMembershipKind",
    INVALID_REQUIREMENT_VERIFICATION_MEMBERSHIP_OWNING_TYPE: "validateRequirementVerificationMembershipOwningType",

    // FRAMED
    INVALID_FRAMED_CONCERN_MEMBERSHIP_CONSTRAINT_KIND: "validateFramedConcernMembershipConstraintKind",

    // STAKEHOLDER
    INVALID_STAKEHOLDER_MEMBERSHIP_OWNING_TYPE: "validateStakeholderMembershipOwningType",

    // SUBJECT
    INVALID_SUBJECT_MEMBERSHIP_OWNING_TYPE: "validateSubjectMembershipOwningType",

    // ACTOR
    INVALID_ACTOR_MEMBERSHIP_OWNING_TYPE: "validateActorMembershipOwningType",

    // SATISFY
    INVALID_SATISFY_REQUIREMENT_USAGE_REFERENCE: "validateSatisfyRequirementUsageReference",

    // CASE
    INVALID_CASE_DEFINITION_ONLY_ONE_OBJECTIVE: "validateCaseDefinitionOnlyOneObjective",
    INVALID_CASE_DEFINITION_ONLY_ONE_SUBJECT: "validateCaseDefinitionOnlyOneSubject",
    INVALID_CASE_DEFINITION_SUBJECT_PARAMETER_POSITION: "validateCaseDefinitionSubjectParameterPosition",
    INVALID_CASE_USAGE_ONLY_ONE_OBJECTIVE: "validateCaseUsageOnlyOneObjective",
    INVALID_CASE_USAGE_ONLY_ONE_SUBJECT: "validateCaseUsageOnlyOneSubject",
    INVALID_CASE_USAGE_SUBJECT_PARAMETER_POSITION: "validateCaseUsageSubjectParameterPosition",
    INVALID_CASE_USAGE_TYPE: "validateCaseUsageType_",

    // ANALYSIS
    INVALID_ANALYSIS_CASE_USAGE_TYPE: "validateAnalysisCaseUsageType_",

    // VERIFICATION
    INVALID_VERIFICATION_CASE_USAGE_TYPE: "validateVerificationCaseUsageType_",

    // OBJECTIVE
    INVALID_OBJECTIVE_MEMBERSHIP_IS_COMPOSITE: "validateObjectiveMembershipIsComposite",
    INVALID_OBJECTIVE_MEMBERSHIP_OWNING_TYPE: "validateObjectiveMembershipOwningType",

    // INCLUDE
    INVALID_INCLUDE_USE_CASE_USAGE_REFERENCE: "validateIncludeUseCaseUsageReference",

    // VIEW
    INVALID_VIEW_DEFINITION_ONLY_ONE_VIEW_RENDERING: "validateViewDefinitionOnlyOnvViewRendering",
    INVALID_VIEW_RENDERING_MEMBERSHIP_OWNING_TYPE: "validateViewRenderingMembershipOwningType",
    INVALID_VIEW_USAGE_ONLY_ONE_RENDERING: "validateViewUsageOnlyOneRendering",
    INVALID_VIEW_USAGE_TYPE: "validateViewUsageType_",

    // VIEWPOINT
    INVALID_VIEWPOINT_USAGE_TYPE: "validateViewpointUsageType_",

    // RENDERING
    INVALID_RENDERING_USAGE_TYPE: "validateRenderingUsageType_",

    // EXPOSE
    INVALID_EXPOSE_IS_IMPORT_ALL: "validateExposeIsImportAll",
    INVALID_EXPOSE_IS_OWNING_NAMESPACE: "validateExposeIsImportAll",

    // CONJUGATED
    INVALID_CONJUGATED_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION: "validateConjugatedPortDefinitionConjugatedPortDefinition",
    INVALID_CONJUGATED_PORT_DEFINITION_ORIGINAL_PORT_DEFINITION: "validateConjugatedPortDefinitionConjugatedPortDefinition",

    // CROSS
    INVALID_CROSS_SUBSETTING_CROSSED_FEATURE: "validateCrossSubsettingCrossedFeature",
    INVALID_CROSS_SUBSETTING_CROSSING_FEATURE: "validateCrossSubsettingCrossingFeature",

    // DATA
    INVALID_DATA_TYPE_SPECIALIZATION: "validateDataTypeSpecialization",

    // EVENT
    INVALID_EVENT_OCCURRENCE_USAGE_REFERENCE: "validateEventOccurrenceUsageReferent",

    // INSTANTIATION
    INVALID_INSTANTIATION_EXPRESSION_INSTANTIATED_TYPE: "validateInstantiationExpressionInstantiatedType",
    INVALID_INSTANTIATION_EXPRESSION_RESULT: "validateInstantiationExpressionResult",

    // LIBRARY
    INVALID_LIBRARY_PACKAGE_NOT_STANDARD: "validateLibraryPackageNotStandard_",

    // PARAMETER
    INVALID_PARAMETER_MEMBERSHIP_OWNING_TYPE: "validateParameterMembershipOwningType",

    // RESULT
    INVALID_RESULT_EXPRESSION_MEMBERSHIP_OWNING_TYPE: "validateResultExpressionMembershipOwningType",

    // RETURN
    INVALID_RETURN_PARAMETER_MEMBERSHIP_OWNING_TYPE: "validateReturnParameterMembershipOwningType",

    // USE
    INVALID_USE_CASE_USAGE_REFERENCE: "validateUseCaseUsageReference",
    INVALID_USE_CASE_USAGE_TYPE: "validateUseCaseUsageType_",

    // VARIANT
    INVALID_VARIANT_MEMBERSHIP_OWNING_NAMESPACE: "validateVariationMembershipOwningNamespace",

    // ========================================================================
    // MESSAGES
    // User-facing error messages
    // ========================================================================

    // ELEMENT Messages
    INVALID_ELEMENT_FILTER_MEMBERSHIP_IS_BOOLEAN_MSG: "Must have a Boolean result",
    INVALID_ELEMENT_FILTER_MEMBERSHIP_IS_MODEL_LEVEL_EVALUABLE_MSG: "Must be model-level evaluable",
    INVALID_ELEMENT_IS_IMPLIED_INCLUDED_MSG: "Element cannot have implied relationships included",

    // ANNOTATION Messages
    INVALID_ANNOTATION_ANNOTATED_ELEMNT_OWNERSHIP_MSG_1: "Must own its annotating element",
    INVALID_ANNOTATION_ANNOTATED_ELEMNT_OWNERSHIP_MSG_2: "Must be owned by its annotated element",
    INVALID_ANNOTATION_ANNOTATING_ELEMENT_MSG: "Must either own or be owned by its annotating element",

    // NAMESPACE Messages
    INVALID_NAMESPACE_DISTINGUISHABILITY_MSG: "Duplicate of other owned member name",
    INVALID_NAMESPACE_DISTINGUISHABILITY_MSG_0: "Duplicate of owned member name",
    INVALID_NAMESPACE_DISTINGUISHABILITY_MSG_1: "Duplicate of other alias name",
    INVALID_NAMESPACE_DISTINGUISHABILITY_MSG_2: "Duplicate of inherited member name",

    // IMPORT Messages
    INVALID_IMPORT_TOP_LEVEL_VISIBILITY_MSG: "Top level import must be private",

    // SPECIALIZATION Messages
    INVALID_SPECIALIZATION_SPECIFIC_NOT_CONJUGATED_MSG: "Conjugated type cannot be a specialized type",

    // TYPE Messages
    INVALID_TYPE_AT_MOST_ONE_CONJUGATOR_MSG: "Cannot have more than one conjugator",
    INVALID_TYPE_DIFFERENCING_TYPES_NOT_SELF_MSG: "Type cannot difference with itself",
    INVALID_TYPE_INTERSECTING_TYPES_NOT_SELF_MSG: "Type cannot intersect with itself",
    INVALID_TYPE_OWNED_DIFFERENCING_NOT_ONE_MSG: "Cannot have only one differencing",
    INVALID_TYPE_OWNED_INTERSECTING_NOT_ONE_MSG: "Cannot have only one intersecting",
    INVALID_TYPE_OWNED_MULTIPLICITY_MSG: "Only one multiplicity is allowed",
    INVALID_TYPE_OWNED_UNIONING_NOT_ONE_MSG: "Cannot have only one unioning",
    INVALID_TYPE_UNIONING_TYPES_NOT_SELF_MSG: "Type cannot union with itself",

    // CLASSIFIER Messages
    INVALID_CLASSIFIER_DEFAULT_SUPERTYPE_MSG: "Must directly or indirectly specialize {supertype}",
    INVALID_CLASSIFIER_MULTIPLICITY_DOMAIN_MSG: "Multiplicity must not have a featuring type",

    // CLASS Messages
    INVALID_CLASS_SPECIALIZATION_MSG: "Cannot specialize data type or association",

    // STRUCTURE Messages
    INVALID_STRUCTURE_SPECIALIZATION_MSG: "Cannot specialize behavior",

    // ASSOCIATION Messages
    INVALID_ASSOCIATION_BINARY_SPECIALIZATION_MSG: "Cannot have more than two ends",
    INVALID_ASSOCIATION_END_TYPES_MSG: "An association end must have exactly one type",
    INVALID_ASSOCIATION_RELATED_TYPES_MSG: "Must have at least two related elements",
    INVALID_ASSOCIATION_STRUCTURE_INTERSECTION_MSG: "Must be an association structure",

    // FEATURE Messages
    INVALID_FEATURE_CHAINING_FEATURES_NOT_SELF_MSG: "Feature cannot have itself in a feature chain",
    INVALID_FEATURE_CHAINING_FEATURE_NOT_ONE_MSG: "Cannot have only one chaining feature",
    INVALID_FEATURE_CHAINING__FEATURE_CONFORMANCE_MSG: "Must be a valid feature",
    INVALID_FEATURE_CHAIN_EXPRESSION_FEATURE_CONFORMANCE_MSG: "Must be a valid feature",
    INVALID_FEATURE_CONSTANT_IS_VARIABLE_MSG: "Only a variable feature can be constant",
    INVALID_FEATURE_CROSSING_SPECIALIZATION_MSG: "Must be the cross feature",
    INVALID_FEATURE_CROSS_FEATURE_SPECIALIZATION_MSG: "Cross feature must specialized redefined-end cross features",
    INVALID_FEATURE_CROSS_FEATURE_TYPE_MSG: "Cross feature must have same type as feature",
    INVALID_FEATURE_END_FEATURE_MULTIPLICITY_MSG: "End feature must have multiplicity 1",
    INVALID_FEATURE_END_IS_CONSTANT_MSG: "End feature must be constant",
    INVALID_FEATURE_END_NOT_DERIVED_ABSTRACT_COMPOSITE_OR_PORTION_MSG: "End feature cannot be derived, abstract, composite or portion",
    INVALID_FEATURE_END_NO_DIRECTION_MSG: "End feature cannot have direction",
    INVALID_FEATURE_HAS_TYPE_MSG: "Features must have at least one type",
    INVALID_FEATURE_IS_VARIABLE_MSG: "Must be owned by an occurrence type",
    INVALID_FEATURE_MULTIPLICITY_DOMAIN_MSG: "Multiplicity must have same featuring types as it feature",
    INVALID_FEATURE_OWNED_CROSS_SUBSETTING_MSG: "At most one cross subsetting is allowed",
    INVALID_FEATURE_OWNED_REFERENCE_SUBSETTING_MSG: "At most one reference subsetting is allowed",
    INVALID_FEATURE_PORTION_NOT_VARIABLE_MSG: "A portion cannot be variable",
    INVALID_FEATURE_REFERENCE_EXPRESSION_REFERENT_IS_FEATURE_MSG: "Must be a valid feature",
    INVALID_FEATURE_REFERENCE_EXPRESSION_RESULT_MSG: "Must own its result parameter",
    INVALID_FEATURE_VALUE_IS_INITIAL_MSG: "Initialized feature must be variable",
    INVALID_FEATURE_VALUE_OVERRIDING_MSG: "Cannot override a binding feature value",

    // SUBSETTING Messages
    INVALID_SUBSETTING_CONSTANT_CONFORMANCE_MSG: "Subsetting/redefining feature must be constant if subsetted/redefined feature is constant",
    INVALID_SUBSETTING_FEATURING_TYPES_MSG: "Must be an accessible feature (use dot notation for nesting)",
    INVALID_SUBSETTING_MULTIPLICITY_CONFORMANCE_MSG: "Subsetting/redefining feature should not have larger multiplicity upper bound",
    INVALID_SUBSETTING_PORTION_CONFORMANCE_MSG: "Subsetting/redefining feature must be portion if subsetted/redefined feature is portion",
    INVALID_SUBSETTING_UNIQUENESS_CONFORMANCE_MSG: "Subsetting/redefining feature cannot be nonunique if subsetted/redefined feature is unique",

    // REDEFINITION Messages
    INVALID_REDEFINITION_DIRECTION_CONFORMANCE_MSG: "Redefining feature must have a compatible direction",
    INVALID_REDEFINITION_END_CONFORMANCE_MSG: "Redefining feature must be an end feature",
    INVALID_REDEFINITION_FEATURING_TYPES_MSG_1: "A package-level feature cannot be redefined",
    INVALID_REDEFINITION_FEATURING_TYPES_MSG_2: "Featuring types of redefining feature and redefined feature cannot be the same",
    INVALID_REDEFINITION_MULTIPLICITY_CONFORMANCE_MSG: "Redefining feature should not have smaller multiplicity lower bound",

    // MULTIPLICITY Messages
    INVALID_MULTIPLICITY_RANGE_BOUNDS_MSG: "Bound expressions must be first two owned members",
    INVALID_MULTIPLICITY_RANGE_BOUND_RESULT_TYPES_MSG: "Must have a Natural value",

    // CONNECTOR Messages
    INVALID_CONNECTOR_BINARY_SPECIALIZATION_MSG: "Cannot have more than two ends",
    INVALID_CONNECTOR_RELATED_FEATURES_MSG: "Must have at least two related elements",
    INVALID_CONNECTOR_TYPE_FEATURING_MSG: "Must be an accessible feature (use dot notation for nesting)",

    // BINDING Messages
    INVALID_BINDING_CONNECTOR_ARGUMENT_TYPE_CONFORMANCE_MSG: "Output feature must conform to input feature",
    INVALID_BINDING_CONNECTOR_IS_BINARY_MSG: "Binding connector must be binary",
    INVALID_BINDING_CONNECTOR_TYPE_CONFORMANCE_MSG: "Bound features should have conforming types",

    // BEHAVIOR Messages
    INVALID_BEHAVIOR_SPECIALIZATION_MSG: "Cannot specialize structure",

    // FUNCTION Messages
    INVALID_FUNCTION_RESULT_EXPRESSION_MEMBERSHIP_MSG: "Only one (owned or inherited) result expression is allowed",
    INVALID_FUNCTION_RESULT_PARAMETER_MEMBERSHIP_MSG: "Only one return parameter is allowed",

    // EXPRESSION Messages
    INVALID_EXPRESSION_RESULT_EXPRESSION_MEMBERSHIP_MSG: "Only one (owned or inherited) result expression is allowed",
    INVALID_EXPRESSION_RESULT_PARAMETER_MEMBERSHIP_MSG: "Only one return parameter is allowed",

    // INVOCATION Messages
    INVALID_INVOCATION_EXPRESSION_INSTANTIATED_TYPE_MSG: "Must invoke a behavior or a behavioral feature",
    INVALID_INVOCATION_EXPRESSION_NO_DUPLICATE_PARAMETER_REDEFINITION_MSG: "Parameter already bound",
    INVALID_INVOCATION_EXPRESSION_OWNED_FEATURES_MSG: "Must be an in parameter",
    INVALID_INVOCATION_EXPRESSION_PARAMETER_REDEFINITION_MSG: "Must correspond to one input parameter of the invoked type",

    // OPERATOR Messages
    INVALID_OPERATOR_EXPRESSION_BRACKET_OPERATOR_MSG: "Use #(...) for indexing",
    INVALID_OPERATOR_EXPRESSION_CAST_CONFORMANCE_MSG: "Cast argument should have conforming types",
    INVALID_OPERATOR_EXPRESSION_QUANTITY_MSG: "Should be a measurement reference (unit).",

    // CONSTRUCTOR Messages
    INVALID_CONSTRUCTOR_EXPRESSION_NO_DUPLICATE_FEATURE_REDEFINITION_MSG: "Feature already bound",
    INVALID_CONSTRUCTOR_EXPRESSION_OWNED_FEATURES_MSG: "Owned feature not allowed",
    INVALID_CONSTRUCTOR_EXPRESSION_RESULT_FEATURE_REDEFINITION_MSG: "Must correspond to one feature of the instantiated type",

    // METADATA Messages
    INVALID_METADATA_FEATURE_ANNOTATED_ELEMENT_MSG: "Cannot annotate {metaclass}",
    INVALID_METADATA_FEATURE_BODY_MSG_1: "Must redefine an owning-type feature",
    INVALID_METADATA_FEATURE_BODY_MSG_2: "Must be model-level evaluable",
    INVALID_METADATA_FEATURE_METACLASS_MSG: "Must have exactly one metaclass",
    INVALID_METADATA_FEATURE_METACLASS_NOT_ABSTRACT_MSG: "Must have a concrete type",
    INVALID_METADATA_USAGE_TYPE_MSG: "A metadata usage must be typed by one metadata definition.",

    // DEFINITION Messages
    INVALID_DEFINITION_VARIATION_IS_ABSTRACT_MSG: "A variation must be abstract.",
    INVALID_DEFINITION_VARIATION_MEMBERSHIP_MSG: "An owned usage of a variation must be a variant.",
    INVALID_DEFINITION_VARIATION_SPECIALIZATION_MSG: "A variation must not specialize another variation.",

    // USAGE Messages
    INVALID_USAGE_TYPE_MSG: "A usage must be typed by definitions.",
    INVALID_USAGE_VARIATION_IS_ABSTRACT_MSG: "A variation must be abstract.",
    INVALID_USAGE_VARIATION_MEMBERSHIP_MSG: "An owned usage of a variation must be a variant.",
    INVALID_USAGE_VARIATION_SPECIALIZATION_MSG: "A variation must not specialize another variation.",

    // OCCURRENCE Messages
    INVALID_OCCURRENCE_USAGE_INDIVIDUAL_DEFINITION_MSG: "At most one individual definition is allowed.",
    INVALID_OCCURRENCE_USAGE_INDIVIDUAL_USAGE_MSG: "An individual must be typed by one individual definition.",
    INVALID_OCCURRENCE_USAGE_IS_PORTION_MSG: "Must be a portion.",
    INVALID_OCCURRENCE_USAGE_PORTION_KIND_MSG: "Must be owned by an occurrence definition or usage.",
    INVALID_OCCURRENCE_USAGE_TYPE_MSG: "An occurrence, item or part must be typed by occurrence definitions.",

    // ITEM Messages
    INVALID_ITEM_DEFINITION_SPECIALIZATION_MSG: "Cannot specialize attribute definition",
    INVALID_ITEM_USAGE_TYPE_MSG: "An item must be typed by item definitions.",

    // PART Messages
    INVALID_PART_USAGE_PART_DEFINITION_MSG: "A part must be typed by at least one part definition.",
    INVALID_PART_USAGE_TYPE_MSG: "A part must be typed by item definitions.",

    // ATTRIBUTE Messages
    INVALID_ATTRIBUTE_DEFINITION_FEATURES_MSG: "Features of an attribute definition must be referential.",
    INVALID_ATTRIBUTE_DEFINITION_SPECIALIZATION_MSG: "Cannot specialize item definition",
    INVALID_ATTRIBUTE_USAGE_ENUMERATION_TYPE_MSG: "An enumeration attribute cannot have more than one type.",
    INVALID_ATTRIBUTE_USAGE_FEATURES_MSG: "Features of an attribute usage must be referential.",
    INVALID_ATTRIBUTE_USAGE_MSG: "An attribute must be typed by attribute definitions.",

    // ENUMERATION Messages
    INVALID_ENUMERATION_USAGE_TYPE_MSG: "An enumeration must be typed by one enumeration definition.",

    // PORT Messages
    INVALID_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION_MSG: "A port definition must have a conjugated port definition.",
    INVALID_PORT_DEFINITION_OWNED_USAGES_NOT_COMPOSITE_MSG: "Owned usages of a port definition (other than ports) must be referential.",
    INVALID_PORT_USAGE_NESTED_USAGES_NOT_COMPOSITE_MSG: "Nested usages of a port usage (other than ports) must be referential.",
    INVALID_PORT_USAGE_TYPE_MSG: "A port must be typed by port definitions.",

    // CONNECTION Messages
    INVALID_CONNECTION_USAGE_TYPE_MSG: "A connection must be typed by connection definitions.",

    // INTERFACE Messages
    INVALID_INTERFACE_DEFINITION_END_MSG: "An interface definition end must be a port.",
    INVALID_INTERFACE_USAGE_END_MSG: "An interface end must be a port.",
    INVALID_INTERFACE_USAGE_TYPE_MSG: "An interface must be typed by interface definitions.",

    // ALLOCATION Messages
    INVALID_ALLOCATION_USAGE_TYPE_MSG: "An allocation must be typed by allocation definitions.",

    // FLOW Messages
    INVALID_FLOW_DEFINITION_END_MSG: "A flow connection definition can have at most two ends.",
    INVALID_FLOW_END_IMPLICIT_SUBSETTING_MSG: "Flow ends should use dot notation",
    INVALID_FLOW_END_NESTED_FEATURE_MSG: "Flow end must have a nested input or output feature",
    INVALID_FLOW_END_OWNING_TYPE_MSG: "Flow end not allowed",
    INVALID_FLOW_END_SUBSETTING_MSG: "Cannot identify flow end (use dot notation)",
    INVALID_FLOW_ITEM_FEATURE_MSG: "Only one item feature is allowed",
    INVALID_FLOW_USAGE_TYPE_MSG: "A flow connection must be typed by flow connection definitions.",

    // ACTION Messages
    INVALID_ACTION_USAGE_TYPE_MSG: "An action must be typed by action definitions.",

    // CONTROL Messages
    INVALID_CONTROL_NODE_INCOMING_SUCCESSIONS_MSG: "Incoming successions must have target multiplicity 1.",
    INVALID_CONTROL_NODE_OUTGOING_SUCCESSIONS_MSG: "Outgoing successions must have source multiplicity 1.",
    INVALID_CONTROL_NODE_OWNING_TYPE_MSG: "A control node must be owned by an action definition or usage.",

    // DECISION Messages
    INVALID_DECISION_NODE_INCOMING_SUCCESSIONS_MSG: "Must have at most one incoming succession.",
    INVALID_DECISION_NODE_OUTGOING_SUCCESSIONS_MSG: "Outgoing successions must have target multiplicity 0..1.",

    // FORK Messages
    INVALID_FORK_NODE_INCOMING_SUCCESSIONS_MSG: "Must have at most one incoming succession.",

    // JOIN Messages
    INVALID_JOIN_NODE_OUTGOING_SUCCESSIONS_MSG: "Must have at most one outgoing succession.",

    // MERGE Messages
    INVALID_MERGE_NODE_INCOMING_SUCCESSIONS_MSG: "Incoming successions must have source multiplicity 0..1.",
    INVALID_MERGE_NODE_OUTGOING_SUCCESSIONS_MSG: "Must have at most one outgoing succession.",

    // PERFORM Messages
    INVALID_PERFORM_ACTION_USAGE_REFERENCE_MSG: "Must reference an action.",

    // SEND Messages
    INVALID_SEND_ACTION_USAGE_PAYLOAD_ARGUMENT_MSG: "A send action must have a payload.",
    INVALID_SEND_ACTION_USAGE_RECEIVER_MSG: "Sending to a port should generally use ",

    // ACCEPT Messages
    INVALID_ACCEPT_ACTION_USAGE_PARAMETERS_MSG: "An accept action must have a payload parameter.",

    // ASSIGNMENT Messages
    INVALID_ASSIGNMENT_ACTION_USAGE_ARGUMENTS_MSG: "An assignment must have two arguments.",
    INVALID_ASSIGNMENT_ACTION_USAGE_REFERENT_MSG: "An assignment must have a referent.",

    // TRIGGER Messages
    INVALID_TRIGGER_INVOCATION_EXPRESSION_AFTER_ARGUMENT_MSG: "An after expression must be a DurationValue.",
    INVALID_TRIGGER_INVOCATION_EXPRESSION_AT_ARGUMENT_MSG: "An at expression must be a TimeInstantValue.",
    INVALID_TRIGGER_INVOCATION_EXPRESSION_WHEN_ARGUMENT_MSG: "A when expression must be Boolean.",

    // IF Messages
    INVALID_IF_ACTION_USAGE_PARAMETERS_MSG: "An if action must have at least two parameters.",

    // WHILE Messages
    INVALID_WHILE_LOOP_ACTION_USAGE_PARAMETERS_MSG: "A while loop action must have at least two parameters.",

    // FOR Messages
    INVALID_FOR_LOOP_ACTION_USAGE_LOOP_VARIABLE_MSG: "A for loop action must have a loop variable.",
    INVALID_FOR_LOOP_ACTION_USAGE_PARAMETERS_MSG: "A for loop action must have two parameters.",

    // STATE Messages
    INVALID_STATE_DEFINITION_PARALLEL_SUBACTIONS_MSG: "A parallel state cannot have successions or transitions.",
    INVALID_STATE_SUBACTION_KIND_DO_MSG: "A state may have at most one do action.",
    INVALID_STATE_SUBACTION_KIND_ENTRY_MSG: "A state may have at most one entry action.",
    INVALID_STATE_SUBACTION_KIND_EXIT_MSG: "A state may have at most one exit action.",
    INVALID_STATE_SUBACTION_MEMBERSHIP_OWNING_TYPE_MSG: "Only a state can have an entry, do or exit action.",
    INVALID_STATE_USAGE_PARALLEL_SUBACTIONS_MSG: "A parallel state cannot have successions or transitions.",
    INVALID_STATE_USAGE_TYPE_MSG: "A state must be typed by state definitions.",

    // TRANSITION Messages
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_EFFECT_ACTION_MSG: "Must be an action.",
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_GUARD_EXPRESSION_MSG: "Must be a Boolean expression.",
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_OWNING_TYPE_MSG: "Transition feature membership not allowed.",
    INVALID_TRANSITION_FEATURE_MEMBERSHIP_TRIGGER_ACTION_MSG: "Must be an accept action.",
    INVALID_TRANSITION_USAGE_PARAMETERS_MSG_1: "Must have an input parameter.",
    INVALID_TRANSITION_USAGE_PARAMETERS_MSG_2: "Must have two input parameters.",
    INVALID_TRANSITION_USAGE_SUCCESSION_MSG: "A transition must own a succession to its target.",
    INVALID_TRANSITION_USAGE_TRIGGER_ACTIONS_MSG: "A transition with an accepter must have a state as its source.",

    // EXHIBIT Messages
    INVALID_EXHIBIT_STATE_USAGE_REFERENCE_MSG: "Must reference a state.",

    // CALCULATION Messages
    INVALID_CALCULATION_USAGE_TYPE_MSG: "A calculation must be typed by one calculation definition.",

    // CONSTRAINT Messages
    INVALID_CONSTRAINT_USAGE_TYPE_MSG: "A constraint must be typed by one constraint definition.",

    // ASSERT Messages
    INVALID_ASSERT_CONSTRAINT_USAGE_REFERENCE_MSG: "Must reference a constraint.",

    // REQUIREMENT Messages
    INVALID_REQUIREMENT_CONSTRAINT_MEMBERSHIP_IS_COMPOSITE_MSG: "A requirement constraint must be composite.",
    INVALID_REQUIREMENT_CONSTRAINT_MEMBERSHIP_OWNING_TYPE_MSG: "Only requirements can have assumed or required constraints.",
    INVALID_REQUIREMENT_DEFINITION_ONLY_ONE_SUBJECT_MSG: "Only one subject is allowed.",
    INVALID_REQUIREMENT_DEFINITION_SUBJECT_PARAMETER_POSITION_MSG: "Subject must be first parameter.",
    INVALID_REQUIREMENT_USAGE_ONLY_ONE_SUBJECT_MSG: "Only one subject is allowed.",
    INVALID_REQUIREMENT_USAGE_SUBJECT_PARAMETER_POSITION_MSG: "Subject must be first parameter.",
    INVALID_REQUIREMENT_USAGE_TYPE_MSG: "A requirement must be typed by one requirement definition.",
    INVALID_REQUIREMENT_VERIFICATION_MEMBERSHIP_KIND_MSG: "A requirement verification must be a required constraint.",
    INVALID_REQUIREMENT_VERIFICATION_MEMBERSHIP_OWNING_TYPE_MSG: "A requirement verification must be in the objective of a verification case.",

    // FRAMED Messages
    INVALID_FRAMED_CONCERN_MEMBERSHIP_CONSTRAINT_KIND_MSG: "A framed concern must be a required constraint.",

    // STAKEHOLDER Messages
    INVALID_STAKEHOLDER_MEMBERSHIP_OWNING_TYPE_MSG: "Only requirements can have stakeholders.",

    // SUBJECT Messages
    INVALID_SUBJECT_MEMBERSHIP_OWNING_TYPE_MSG: "Only requirements and cases can have subjects.",

    // ACTOR Messages
    INVALID_ACTOR_MEMBERSHIP_OWNING_TYPE_MSG: "Only requirements and cases can have actors.",

    // SATISFY Messages
    INVALID_SATISFY_REQUIREMENT_USAGE_REFERENCE_MSG: "Must reference a requirement.",

    // CASE Messages
    INVALID_CASE_DEFINITION_ONLY_ONE_OBJECTIVE_MSG: "Only one objective is allowed.",
    INVALID_CASE_DEFINITION_ONLY_ONE_SUBJECT_MSG: "Only one subject is allowed.",
    INVALID_CASE_DEFINITION_SUBJECT_PARAMETER_POSITION_MSG: "Subject must be first parameter.",
    INVALID_CASE_USAGE_ONLY_ONE_OBJECTIVE_MSG: "Only one objective is allowed.",
    INVALID_CASE_USAGE_ONLY_ONE_SUBJECT_MSG: "Only one subject is allowed.",
    INVALID_CASE_USAGE_SUBJECT_PARAMETER_POSITION_MSG: "Subject must be first parameter.",
    INVALID_CASE_USAGE_TYPE_MSG: "A case must be typed by one case definition.",

    // ANALYSIS Messages
    INVALID_ANALYSIS_CASE_USAGE_TYPE_MSG: "An analysis case must be typed by one analysis case definition.",

    // VERIFICATION Messages
    INVALID_VERIFICATION_CASE_USAGE_TYPE_MSG: "A verification case must be typed by one verification case definition.",

    // OBJECTIVE Messages
    INVALID_OBJECTIVE_MEMBERSHIP_IS_COMPOSITE_MSG: "An objective must be composite.",
    INVALID_OBJECTIVE_MEMBERSHIP_OWNING_TYPE_MSG: "Only cases can have objectives.",

    // INCLUDE Messages
    INVALID_INCLUDE_USE_CASE_USAGE_REFERENCE_MSG: "Must reference a use case.",

    // VIEW Messages
    INVALID_VIEW_DEFINITION_ONLY_ONE_VIEW_RENDERING_MSG: "A view definition may have at most one view rendering.",
    INVALID_VIEW_RENDERING_MEMBERSHIP_OWNING_TYPE_MSG: "Only views can have view renderings.",
    INVALID_VIEW_USAGE_ONLY_ONE_RENDERING_MSG: "A view may have at most one view rendering.",
    INVALID_VIEW_USAGE_TYPE_MSG: "A view must be typed by one view definition.",

    // VIEWPOINT Messages
    INVALID_VIEWPOINT_USAGE_TYPE_MSG: "A viewpoint must be typed by one viewpoint definition.",

    // RENDERING Messages
    INVALID_RENDERING_USAGE_TYPE_MSG: "A rendering must be typed by one rendering definition.",

    // EXPOSE Messages
    INVALID_EXPOSE_IS_IMPORT_ALL_MSG: "An expose must import all.",
    INVALID_EXPOSE_IS_OWNING_NAMESPACE_MSG: "Only view usages can expose elements.",

    // CONJUGATED Messages
    INVALID_CONJUGATED_PORT_DEFINITION_CONJUGATED_PORT_DEFINITION_MSG: "A conjugated port definition must not have a conjugated port definition.",
    INVALID_CONJUGATED_PORT_DEFINITION_ORIGINAL_PORT_DEFINITION_MSG: "A conjugated port definition must be owned by its original port definition.",

    // CROSS Messages
    INVALID_CROSS_SUBSETTING_CROSSED_FEATURE_MSG: "Cross subsetting must chain through an opposite end feature",
    INVALID_CROSS_SUBSETTING_CROSSING_FEATURE_MSG: "Cross subsetting must be owned by one of two or more end features",

    // DATA Messages
    INVALID_DATA_TYPE_SPECIALIZATION_MSG: "Cannot specialize class or association",

    // EVENT Messages
    INVALID_EVENT_OCCURRENCE_USAGE_REFERENCE_MSG: "Must reference an occurrence.",

    // INSTANTIATION Messages
    INVALID_INSTANTIATION_EXPRESSION_INSTANTIATED_TYPE_MSG: "Must have an invoked/instantiated type",
    INVALID_INSTANTIATION_EXPRESSION_RESULT_MSG: "Must own its result parameter",

    // LIBRARY Messages
    INVALID_LIBRARY_PACKAGE_NOT_STANDARD_MSG: "User library packages should not be marked as standard",

    // PARAMETER Messages
    INVALID_PARAMETER_MEMBERSHIP_OWNING_TYPE_MSG: "Parameter membership not allowed",

    // RESULT Messages
    INVALID_RESULT_EXPRESSION_MEMBERSHIP_OWNING_TYPE_MSG: "Result expression not allowed",

    // RETURN Messages
    INVALID_RETURN_PARAMETER_MEMBERSHIP_OWNING_TYPE_MSG: "Return parameter membership not allowed",

    // USE Messages
    INVALID_USE_CASE_USAGE_REFERENCE_MSG: "Must reference a use case.",
    INVALID_USE_CASE_USAGE_TYPE_MSG: "A use case must be typed by one use case definition.",

    // VARIANT Messages
    INVALID_VARIANT_MEMBERSHIP_OWNING_NAMESPACE_MSG: "A variant must be an owned member of a variation.",

} as const;

// Type for validation codes
export type ValidationCode = keyof typeof ValidationCodes;
