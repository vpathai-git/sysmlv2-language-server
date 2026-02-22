/**
 * Standard Library Configuration
 *
 * Single source of truth for stdlib file ordering and configuration.
 * Used by both workspace-manager.ts (LSP mode) and stdlib-loader.ts (programmatic mode).
 *
 * IMPORTANT: This file lists ALL 94 stdlib files in dependency order.
 * Each layer can be loaded in parallel; layers must be loaded sequentially.
 */

/**
 * Complete SysML v2 Standard Library - 94 files total
 *
 * Files are organized in dependency layers:
 * - KerML foundation (layers 1-11): 36 files
 * - SysML core (layers 12-22): 21 files
 * - Domain libraries (layers 23-36): 37 files
 */
export const STDLIB_DEPENDENCY_LAYERS: readonly string[][] = [
    // =========================================================================
    // KERML FOUNDATION (36 files)
    // =========================================================================

    // Layer 1: Root - No dependencies
    ['Base.kerml'],

    // Layer 2: Data Types - depend on Base
    ['ScalarValues.kerml', 'VectorValues.kerml'],

    // Layer 3: Collections - depends on ScalarValues
    ['Collections.kerml'],

    // Layer 4: Links & Metaobjects - depend on Base
    ['Links.kerml', 'Metaobjects.kerml'],

    // Layer 5: Clocks & Occurrences - depend on Links
    ['Clocks.kerml', 'Occurrences.kerml'],

    // Layer 6: Function Libraries - depend on ScalarValues, Occurrences
    // All 17 function libraries can be loaded together
    [
        'BaseFunctions.kerml',
        'ScalarFunctions.kerml',
        'BooleanFunctions.kerml',
        'ControlFunctions.kerml',
        'IntegerFunctions.kerml',
        'NaturalFunctions.kerml',
        'RealFunctions.kerml',
        'RationalFunctions.kerml',
        'ComplexFunctions.kerml',
        'NumericalFunctions.kerml',
        'TrigFunctions.kerml',
        'StringFunctions.kerml',
        'VectorFunctions.kerml',
        'DataFunctions.kerml',
        'CollectionFunctions.kerml',
        'SequenceFunctions.kerml',
        'OccurrenceFunctions.kerml'
    ],

    // Layer 7: Observation & Spatial - depend on Occurrences
    ['Observation.kerml', 'SpatialFrames.kerml'],

    // Layer 8: Performances & Transfers - depend on Occurrences
    ['Performances.kerml', 'Transfers.kerml'],

    // Layer 9: Objects - depends on Occurrences + Performances
    ['Objects.kerml'],

    // Layer 10: Advanced Behavioral - depend on Performances, Objects
    [
        'ControlPerformances.kerml',
        'FeatureReferencingPerformances.kerml',
        'StatePerformances.kerml',
        'TransitionPerformances.kerml',
        'Triggers.kerml'
    ],

    // Layer 11: KerML aggregation
    ['KerML.kerml'],

    // =========================================================================
    // SYSML CORE LIBRARY (21 files)
    // =========================================================================

    // Layer 12: Metadata foundation
    ['Metadata.sysml'],

    // Layer 13: Items - base for Parts
    ['Items.sysml'],

    // Layer 14: Parts & Ports
    ['Parts.sysml', 'Ports.sysml'],

    // Layer 15: Actions, States, Flows
    ['Actions.sysml', 'States.sysml', 'Flows.sysml'],

    // Layer 16: Connections layer
    ['Interfaces.sysml', 'Connections.sysml', 'Allocations.sysml'],

    // Layer 17: Attributes & Calculations
    ['Attributes.sysml', 'Calculations.sysml', 'Constraints.sysml'],

    // Layer 18: Cases
    ['Cases.sysml'],

    // Layer 19: Case specializations
    ['AnalysisCases.sysml', 'VerificationCases.sysml', 'UseCases.sysml'],

    // Layer 20: Requirements
    ['Requirements.sysml'],

    // Layer 21: Views
    ['Views.sysml', 'StandardViewDefinitions.sysml'],

    // Layer 22: SysML aggregation
    ['SysML.sysml'],

    // =========================================================================
    // DOMAIN LIBRARIES - QUANTITIES & UNITS (18 files)
    // =========================================================================

    // Layer 23: Quantities foundation
    ['Quantities.sysml'],

    // Layer 24: Quantity calculations
    ['QuantityCalculations.sysml', 'TensorCalculations.sysml', 'VectorCalculations.sysml'],

    // Layer 25: Measurement references
    ['MeasurementReferences.sysml', 'MeasurementRefCalculations.sysml'],

    // Layer 26: ISQ Base
    ['ISQBase.sysml'],

    // Layer 27: ISQ Domain-specific (11 files)
    [
        'ISQSpaceTime.sysml',
        'ISQMechanics.sysml',
        'ISQThermodynamics.sysml',
        'ISQElectromagnetism.sysml',
        'ISQLight.sysml',
        'ISQAcoustics.sysml',
        'ISQAtomicNuclear.sysml',
        'ISQChemistryMolecular.sysml',
        'ISQCondensedMatter.sysml',
        'ISQCharacteristicNumbers.sysml',
        'ISQInformation.sysml'
    ],

    // Layer 28: ISQ aggregation
    ['ISQ.sysml'],

    // Layer 29: SI Prefixes
    ['SIPrefixes.sysml'],

    // Layer 30: Units
    ['SI.sysml', 'USCustomaryUnits.sysml'],

    // Layer 31: Time
    ['Time.sysml'],

    // =========================================================================
    // DOMAIN LIBRARIES - ANALYSIS (4 files)
    // =========================================================================

    // Layer 32: Analysis libraries
    ['SampledFunctions.sysml'],
    ['StateSpaceRepresentation.sysml'],
    ['TradeStudies.sysml'],
    ['AnalysisTooling.sysml'],

    // =========================================================================
    // DOMAIN LIBRARIES - OTHER (10 files)
    // =========================================================================

    // Layer 33: Cause and Effect
    ['CauseAndEffect.sysml', 'CausationConnections.sysml'],

    // Layer 34: Spatial Items
    ['SpatialItems.sysml', 'ShapeItems.sysml'],

    // Layer 35: Metadata extensions
    [
        'ModelingMetadata.sysml',
        'ImageMetadata.sysml',
        'ParametersOfInterestMetadata.sysml',
        'RiskMetadata.sysml'
    ],

    // Layer 36: Requirement derivation
    ['RequirementDerivation.sysml', 'DerivationConnections.sysml']
];

/**
 * Total number of stdlib files
 */
export const STDLIB_FILE_COUNT = STDLIB_DEPENDENCY_LAYERS.flat().length;

/**
 * Get all stdlib filenames as a flat array
 */
export function getStdlibFiles(): string[] {
    return STDLIB_DEPENDENCY_LAYERS.flat();
}

/**
 * Check if a filename is a stdlib file
 */
export function isStdlibFile(filename: string): boolean {
    const basename = filename.includes('/') ? filename.split('/').pop()! : filename;
    return getStdlibFiles().includes(basename);
}
