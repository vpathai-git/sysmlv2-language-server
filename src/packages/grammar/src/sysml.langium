/*****************************************************************************
 * SysML v2 Language Server
 * Copyright (c) 2018-2025 Model Driven Solutions, Inc.
 * Copyright (c) 2018 IncQuery Labs Ltd.
 * Copyright (c) 2019 Maplesoft (Waterloo Maple, Inc.)
 * Copyright (c) 2019 Mgnite Inc.
 *    
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * LGPL-3.0-or-later <http://spdx.org/licenses/LGPL-3.0-or-later>
 * 
 * Contributors:
 *  Ed Seidewitz, MDS
 *  Zoltan Kiss, IncQuery
 *  Balazs Grill, IncQuery
 *  Hisashi Miyashita, Maplesoft/Mgnite
 * 
 *****************************************************************************/

grammar SysML
// import \'SysML.interfaces\'  // Disabled: using inferred types

// SysML grammar for .sysml files
// Generated from: Twin project dual language architecture (GRAM-008)
//
// Key features:
// - 'var' is NOT a keyword (only 'constant' in RefPrefix)
// - Feature is NOT directly reachable from PackageMember
// - PackageBody uses PackageMember (not NamespaceMember like KerML)


/* ROOT NAMESPACE */

// === KERML CORE RULES (CONV-006) ===
// Injected from reference grammar - provides Type, Classifier, Metaclass, etc.
// These rules are needed because SysML grammar uses 'with KerML' inheritance
// which Langium doesn't support. The rules enable resolution of cross-references
// like [Type:QualifiedName], [Metaclass:QualifiedName], etc.

// Source: KerML
fragment Identification:
	  '<' declaredShortName = Name '>' ( declaredName = Name )?
	| declaredName = Name
;
// Source: KerML
fragment RelationshipBody:
    ';' | '{' RelationshipOwnedElement* '}'
;
// Source: KerML
fragment RelationshipOwnedElement:
      ownedRelatedElement += OwnedRelatedElement
    | ownedRelationship += OwnedAnnotation
;
// Source: KerML
OwnedRelatedElement:
    {infer Element}
    NonFeatureElement | FeatureElement
;
// Source: KerML
Dependency:
	{infer Dependency}
	( ownedRelationship += PrefixMetadataAnnotation )*
	'dependency' ( Identification? 'from' )?
    client += [Element:QualifiedName] ( ',' client += [Element:QualifiedName] )* 'to'
    supplier += [Element:QualifiedName] ( ',' supplier += [Element:QualifiedName] )*
    RelationshipBody
;
// Source: KerML
Annotation:
	{infer Annotation}
	annotatedElement = [Element:QualifiedName]
;
// Source: KerML
OwnedAnnotation:
	{infer Annotation}
	ownedRelatedElement += AnnotatingElement
;
// Source: KerML
AnnotatingElement:
	  {infer AnnotatingElement}
	  Comment
	| Documentation
	| TextualRepresentation
	| MetadataFeature
;
// Source: KerML
Comment:
	{infer Comment}
	( 'comment' Identification? 
	  ('about' ownedRelationship += Annotation
	     ( ',' ownedRelationship += Annotation )* )? 
	)?
	( 'locale' locale = STRING_VALUE )?
	body = REGULAR_COMMENT
;
// Source: KerML
Documentation:
	{infer Documentation}
	'doc' Identification? 
	( 'locale' locale = STRING_VALUE )?
	body = REGULAR_COMMENT
;
// Source: KerML
TextualRepresentation:
    {infer TextualRepresentation}
    ( 'rep' Identification? )?
    'language' language = STRING_VALUE 
    body = REGULAR_COMMENT
;
// Source: KerML
Namespace:
	{infer Namespace}
	( ownedRelationship += PrefixMetadataMember )*
	NamespaceDeclaration NamespaceBody
;
// Source: KerML
fragment NamespaceDeclaration:
	'namespace' Identification? 
;
// Source: KerML
fragment NamespaceBody:
	  ';' 
	| '{' ( // Note: PackageBodyElement is expanded here to avoid
			// infinite loops in the incremental parser.
		    // GRAM-032: Import first for visibility support
		    ownedRelationship += Import
	      | ownedRelationship += NamespaceMember
	      | ownedRelationship += AliasMember )*
	  '}'
;
// Source: KerML
fragment NamespaceBodyElement:
	// GRAM-032: Import first to catch 'visibility import' patterns
	  ownedRelationship += Import
	| ownedRelationship += NamespaceMember
	| ownedRelationship += AliasMember
;
// Source: KerML
fragment MemberPrefix:
    ( visibility = VisibilityIndicator )?
;
// Source: KerML
NamespaceMember:
	  {infer OwningMembership}
	  NonFeatureMember | NamespaceFeatureMember
;
// Source: KerML
NonFeatureMember:
	{infer OwningMembership}
	MemberPrefix ownedRelatedElement += MemberElement 
;
// Source: KerML
NamespaceFeatureMember:
	{infer OwningMembership}
	MemberPrefix ownedRelatedElement += FeatureElement 
;
// Source: KerML
AliasMember:
	{infer Membership}
	MemberPrefix 
	'alias' ( '<' memberShortName = Name '>' )? ( memberName = Name )?
	'for' memberElement = [Element:QualifiedName]
	RelationshipBody
;
// Source: KerML
// GRAM-032: Visibility is optional in ImportPrefix (defaults to public)
fragment ImportPrefix:
	( visibility = VisibilityIndicator )?
	'import' ( isImportAll ?= 'all' )?
;
// Source: KerML
// GRAM-032: Import rule - no predicate needed since Import is first in alternatives
Import:
	{infer Import}
	( MembershipImport | NamespaceImport )
	RelationshipBody
;
// Source: KerML
// MembershipImport - imports specific membership (no FilterPackage)
MembershipImport:
	{infer MembershipImport}
	ImportPrefix
	ImportedMembership
;
// Source: KerML
fragment ImportedMembership:
	importedMembership = [Membership:QualifiedName]
	( '::' isRecursive ?= '**' )?
;
// Source: KerML
// NamespaceImport - imports namespace or filtered package
// ImportedNamespace first for `import A::*`, FilterPackage for `import A::**[@Filter]`
NamespaceImport:
	{infer NamespaceImport}
	ImportPrefix
	( ImportedNamespace
	| ownedRelatedElement += FilterPackage
	)
;
// Source: KerML
fragment ImportedNamespace:
	importedNamespace = [Namespace:QualifiedName] '::' '*'
	( '::' isRecursive ?= '**' )?
;
// Source: KerML
// GRAM-032: FilterPackage creates a Package wrapper for filtered imports
FilterPackage:
	{infer Package}
	ownedRelationship += FilterPackageImport
	( ownedRelationship += FilterPackageMember )+
;
// Source: KerML
FilterPackageImport:
	 {infer Import}
	 FilterPackageMembershipImport | FilterPackageNamespaceImport
;
// Source: KerML
FilterPackageMembershipImport:
	{infer MembershipImport}
	ImportedMembership
;
// Source: KerML
FilterPackageNamespaceImport:
	{infer NamespaceImport}
	ImportedNamespace
;
// Source: KerML
FilterPackageMember:
	{infer ElementFilterMembership}
	visibility = FilterPackageMemberVisibility ownedRelatedElement += OwnedExpression ']'
;
// Source: KerML
FilterPackageMemberVisibility returns string:
	'[';
// Source: KerML
VisibilityIndicator returns string:
	'public' | 'private' | 'protected';
// Source: KerML
MemberElement:
	{infer Element}
	AnnotatingElement | NonFeatureElement
;
// Source: KerML
NonFeatureElement:
	  {infer Element}
	  Dependency
	| Namespace
	| Package
	| LibraryPackage 
	| Multiplicity
	| Type
	| Classifier 
	| Class
	| Structure
	| Metaclass
	| DataType 
	| Association
	| AssociationStructure
	| Interaction
	| Behavior
	| SysMLFunction
	| Predicate
	| Specialization
	| Conjugation
	| FeatureTyping
	| Subclassification
	| Disjoining
	| FeatureInverting
	| Subsetting
	| Redefinition
	| TypeFeaturing
;
// Source: KerML
FeatureElement:
	  {infer Feature}
	  Feature
	| Step
	| Expression
	| BooleanExpression
	| Invariant
	| Connector
	| BindingConnector
	| Succession
	| Flow
	| SuccessionFlow
;
// Source: KerML
Package:
	{infer Package}
	( ownedRelationship += PrefixMetadataMember )*
	PackageDeclaration PackageBody 
;
// Source: KerML
LibraryPackage:
	{infer LibraryPackage}
	( isStandard ?= 'standard' )? 'library'
	( ownedRelationship += PrefixMetadataMember )*
	PackageDeclaration PackageBody
;
// Source: KerML
fragment PackageDeclaration:
	'package' Identification?
;
// Source: KerML
fragment PackageBody:
	  ';'
	| '{' ( // GRAM-032: Import first for visibility support
		    ownedRelationship += Import
	      | ownedRelationship += PackageMember
	      | ownedRelationship += ElementFilterMember
	      | ownedRelationship += AliasMember )*
	  '}'
;
// Source: KerML
ElementFilterMember:
	{infer ElementFilterMembership}
	MemberPrefix
	'filter' ownedRelatedElement += OwnedExpression ';'
;
// Source: KerML
fragment TypePrefix:
	( isAbstract ?= 'abstract' )? 
	( ownedRelationship += PrefixMetadataMember )*
;
// Source: KerML
Type:
    {infer Type}
    TypePrefix 'type' 
    TypeDeclaration TypeBody
;
// Source: KerML
fragment TypeDeclaration: 
    ( isSufficient ?= 'all' )? Identification?
    ( ownedRelationship += OwnedMultiplicity )? 
    ( SpecializationPart | ConjugationPart )
    TypeRelationshipPart*
;
// Source: KerML
fragment SpecializationPart:
      ( ':>' | 'specializes' ) ownedRelationship += OwnedSpecialization
      ( ',' ownedRelationship += OwnedSpecialization )*
;
// Source: KerML
fragment ConjugationPart:
	( '~' | 'conjugates' ) ownedRelationship += OwnedConjugation
;
// Source: KerML
fragment TypeRelationshipPart:
	DisjoiningPart | UnioningPart | IntersectingPart | DifferencingPart
;
// Source: KerML
fragment DisjoiningPart:
	'disjoint' 'from' ownedRelationship += OwnedDisjoining
	( ',' ownedRelationship += OwnedDisjoining )* 
;
// Source: KerML
fragment UnioningPart:
	'unions' ownedRelationship += Unioning
	( ',' ownedRelationship += Unioning )* 
;
// Source: KerML
fragment IntersectingPart:
	'intersects' ownedRelationship += Intersecting
	( ',' ownedRelationship += Intersecting )* 
;
// Source: KerML
fragment DifferencingPart:
	'differences' ownedRelationship += Differencing
	( ',' ownedRelationship += Differencing )* 
;
// Source: KerML
fragment TypeBody:
	 ';' 
	| '{' ( ownedRelationship += NonFeatureMember 
		  | ownedRelationship += FeatureMember 
		  | ownedRelationship += AliasMember
		  | ownedRelationship += Import
	      )* 
	  '}'
;
// Source: KerML
FeatureMember:
	{infer OwningMembership}
	TypeFeatureMember | OwnedFeatureMember
;
// Source: KerML
TypeFeatureMember:
	{infer OwningMembership}
	MemberPrefix 'member' ownedRelatedElement += FeatureElement 
;
// Source: KerML
OwnedFeatureMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += FeatureElement 
;
// Source: KerML
Specialization:
    {infer Specialization}
    ( 'specialization' Identification? )?
    'subtype' 
	( specific = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
    ( ':>' | 'specializes') 
	( general = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
	RelationshipBody
;
// Source: KerML
OwnedSpecialization:
	  {infer Specialization}
	  general = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Conjugation:
	{infer Conjugation}
	( 'conjugation' Identification? )?
    'conjugate' 
    ( conjugatedType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
    ( '~' | 'conjugates') 
    ( originalType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
	RelationshipBody
;
// Source: KerML
OwnedConjugation:
	  {infer Conjugation}
	  originalType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Disjoining:
	{infer Disjoining}
	( 'disjoining' Identification? )?
	'disjoint' 
	( typeDisjoined = [Type:QualifiedName] 
	| ownedRelatedElement += OwnedFeatureChain )
	'from' 
	( disjoiningType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
	RelationshipBody
;
// Source: KerML
OwnedDisjoining:
	  {infer Disjoining}
	  disjoiningType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Unioning:
	  {infer Unioning}
	  unioningType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Intersecting:
	  {infer Intersecting}
	  intersectingType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Differencing:
	  {infer Differencing}
	  differencingType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Classifier:
	{infer Classifier}
	TypePrefix 'classifier' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
fragment ClassifierDeclaration:	
    (isSufficient ?= 'all' )? Identification?
	( ownedRelationship += OwnedMultiplicity )?
	( SuperclassingPart | ClassifierConjugationPart )?
	TypeRelationshipPart*
;
// Source: KerML
fragment SuperclassingPart:
	( ':>' | 'specializes' ) ownedRelationship += Ownedsubclassification 
	( ',' ownedRelationship += Ownedsubclassification )*
;
// Source: KerML
fragment ClassifierConjugationPart:
	( '~' | 'conjugates' ) ownedRelationship += ClassifierConjugation
;
// Source: KerML
Subclassification:
	{infer Subclassification}
	( 'specialization' Identification? )?
    'subclassifier' subclassifier = [Classifier:QualifiedName]
    ( ':>' | 'specializes') superclassifier = [Classifier:QualifiedName]
    RelationshipBody
;
// Source: KerML
Ownedsubclassification:
	{infer Subclassification}
	superclassifier = [Classifier:QualifiedName]
;
// Source: KerML
ClassifierConjugation:
	{infer Conjugation}
	originalType = [Classifier:QualifiedName]
;
// Source: KerML
FeatureDirection returns string:
	'in' | 'out' | 'inout';
// Source: KerML
fragment EndFeaturePrefix:
    ( isConstant ?= 'const')? isEnd ?= 'end'
;
// Source: KerML
// GRAM-008: 'var' removed from SysML grammar - it's a name, not a keyword
// In SysML grammar, 'var' is NOT a keyword (only 'constant' exists in RefPrefix)
// This BasicFeaturePrefix is retained for KerML rules but won't be reachable from SysML paths
fragment BasicFeaturePrefix:
	( direction = FeatureDirection )?
	( isDerived ?= 'derived' )?
	( isAbstract ?= 'abstract' )?
	( isComposite ?= 'composite' | isPortion ?= 'portion' )?
	( isConstant ?= 'const' )?
;
// Source: KerML
fragment FeaturePrefix:
	( EndFeaturePrefix ( ownedRelationship += OwnedCrossingFeatureMember )?
	| BasicFeaturePrefix
	)
	( ownedRelationship += PrefixMetadataMember )*
;
// Source: KerML
OwnedCrossingFeatureMember:
	{infer OwningMembership}
	ownedRelatedElement += OwnedCrossingFeature
;
// Source: KerML
OwnedCrossingFeature:
	{infer Feature}
	BasicFeaturePrefix FeatureDeclaration
;
// Source: KerML
Feature:
	{infer Feature}
	( FeaturePrefix
	  ( 'feature' | ownedRelationship += PrefixMetadataMember ) 
	  FeatureDeclaration?
	| ( EndFeaturePrefix | BasicFeaturePrefix )
	  FeatureDeclaration
	)
	ValuePart? TypeBody
;
// Source: KerML
fragment FeatureDeclaration:
	( isSufficient ?= 'all' )? 
	( Identification ( FeatureSpecializationPart | FeatureConjugationPart )?
	| FeatureSpecializationPart
	| FeatureConjugationPart
	)
	FeatureRelationshipPart*
;
// Source: KerML
fragment FeatureRelationshipPart:
	TypeRelationshipPart | ChainingPart | InvertingPart | TypeFeaturingPart
;
// Source: KerML
fragment ChainingPart:
	'chains' ( ownedRelationship += OwnedFeatureChaining | FeatureChain )
;
// Source: KerML
fragment InvertingPart:
	'inverse' 'of' ownedRelationship += OwnedFeatureInverting
;
// Source: KerML
fragment TypeFeaturingPart:
	'featured' 'by' ownedRelationship += OwnedTypeFeaturing 
	( ',' ownedRelationship += OwnedTypeFeaturing )*
;
// Source: KerML
fragment FeatureSpecializationPart:
	  ( FeatureSpecialization )+ MultiplicityPart? FeatureSpecialization*
	| MultiplicityPart FeatureSpecialization*
;
// Source: KerML
fragment MultiplicityPart:
	  ownedRelationship += OwnedMultiplicity 
	| ( ownedRelationship += OwnedMultiplicity )?
	  ( isOrdered ?= 'ordered' isNonunique ?= 'nonunique'?
	  | isNonunique ?= 'nonunique' isOrdered ?= 'ordered'?
	  )
;
// Source: SysML
// GRAM-020: IndividualMember handles all patterns with 'individual' keyword.
// Supports BasicDefinitionPrefix (abstract/variation) before 'individual'.
IndividualMember:
	{infer OccurrenceUsage}
	BasicDefinitionPrefix?
	isIndividual ?= 'individual'
	(
		// individual def X; -> basic individual definition (OccurrenceDefinition)
		'def'
		ownedRelationship += EmptyMultiplicityMember
		{infer OccurrenceDefinition}
		DefinitionCore
	|
		// individual occurrence def X;
		OccurrenceDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer OccurrenceDefinition}
		DefinitionCore
	|
		// individual part def X;
		PartDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer PartDefinition}
		DefinitionCore
	|
		// individual item def X;
		ItemDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ItemDefinition}
		DefinitionCore
	|
		// individual action def X;
		ActionDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ActionDefinition}
		DefinitionDeclaration ActionBody
	|
		// individual state def X;
		StateDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer StateDefinition}
		DefinitionDeclaration StateDefBody
	|
		// individual connection def X;
		ConnectionDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ConnectionDefinition}
		DefinitionCore
	|
		// individual interface def X;
		InterfaceDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer InterfaceDefinition}
		DefinitionDeclaration InterfaceBody
	|
		// individual allocation def X;
		AllocationDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer AllocationDefinition}
		DefinitionCore
	|
		// individual flow def X;
		FlowDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer FlowConnectionDefinition}
		DefinitionCore
	|
		// individual calc/calculation def X;
		CalculationDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer CalculationDefinition}
		DefinitionDeclaration CalculationBody
	|
		// individual constraint def X;
		ConstraintDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ConstraintDefinition}
		DefinitionDeclaration CalculationBody
	|
		// individual requirement def X;
		RequirementDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer RequirementDefinition}
		DefinitionDeclaration RequirementBody
	|
		// individual concern def X;
		ConcernDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ConcernDefinition}
		DefinitionDeclaration RequirementBody
	|
		// individual case def X;
		CaseDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer CaseDefinition}
		DefinitionDeclaration CaseBody
	|
		// individual analysis def X;
		AnalysisCaseDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer AnalysisCaseDefinition}
		DefinitionDeclaration CaseBody
	|
		// individual verification def X;
		VerificationCaseDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer VerificationCaseDefinition}
		DefinitionDeclaration CaseBody
	|
		// individual use case def X;
		UseCaseDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer UseCaseDefinition}
		DefinitionDeclaration CaseBody
	|
		// individual view def X;
		ViewDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ViewDefinition}
		DefinitionDeclaration ViewDefinitionBody
	|
		// individual viewpoint def X;
		ViewpointDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer ViewpointDefinition}
		DefinitionDeclaration RequirementBody
	|
		// individual rendering def X;
		RenderingDefKeyword
		ownedRelationship += EmptyMultiplicityMember
		{infer RenderingDefinition}
		DefinitionCore
	|
		// Usage path: individual x; -> individual usage
		UsageCore
	)
;

// Source: KerML
fragment FeatureSpecialization:
	Typings | Subsettings | References | Crossings | Redefinitions
;
// Source: KerML
// Fix GRAM-002: Allow ConjugatedPortTyping for ~Type syntax
fragment Typings:
	TypedBy ( ',' ownedRelationship += ( OwnedFeatureTyping | ConjugatedPortTyping ) )*
;
// Source: KerML
// GRAM-024: Added 'defined by' as SysML alternative to KerML 'typed by'
fragment TypedBy:
	( ':' | 'typed' 'by' | 'defined' 'by' ) ownedRelationship += ( OwnedFeatureTyping | ConjugatedPortTyping )
;
// Source: KerML
fragment Subsettings:
	Subsets ( ',' ownedRelationship += OwnedSubsetting )*
;
// Source: KerML
fragment Subsets:
	( ':>' | 'subsets' ) ownedRelationship += OwnedSubsetting 
;
// Source: KerML
fragment References:
	ReferencesKeyword ownedRelationship += OwnedReferenceSubsetting
;
// Source: KerML
ReferencesKeyword returns string:
	'::>' | 'references'
;
// Source: KerML
fragment Crossings:
	( '=>' | 'crosses' ) ownedRelationship += OwnedCrossSubsetting
;
// Source: KerML
fragment Redefinitions:
	Redefines ( ',' ownedRelationship += OwnedRedefinition )*
;
// Source: KerML
fragment Redefines:
	( ':>>' | 'redefines' ) ownedRelationship += OwnedRedefinition
;
// Source: KerML
FeatureInverting:
	{infer FeatureInverting}
	( 'inverting' Identification? )?
	'inverse' 
	( featureInverted = [Feature:QualifiedName] 
	| ownedRelatedElement += OwnedFeatureChain )
	'of' 
	( invertingFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
	RelationshipBody
;
// Source: KerML
OwnedFeatureInverting:
	  {infer FeatureInverting}
	  invertingFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
TypeFeaturing:
	{infer TypeFeaturing}
	'featuring' ( Identification? 'of')?
	featureOfType = [Feature:QualifiedName]
	'by' featuringType = [Feature:QualifiedName]
	RelationshipBody
;
// Source: KerML
OwnedTypeFeaturing:
	{infer TypeFeaturing}
	featuringType = [Type:QualifiedName]
;
// Source: KerML
FeatureTyping:
	{infer FeatureTyping}
	( 'specialization' Identification? )?
    'typing' typedFeature = [Feature:QualifiedName]
    (':' | 'typed' 'by') FeatureType
    RelationshipBody
;
// Source: KerML
OwnedFeatureTyping:
	{infer FeatureTyping}
	FeatureType
;
// Source: KerML
fragment FeatureType:
	  type = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
Subsetting:
	{infer Subsetting}
	( 'specialization' Identification? )?
    'subset' 
    ( subsettingFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
    ( ':>' | 'subsets' ) 
    ( subsettedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
	RelationshipBody
;
// Source: KerML
OwnedSubsetting:
	  {infer Subsetting}
	  subsettedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
OwnedReferenceSubsetting:
	  {infer ReferenceSubsetting}
	  referencedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;
// Source: KerML
OwnedCrossSubsetting:
	{infer CrossSubsetting}
	( crossedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
	)
;
// Source: KerML
Redefinition:
	{infer Redefinition}
	( 'specialization' Identification? )?
    'redefinition' 
    ( redefiningFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
    ( ':>>' | 'redefines' ) 
    ( redefinedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain )
	RelationshipBody
;
// Source: KerML
OwnedRedefinition:
	  {infer Redefinition}
	  redefinedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain 
;
// Source: KerML
fragment FeatureConjugationPart:
	( '~' | 'conjugates' ) ownedRelationship += FeatureConjugation
;
// Source: KerML
FeatureConjugation:
	{infer Conjugation}
	originalType = [Feature:QualifiedName]
;
// Source: KerML
fragment ValuePart:
	  ownedRelationship += FeatureValue
;
// Source: KerML
FeatureValue:
	{infer FeatureValue}
	( '=' 
	| isInitial ?= ':='
	| isDefault ?= 'default' ( '=' | isInitial ?= ':=' )?
	)
	ownedRelatedElement += OwnedExpression
;
// Source: KerML
Multiplicity:
	{infer Multiplicity}
	MultiplicitySubset | MultiplicityRange
;
// Source: KerML
MultiplicitySubset:
	{infer Multiplicity}
	'multiplicity' Identification? Subsets TypeBody
;
// Source: KerML
MultiplicityRange:
	{infer MultiplicityRange}
	'multiplicity' Identification? MultiplicityBounds TypeBody
;
// Source: KerML
OwnedMultiplicity:
	{infer OwningMembership}
	ownedRelatedElement += OwnedMultiplicityRange 
;
// Source: KerML
OwnedMultiplicityRange:
	{infer MultiplicityRange}
	MultiplicityBounds
;
// Source: KerML
fragment MultiplicityBounds:
	// TODO: Allow general expressions for bounds. (Causes LL parsing issues.)
	'[' ownedRelationship += MultiplicityExpressionMember
	      ( '..' ownedRelationship += MultiplicityExpressionMember )? ']'
;
// Source: KerML
MultiplicityExpressionMember:
	{infer OwningMembership}
	ownedRelatedElement += ( LiteralExpression | FeatureReferenceExpression ) 
;
// Source: KerML
DataType:
	{infer DataType}
	TypePrefix 'datatype' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
Class:
	{infer Class}
	TypePrefix 'class' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
Structure:
	{infer Structure}
	TypePrefix 'struct' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
Association:
	{infer Association}
	TypePrefix 'assoc' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
AssociationStructure:
	{infer AssociationStructure}
	TypePrefix 'assoc' 'struct'
	ClassifierDeclaration TypeBody
;
// Source: KerML
Connector:
	{infer Connector}
	FeaturePrefix 'connector' 
	( FeatureDeclaration? ValuePart?
	| ConnectorDeclaration
	) 
	TypeBody	  
;
// Source: KerML
fragment ConnectorDeclaration:
	BinaryConnectorDeclaration | NaryConnectorDeclaration
;
// Source: KerML
fragment BinaryConnectorDeclaration:
	( FeatureDeclaration? 'from' | isSufficient ?= 'all' 'from'? )?
	ownedRelationship += ConnectorEndMember 'to' 
	ownedRelationship += ConnectorEndMember
;
// Source: KerML
fragment NaryConnectorDeclaration:
	FeatureDeclaration? 
	'(' ownedRelationship += ConnectorEndMember ',' 
	    ownedRelationship += ConnectorEndMember
	    ( ',' ownedRelationship += ConnectorEndMember )* 
	')'
;
// Source: KerML
ConnectorEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += ConnectorEnd 
;
// Source: KerML
ConnectorEnd:
	{infer Feature}
	( ownedRelationship += OwnedCrossingMultiplicityMember )?
	( declaredName = Name ReferencesKeyword )? 
	ownedRelationship += OwnedReferenceSubsetting
;
// Source: KerML
OwnedCrossingMultiplicityMember:
	{infer OwningMembership}
	ownedRelatedElement += OwnedCrossingMultiplicity
;
// Source: KerML
OwnedCrossingMultiplicity:
	{infer Feature}
	ownedRelationship += OwnedMultiplicity
;
// Source: KerML
BindingConnector:
	{infer BindingConnector}
	FeaturePrefix 'binding' 
	BindingConnectorDeclaration TypeBody	
;
// Source: KerML
fragment BindingConnectorDeclaration:
	  FeatureDeclaration
	  ( 'of' ownedRelationship += ConnectorEndMember 
	    '=' ownedRelationship += ConnectorEndMember )?
	| ( isSufficient ?= 'all' )?
	  ( 'of'? ownedRelationship += ConnectorEndMember 
	    '=' ownedRelationship += ConnectorEndMember )?
;
// Source: KerML
Succession:
	{infer Succession}
	FeaturePrefix 'succession' 
	SuccessionDeclaration TypeBody
;
// Source: KerML
fragment SuccessionDeclaration:
	  FeatureDeclaration
	  ( 'first' ownedRelationship += ConnectorEndMember 
	    'then' ownedRelationship += ConnectorEndMember )?
    | ( isSufficient ?= 'all' )?
	  ( 'first'? ownedRelationship += ConnectorEndMember 
	    'then' ownedRelationship += ConnectorEndMember )?
;
// Source: KerML
Behavior:
	{infer Behavior}
	TypePrefix 'behavior' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
Step:
	{infer Step}
	FeaturePrefix 'step' 
	StepDeclaration TypeBody
;
// Source: KerML
fragment StepDeclaration:
	FeatureDeclaration? ValuePart?
;
// Source: KerML
SysMLFunction:
	{infer SysMLFunction}
	TypePrefix 'function' 
	ClassifierDeclaration FunctionBody  
;
// Source: KerML
fragment FunctionBody:
	';' | '{' FunctionBodyPart '}'
;
// Source: KerML
// GRAM-008: ReturnFeatureMember must come BEFORE FeatureMember (both can start with empty MemberPrefix)
fragment FunctionBodyPart:
	( ownedRelationship += ReturnFeatureMember
	| ownedRelationship += NonFeatureMember
	| ownedRelationship += FeatureMember
	| ownedRelationship += AliasMember
	| ownedRelationship += Import
	)*
	( ownedRelationship += ResultExpressionMember )?
;
// Source: KerML
ReturnFeatureMember:
	{infer ReturnParameterMembership}
	MemberPrefix 'return' 
	ownedRelatedElement += FeatureElement 
;
// Source: KerML
ResultExpressionMember:
	{infer ResultExpressionMembership}
	MemberPrefix ownedRelatedElement += OwnedExpression 
;
// Source: KerML
Expression:
	{infer Expression}
	FeaturePrefix 'expr' 
	ExpressionDeclaration FunctionBody
;
// Source: KerML
fragment ExpressionDeclaration:
	FeatureDeclaration? ValuePart?
;
// Source: KerML
Predicate:
	{infer Predicate}
	TypePrefix 'predicate' 
	ClassifierDeclaration FunctionBody  
;
// Source: KerML
BooleanExpression:
	{infer BooleanExpression}
	FeaturePrefix 'bool' 
	ExpressionDeclaration FunctionBody
;
// Source: KerML
Invariant:
	{infer Invariant}
	FeaturePrefix 'inv' ( 'true' | isNegated ?= 'false' )?
	ExpressionDeclaration FunctionBody
;
// Source: KerML
Interaction:
	{infer Interaction}
	TypePrefix 'interaction' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
Flow:
	{infer Flow}
	FeaturePrefix 'flow' 
	FlowDeclaration TypeBody
;
// Source: KerML
SuccessionFlow:
	{infer SuccessionFlow}
	FeaturePrefix 'succession' 'flow' FlowDeclaration TypeBody
;
// Source: KerML
fragment FlowDeclaration:
	  FeatureDeclaration? ValuePart?
      ( 'of'  ownedRelationship += PayloadFeatureMember )?
	  ( 'from' ownedRelationship += FlowEndMember 
	    'to' ownedRelationship += FlowEndMember )?
    | ( isSufficient ?= 'all' )?
      ownedRelationship += FlowEndMember 'to'
	  ownedRelationship += FlowEndMember
;
// Source: KerML
PayloadFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += PayloadFeature 
;
// Source: KerML
PayloadFeature:
	  {infer PayloadFeature}
	  Identification? PayloadFeatureSpecializationPart ValuePart?
	| Identification? ValuePart
    | ownedRelationship += OwnedFeatureTyping ( ownedRelationship += OwnedMultiplicity )?
    | ownedRelationship += OwnedMultiplicity ownedRelationship += OwnedFeatureTyping
;
// Source: KerML
fragment PayloadFeatureSpecializationPart:
	  FeatureSpecialization+ MultiplicityPart? FeatureSpecialization*
	| MultiplicityPart FeatureSpecialization+
;
// Source: KerML
FlowEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += FlowEnd 
;
// Source: KerML
FlowEnd:
	{infer FlowEnd}
	( ownedRelationship += FlowEndSubsetting )?
	ownedRelationship += FlowFeatureMember
;
// Source: KerML
FlowEndSubsetting:
	  {infer ReferenceSubsetting}
	  referencedFeature = [Feature:QualifiedName] '.'
	| ownedRelatedElement += FeatureChainPrefix
;
// Source: KerML
FeatureChainPrefix:
	{infer Feature}
	( ownedRelationship += OwnedFeatureChaining '.' )+
	ownedRelationship += OwnedFeatureChaining '.'
;
// Source: KerML
FlowFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += FlowFeature 
;
// Source: KerML
FlowFeature:
	{infer Feature}
	ownedRelationship += FlowRedefinition
;
// Source: KerML
FlowRedefinition:
	{infer Redefinition}
	redefinedFeature = [Feature:QualifiedName]
;
// Source: KerML
Metaclass:
	{infer Metaclass}
	TypePrefix 'metaclass' 
	ClassifierDeclaration TypeBody
;
// Source: KerML
PrefixMetadataAnnotation:
	{infer Annotation}
	'#' ownedRelatedElement += PrefixMetadataFeature
;
// Source: KerML
PrefixMetadataMember:
	{infer OwningMembership}
	'#' ownedRelatedElement += PrefixMetadataFeature 
;
// Source: KerML
PrefixMetadataFeature:
	{infer MetadataFeature}
	ownedRelationship += MetadataTyping
;
// Source: KerML
MetadataFeature:
	{infer MetadataFeature}
	( ownedRelationship += PrefixMetadataMember )*
	( '@' | 'metadata' ) MetadataFeatureDeclaration 
	( 'about' ownedRelationship += Annotation 
		( ',' ownedRelationship += Annotation )*
	)?
	MetadataBody
;
// Source: KerML
fragment MetadataFeatureDeclaration:
	( Identification ( ':' | 'typed' 'by' ) )? ownedRelationship += MetadataTyping
;
// Source: KerML
MetadataTyping:
	{infer FeatureTyping}
	type = [Metaclass:QualifiedName]
;
// Source: KerML
fragment MetadataBody:
	  ';' 
	| '{' ( ownedRelationship += NonFeatureMember 
		  | ownedRelationship += MetadataBodyFeatureMember 
		  | ownedRelationship += AliasMember
		  | ownedRelationship += Import
	      )* 
	  '}'
;
// Source: KerML
MetadataBodyFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += MetadataBodyFeature
;
// Source: KerML
// GRAM-034: Added 'ref' keyword support for metadata body reference redefinitions
MetadataBodyFeature:
	{infer Feature}
	( 'feature' | 'ref' )? ( ':>>' | 'redefines' )? ownedRelationship += OwnedRedefinition
	FeatureSpecializationPart? ValuePart?
	MetadataBody
;
// Source: KerML
// GRAM-008: SysML overrides ExpressionBody to use CalculationBody

// === END KERML CORE RULES ===

entry RootNamespace:
	{infer Namespace} PackageBodyElement*
;

AnnotatingMember:
	{infer OwningMembership}
	ownedRelatedElement += AnnotatingElement 
;

OwnedExpressionMember:
	{infer FeatureMembership}
	ownedRelatedElement += OwnedExpression 
;

OwnedExpression:
	ConditionalExpression
;

// Conditional Test Expressions

OwnedExpressionReference:
	{infer FeatureReferenceExpression}
	ownedRelationship += OwnedExpressionMember
;

ConditionalExpression:
	  NullCoalescingExpression 
	| {infer OperatorExpression} operator = ConditionalOperator operand += NullCoalescingExpression 
		  '?' operand += OwnedExpressionReference 'else' operand += OwnedExpressionReference	
;

ConditionalOperator returns string:
	'if'
;

// Null Coalescing Expressions

NullCoalescingExpression:
	ImpliesExpression ( {infer OperatorExpression.operand += current}
		operator = NullCoalescingOperator operand += ImpliesExpressionReference )*
;

NullCoalescingOperator returns string:
	'??'
;

// Logical Expressions

ImpliesExpressionReference:
	{infer FeatureReferenceExpression}
	ownedRelationship += ImpliesExpressionMember
;

ImpliesExpressionMember:
	{infer FeatureMembership}
	ownedRelatedElement += ImpliesExpression 
;

ImpliesExpression:
	OrExpression ( {infer OperatorExpression.operand += current}  
		operator = ImpliesOperator operand += OrExpressionReference )*
;

ImpliesOperator returns string:
	'implies'
;

OrExpressionReference:
	{infer FeatureReferenceExpression}
	ownedRelationship += OrExpressionMember
;

OrExpressionMember:
	{infer FeatureMembership}
	ownedRelatedElement += OrExpression 
;

OrExpression:
	XorExpression ( {infer OperatorExpression.operand += current}  
		( operator = OrOperator operand += XorExpression
		| operator = ConditionalOrOperator operand += XorExpressionReference ) )*
;

OrOperator returns string:
	'|' 
;

ConditionalOrOperator returns string:
	'or'
;

XorExpressionReference:
	{infer FeatureReferenceExpression}
	ownedRelationship += XorExpressionMember
;

XorExpressionMember:
	{infer FeatureMembership}
	ownedRelatedElement += XorExpression 
;

XorExpression:
	AndExpression ( {infer OperatorExpression.operand += current}  
		operator = XorOperator operand += AndExpression )*
;

XorOperator returns string:
	'xor'
;

AndExpression:
	EqualityExpression ( {infer OperatorExpression.operand += current}  
		( operator = AndOperator operand += EqualityExpression
		| operator = ConditionalAndOperator operand += EqualityExpressionReference ) )*
;

AndOperator returns string:
    '&'
;

ConditionalAndOperator returns string:
	'and'
;

// Equality Expressions

EqualityExpressionReference:
	{infer FeatureReferenceExpression}
	ownedRelationship += EqualityExpressionMember
;

EqualityExpressionMember:
	{infer FeatureMembership}
	ownedRelatedElement += EqualityExpression 
;

EqualityExpression:
	ClassificationExpression ( {infer OperatorExpression.operand += current}  
		operator = EqualityOperator operand += ClassificationExpression )*
	
;

EqualityOperator returns string:
	'==' | '!=' | '===' | '!=='
;

// Classification Expressions

ClassificationExpression:
	// CONV-008: @ prefix alternatives for shorthand support
	// Parse operator first, create implicit self operand via assignment
	  {infer OperatorExpression} operator = '@' ownedRelationship += TypeReferenceMember
	  ( operand += SelfReferenceExpression )?
	| {infer OperatorExpression} operator = '@@' ownedRelationship += TypeReferenceMember
	  ( operand += MetadataReference )?
	| RelationalExpression 
	  ( {infer OperatorExpression.operand += current} 
	  	operator = ClassificationTestOperator ownedRelationship += TypeReferenceMember
	  | {infer OperatorExpression.operand += current}
	    operator = CastOperator ownedRelationship += TypeResultMember
	  )?
	| {infer OperatorExpression} operand += SelfReferenceExpression 
	  operator = ClassificationTestOperator ownedRelationship += TypeReferenceMember
	| {infer OperatorExpression} operand += MetadataReference
	  operator = MetaClassificationTestOperator ownedRelationship += TypeReferenceMember
	| {infer OperatorExpression} operand += SelfReferenceExpression 
	  operator = CastOperator ownedRelationship += TypeResultMember
	| {infer OperatorExpression} operand += MetadataReference
	  operator = MetaCastOperator ownedRelationship += TypeResultMember
;

ClassificationTestOperator returns string:
	'hastype' | 'istype' | '@'
;

MetaClassificationTestOperator returns string:
	'@@'
;

CastOperator returns string:
    'as'
;

MetaCastOperator returns string:
	'meta'
;

MetadataReference:
	{infer MetadataAccessExpression}
	ownedRelationship += ElementReferenceMember
;

TypeReferenceMember:
	{infer ParameterMembership}
	ownedRelatedElement += TypeReference
;

TypeResultMember:
	{infer ReturnParameterMembership}
	ownedRelatedElement += TypeReference
;

TypeReference:
	{infer Feature}
	ownedRelationship += ReferenceTyping
;

ReferenceTyping:
	  {infer FeatureTyping}
	  type = [Type:QualifiedName]
;

SelfReferenceExpression:
	{infer FeatureReferenceExpression}
	ownedRelationship += SelfReferenceMember
;

SelfReferenceMember:
	{infer ReturnParameterMembership}
	ownedRelatedElement += EmptyFeature 
;

EmptyFeature:
	{infer Feature}
;

// Relational Expressions

RelationalExpression:
	RangeExpression ( {infer OperatorExpression.operand += current}  
		operator = RelationalOperator operand += RangeExpression )*
;

RelationalOperator returns string:
	'<' | '>' | '<=' | '>='
;

// Range Expressions

RangeExpression:
	AdditiveExpression ( {infer OperatorExpression.operand += current} 
		operator = '..' operand += AdditiveExpression )?	
;

// Arithmetic Expressions

AdditiveExpression:
	MultiplicativeExpression ( {infer OperatorExpression.operand += current}  
		operator = AdditiveOperator operand += MultiplicativeExpression )*	
;

AdditiveOperator returns string:
	'+' | '-' 
;

MultiplicativeExpression:
	ExponentiationExpression ( {infer OperatorExpression.operand += current}  
		operator = MultiplicativeOperator operand += ExponentiationExpression )*	
;

MultiplicativeOperator returns string:
	'*' | '/' | '%'
;

ExponentiationExpression:
	UnaryExpression ( {infer OperatorExpression.operand += current}  
		operator = ExponentiationOperator operand += ExponentiationExpression )?		
;

ExponentiationOperator returns string:
	'**' | '^'
;

// Unary Expressions

UnaryExpression:
	  {infer OperatorExpression} operator = UnaryOperator operand += ExtentExpression
	| ExtentExpression
;

UnaryOperator returns string:
	'+' | '-' | '~' | 'not'
;

// Extent Expressions

ExtentExpression:
	  {infer OperatorExpression} operator = 'all' ownedRelationship += TypeResultMember
	| PrimaryExpression
;

/* Primary Expressions */

PrimaryExpression:
	BaseExpression
	( {infer FeatureChainExpression.operand += current} '.' 
	  ownedRelationship += FeatureChainMember
	)?
	( ( {infer IndexExpression.operand += current} 
	    '#' '(' operand += SequenceExpression ')'
	  | {infer OperatorExpression.operand += current} 
	    operator = '[' operand += SequenceExpression ']'
	  | {infer InvocationExpression.operand += current} '->' 
	    ownedRelationship += InstantiatedTypeMember 
	    ( operand += BodyExpression 
	    | operand += FunctionReferenceExpression 
	    | ArgumentList
	    )
	  | {infer CollectExpression.operand += current} '.'
	    operand += BodyExpression 
	  | {infer SelectExpression.operand += current} '.?'
	    operand += BodyExpression 
	  )
	  ( {infer FeatureChainExpression.operand += current} '.' 
	  	ownedRelationship += FeatureChainMember
	  )?
	)*
;

FunctionReferenceExpression:
	{infer FeatureReferenceExpression}
	ownedRelationship += FunctionReferenceMember
;

FunctionReferenceMember:
	{infer FeatureMembership}
	ownedRelatedElement += FunctionReference 
;

FunctionReference:
	{infer Expression}
	ownedRelationship += ReferenceTyping
;

FeatureChainMember:
	  // GRAM-035: QualifiedName first to avoid greedy OwnedFeatureChain consumption
	  {infer Membership}
	  memberElement = [Feature:QualifiedName]
	| {infer OwningMembership} ownedRelatedElement += OwnedFeatureChain 
;

OwnedFeatureChain:
	{infer Feature}
	FeatureChain
;

/* Base Expressions */

BaseExpression:
	  NullExpression
	| LiteralExpression 
	| InvocationExpression
	| MetadataAccessExpression
	| FeatureReferenceExpression
	| ConstructorExpression
	| BodyExpression
	| '(' SequenceExpression ')'
;

// Expression Bodies

BodyExpression:
	{infer FeatureReferenceExpression}
	ownedRelationship += ExpressionBodyMember
;

ExpressionBodyMember:
	{infer FeatureMembership}
	ownedRelatedElement += ExpressionBody 
;

// This default production is overridden in the KerML and SysML grammars.
ExpressionBody:
	{infer Expression}
	CalculationBody
;

BodyParameterMember:
	{infer ParameterMembership}
	'in' ownedRelatedElement += BodyParameter 
;

BodyParameter:
	{infer Feature}
	declaredName = Name
;

// Sequence Expressions

SequenceExpression:
	{infer Expression}
	OwnedExpression
	( ','
	| {infer OperatorExpression.operand += current} operator = ',' 
	  operand += SequenceExpression
	)?	
;

// Feature Reference Expressions

FeatureReferenceExpression:
	{infer FeatureReferenceExpression}
	ownedRelationship += FeatureReferenceMember
;

FeatureReferenceMember:
	{infer Membership}
	memberElement = [Feature:QualifiedName]
;

// Metadata Access Expressions

MetadataAccessExpression:
	{infer MetadataAccessExpression}
	ownedRelationship += ElementReferenceMember '.' 'metadata'
;

ElementReferenceMember:
    {infer Membership}
    memberElement = [Element:QualifiedName]
;
   
// Invocation Expressions

InvocationExpression:
	{infer InvocationExpression}
	ownedRelationship += InstantiatedTypeMember ArgumentList
;

ConstructorExpression:
    {infer ConstructorExpression}
    'new' ownedRelationship += InstantiatedTypeMember
    ownedRelationship += ConstructorResultMember
;

ConstructorResultMember:
    {infer ReturnParameterMembership}
    ownedRelatedElement += ConstructorResult
;

ConstructorResult:
    {infer Feature}
    ArgumentList
;

InstantiatedTypeMember:
	  {infer Membership}
	  memberElement = [Type:QualifiedName]
	| {infer OwningMembership} ownedRelatedElement += OwnedFeatureChain 
;

// For use in KerML and SysML grammars
fragment FeatureChain:
	ownedRelationship += OwnedFeatureChaining
	( '.' ownedRelationship += OwnedFeatureChaining )+
;

OwnedFeatureChaining:
	{infer FeatureChaining}
	chainingFeature = [Feature:QualifiedName]
;

fragment ArgumentList:
	'(' ( PositionalArgumentList | NamedArgumentList )? ')'
;

fragment PositionalArgumentList:
	ownedRelationship += ArgumentMember 
	( ',' ownedRelationship += ArgumentMember )*
;

ArgumentMember:
	{infer ParameterMembership}
	ownedRelatedElement += Argument 
;

Argument:
	{infer Feature}
	ownedRelationship += ArgumentValue
;

fragment NamedArgumentList:
	ownedRelationship += NamedArgumentMember 
	( ',' ownedRelationship += NamedArgumentMember )*
;

NamedArgumentMember:
	{infer ParameterMembership}
	ownedRelatedElement += NamedArgument 
;

NamedArgument:
	{infer Feature}
	ownedRelationship += ParameterRedefinition '=' ownedRelationship += ArgumentValue
;

ParameterRedefinition:
	{infer Redefinition}
	redefinedFeature = [Feature:QualifiedName]
;

ArgumentValue:
	{infer FeatureValue}
	ownedRelatedElement += OwnedExpression
;

// Null Expressions

NullExpression:
	{infer NullExpression} ( 'null' | '(' ')' )
;

/* Literal Expressions */

LiteralExpression:
	  {infer LiteralExpression}
	  LiteralBoolean 
	| LiteralString 
	| LiteralInteger
	| LiteralReal 
	| LiteralInfinity
;

LiteralBoolean:
	{infer LiteralBoolean}
	value = BooleanValue
;

BooleanValue returns boolean :
	'true' | 'false'
;

LiteralString:
	{infer LiteralString}
	value = STRING_VALUE
;

LiteralInteger:
	{infer LiteralInteger}
	value = DECIMAL_VALUE
;

LiteralReal:
	{infer LiteralRational}
	value = RealValue
;

RealValue:
	{infer EDouble}
	DECIMAL_VALUE? '.' ( DECIMAL_VALUE | EXP_VALUE ) | EXP_VALUE
;

LiteralInfinity:
	{infer LiteralInfinity} '*'
;

/* NAMES */

Name returns string:
	ID | UNRESTRICTED_NAME
	// GRAM-005: Soft keywords - can be used as identifiers in name positions
	// NOTE: 'entry', 'do', 'exit' intentionally NOT soft keywords (ADR-001)
	| 'then' | 'else' | 'if'   // Control flow keywords
	| 'accept' | 'via' | 'at'  // Other keywords used as names in library
	| 'frame' | 'snapshot'     // Spatial/temporal keywords
	// GRAM-007: 'var' is used as feature name in library (ref var[0..1])
	// In SysML grammar, contextual disambiguation allows 'var' to be a name after 'ref'
	// In Langium, we add it as a soft keyword to achieve the same result
	| 'var'
	// GRAM-008: Additional soft keywords used as names in library
	| 'multiplicity'           // Used as alias name in ISQChemistryMolecular
	| 'type'                   // Used as attribute name in ImageMetadata
	// GRAM-008: Keywords used as subsetting/redefines targets in SysML.sysml
	| 'step' | 'member' | 'feature' | 'function' | 'predicate' | 'behavior'
	| 'interaction' | 'metaclass'
;

GlobalQualification returns string:
	'$' '::'
;

Qualification returns string:
	( Name '::' )+
;

QualifiedName returns string:
	GlobalQualification? ( Name '::' )* Name
;
	
/* TERMINALS */

// BASE-001: EXP_VALUE must be defined BEFORE DECIMAL_VALUE for Chevrotain lexer
// to correctly tokenize scientific notation (1E-24) as a single token.
terminal EXP_VALUE:
	('0'..'9')+ ('e' | 'E') ('+' | '-')? ('0'..'9')+;

terminal DECIMAL_VALUE returns number:
	'0'..'9' ('0'..'9')*;

terminal ID:
	('a'..'z' | 'A'..'Z' | '_') ('a'..'z' | 'A'..'Z' | '_' | '0'..'9')*;

terminal UNRESTRICTED_NAME returns string:
	'\'' ('\\' ('b' | 't' | 'n' | 'f' | 'r' | '"' | "'" | '\\') | !('\\' | '\''))* '\'';

terminal STRING_VALUE returns string:
	'"' ('\\' ('b' | 't' | 'n' | 'f' | 'r' | '"' | "'" | '\\') | !('\\' | '"'))* '"';

terminal REGULAR_COMMENT:
	'/*' ->'*/';

hidden terminal ML_NOTE:
	'//*'->'*/';

hidden terminal SL_NOTE:
	'//' (!('\n' | '\r') !('\n' | '\r')*)? ('\r'? '\n')?;

hidden terminal WS:
	(' ' | '\t' | '\r' | '\n')+;

// === END SHARED EXPRESSIONS ===

MetadataKeyword returns string:
	'metadata'
;

MetadataDefKeyword returns string:
	MetadataKeyword 'def'
;

MetadataUsageKeyword returns string:
	MetadataKeyword | '@'
;

MetadataDefinition:
	{infer MetadataDefinition}
	( isAbstract ?= 'abstract')? 
	DefinitionExtensionKeyword* MetadataDefKeyword 
	DefinitionCore
;

PrefixMetadataUsage:
	{infer MetadataUsage}
	ownedRelationship += MetadataTyping
//	( ownedRelationship += MetadataBodyUsageMember )*
;

MetadataUsage:
	{infer MetadataUsage}
	UsageExtensionKeyword*
	MetadataUsageKeyword MetadataUsageDeclaration 
	( 'about' ownedRelationship += Annotation 
		( ',' ownedRelationship += Annotation )*
	)?
	MetadataBody
;

fragment MetadataUsageDeclaration:
	( Identification? DefinedByKeyword )? ownedRelationship += MetadataTyping
;

MetadataBodyUsageMember:
	{infer FeatureMembership}
	ownedRelatedElement += MetadataBodyUsage
;

MetadataBodyUsage:
	{infer ReferenceUsage}
	'ref'? ( ':>>' | 'redefines' )? ownedRelationship += OwnedRedefinition 
	FeatureSpecializationPart? ValuePart?
	MetadataBody
;

fragment PackageBodyElement:
	// GRAM-032: Import first to catch 'visibility import' patterns
	  ownedRelationship += Import
	| ownedRelationship += PackageMember
	| ownedRelationship += ElementFilterMember
	| ownedRelationship += AliasMember
;

// GRAM-020: IndividualMember handles 'individual' keyword patterns
PackageMember:
	{infer OwningMembership}
	MemberPrefix		
	( ownedRelatedElement += IndividualMember
	| ownedRelatedElement += DefinitionElement
	| ownedRelatedElement += UsageElement 
	)
;

DefinitionElement:
	  {infer Element}
	  Package
	| LibraryPackage
	| AnnotatingElement
	| Dependency
	| AttributeDefinition
// GRAM-027: IndividualDefinition before OccurrenceDefinition for 'individual def' vs 'individual occurrence def'
	| EnumerationDefinition
	| IndividualDefinition
	| OccurrenceDefinition
	| ItemDefinition
	| MetadataDefinition
	| PartDefinition
	| ConnectionDefinition
	| FlowDefinition
	| InterfaceDefinition
	| AllocationDefinition
	| PortDefinition
	| ActionDefinition
	| CalculationDefinition
	| StateDefinition
	| ConstraintDefinition
	| RequirementDefinition
	| ConcernDefinition
	| CaseDefinition
	| AnalysisCaseDefinition
	| VerificationCaseDefinition
	| UseCaseDefinition
	| ViewDefinition
	| ViewpointDefinition
	| RenderingDefinition
	| ExtendedDefinition
;
	
UsageElement:
	  {infer UsageCore}
	  NonOccurrenceUsageElement 
	| OccurrenceUsageElement
;

/* CLASSIFIERS */

/* Subclassification */

fragment SubclassificationPart:
	SpecializesKeyword ownedRelationship += OwnedSubclassification 
	( ',' ownedRelationship += OwnedSubclassification )*
;

SpecializesKeyword returns string:
	':>' | 'specializes'
;

OwnedSubclassification:
	{infer Subclassification}
	superclassifier = [Classifier:QualifiedName]
;

DefinedByKeyword returns string:
	':' | 'defined' 'by'
;

SubsetsKeyword returns string:
	':>' | 'subsets'
;

fragment Crosses:
    CrossesKeyword ownedRelationship += OwnedCrossSubsetting
;

CrossesKeyword returns string:
	'=>' | 'crosses'
;

RedefinesKeyword returns string:
	':>>' | 'redefines'
;

fragment BasicDefinitionPrefix:
	isAbstract ?= 'abstract' | isVariation ?= 'variation'
;

fragment DefinitionExtensionKeyword:
	ownedRelationship += PrefixMetadataMember
;

fragment DefinitionPrefix:
	BasicDefinitionPrefix? DefinitionExtensionKeyword*
;

fragment DefinitionCore:
	DefinitionDeclaration DefinitionBody
;

fragment DefinitionDeclaration:	
	Identification? SubclassificationPart?
;

fragment DefinitionBody:
	';' | '{' DefinitionBodyItem* '}'
;

fragment DefinitionBodyItem:
	  ownedRelationship += DefinitionMember 
	| ownedRelationship += VariantUsageMember
	| ownedRelationship += NonOccurrenceUsageMember
	| ( ownedRelationship += EmptySuccessionMember )?
	  ownedRelationship += OccurrenceUsageMember	
	| ownedRelationship += AliasMember
	| ownedRelationship += Import
;

DefinitionMember:
	{infer OwningMembership}
	MemberPrefix 
	ownedRelatedElement += DefinitionElement 
;

VariantUsageMember:
	{infer VariantMembership}
	MemberPrefix 'variant' 
	ownedRelatedElement += VariantUsageElement 
;

NonOccurrenceUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += NonOccurrenceUsageElement 
;

OccurrenceUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += OccurrenceUsageElement 
;

StructureUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += StructureUsageElement 
;

BehaviorUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += BehaviorUsageElement 
;

fragment RefPrefix:
    ( direction = FeatureDirection )?
    ( isDerived ?= 'derived' )?
    ( isAbstract ?= 'abstract' | isVariation ?= 'variation')?
    ( isConstant ?= 'constant' )?
;

fragment BasicUsagePrefix:
	RefPrefix
	( isReference ?= 'ref' )?
;

fragment EndUsagePrefix:
	isEnd ?= 'end' MultiplicityPart? ( Name ownedRelationship += OwnedCrossFeatureMember )?
;

fragment UnextendedUsagePrefix:
    EndUsagePrefix | BasicUsagePrefix
;

fragment UsageExtensionKeyword:
	ownedRelationship += PrefixMetadataMember
;

fragment UsagePrefix:
	UnextendedUsagePrefix UsageExtensionKeyword*
;

OwnedCrossFeatureMember:
    {infer OwningMembership}
    ownedRelatedElement += OwnedCrossFeature
;

OwnedCrossFeature:
    {infer ReferenceUsage}
    BasicUsagePrefix UsageDeclaration
;

fragment UsageCore:
	UsageDeclaration? UsageCompletion
;

fragment UsageDeclaration:
	  FeatureDeclaration
;

fragment UsageCompletion:
	ValuePart? UsageBody
;

fragment UsageBody:
	DefinitionBody
;

ReferenceKeyword returns string:
	'ref'
;

ReferenceUsageKeyword returns string:
	ReferenceKeyword
;

DefaultReferenceUsage:
	{infer ReferenceUsage}
	( isEnd ?= 'end' )? RefPrefix 
	UsageDeclaration ValuePart? UsageBody
;

ReferenceUsage:
	{infer ReferenceUsage}
	( EndUsagePrefix | RefPrefix) 
	ReferenceUsageKeyword UsageCore
;

VariantReference:
	{infer ReferenceUsage}
	ownedRelationship += OwnedReferenceSubsetting 
	FeatureSpecialization* UsageBody
;

/* Body Elements */

// GRAM-006: ReferenceUsage first, 'var' is NOT a keyword
NonOccurrenceUsageElement:
	  {infer UsageCore}
	  DefaultReferenceUsage
	| ReferenceUsage
	| AttributeUsage
	| EnumerationUsage
	| BindingConnectorAsUsage
	| SuccessionAsUsage
	| ExtendedUsage
;

OccurrenceUsageElement:
	{infer UsageCore}
	StructureUsageElement | BehaviorUsageElement
;

StructureUsageElement:
	  {infer UsageCore}
	  OccurrenceUsage
	| IndividualUsage
	| PortionUsage
	| EventOccurrenceUsage
	| ItemUsage
	| PartUsage
	| ViewUsage
	| RenderingUsage
	| PortUsage
	| ConnectionUsage
	| InterfaceUsage
	| AllocationUsage
	| Message
	| FlowUsage
	| SuccessionFlowUsage
;

// GRAM-025: Added WhileLoopUsage and ForLoopUsage
BehaviorUsageElement:
	  {infer Usage}
	  // GRAM-035: ActionAssignUsage for 'action name assign' pattern
	  ActionAssignUsage
	| WhileLoopUsage
	| ForLoopUsage
	| ActionUsage
	| CalculationUsage
	| StateUsage
	| ConstraintUsage
	| RequirementUsage
	| ConcernUsage
	| CaseUsage
	| AnalysisCaseUsage
	| VerificationCaseUsage
	| UseCaseUsage
	| ViewpointUsage
	| PerformActionUsage
	| ExhibitStateUsage
	| IncludeUseCaseUsage
	| AssertConstraintUsage
	| SatisfyRequirementUsage
;

// GRAM-025: Top-level while/loop action
WhileLoopUsage:
	{infer WhileLoopActionUsage}
	OccurrenceUsagePrefix ActionUsageKeyword UsageDeclaration?
	( 'while' ownedRelationship += ExpressionParameterMember
	| 'loop' ownedRelationship += EmptyParameterMember
	)
	ownedRelationship += ActionBodyParameterMember
	( 'until' ownedRelationship += ExpressionParameterMember ';' )?
;
// GRAM-025: Top-level for loop action
ForLoopUsage:
	{infer ForLoopActionUsage}
	OccurrenceUsagePrefix ActionUsageKeyword UsageDeclaration?
	'for' ownedRelationship += ForVariableDeclarationMember
	'in' ownedRelationship += NodeParameterMember
	ownedRelationship += ActionBodyParameterMember
;

VariantUsageElement:
	  {infer UsageCore}
	  VariantReference
	| ReferenceUsage
	| AttributeUsage
	| BindingConnectorAsUsage
	| SuccessionAsUsage
	| OccurrenceUsage
	| IndividualUsage
	| PortionUsage
	| EventOccurrenceUsage
	| ItemUsage
	| PartUsage
	| ViewUsage
	| RenderingUsage
	| PortUsage
	| ConnectionUsage
	| InterfaceUsage
	| AllocationUsage
	| Message
	| FlowUsage
	| SuccessionFlowUsage
	| BehaviorUsageElement
;

/* EXTENSION */

ExtendedDefinition:
	{infer DefinitionCore}
	BasicDefinitionPrefix? DefinitionExtensionKeyword+ 'def' DefinitionCore
;

ExtendedUsage:
	{infer UsageCore}
	UnextendedUsagePrefix UsageExtensionKeyword+ UsageCore
;

/* ATTRIBUTES */

AttributeKeyword returns string:
	'attribute'
;

AttributeDefKeyword returns string:
	AttributeKeyword 'def'
;

AttributeUsageKeyword returns string:
	AttributeKeyword
;

AttributeDefinition:
	{infer AttributeDefinition}
	DefinitionPrefix AttributeDefKeyword DefinitionCore
;

AttributeUsage:
	{infer AttributeUsage}
	UsagePrefix AttributeUsageKeyword UsageCore
;

/* ENUMERATIONS */

EnumerationKeyword returns string:
	'enum'
;
EnumerationDefKeyword returns string:
	EnumerationKeyword 'def'
;

EnumerationUsageKeyword returns string:
	EnumerationKeyword
;

EnumerationDefinition:
	{infer EnumerationDefinition}
	DefinitionExtensionKeyword*
	EnumerationDefKeyword DefinitionDeclaration EnumerationBody
;

fragment EnumerationBody:
	  ';' 
	| '{' ( ownedRelationship += AnnotatingMember
		  | ownedRelationship += EnumerationUsageMember 
		  )* 
	  '}'
;

EnumerationUsageMember:
	{infer VariantMembership}
	MemberPrefix ownedRelatedElement += EnumeratedValue 
;

EnumeratedValue:
	{infer EnumerationUsage}
	UsageExtensionKeyword* EnumerationUsageKeyword? UsageCore
;

EnumerationUsage:
	{infer EnumerationUsage}
	UsagePrefix EnumerationUsageKeyword UsageCore
;

/* OCCURRENCES */

/* Occurrence Definitions */

OccurrenceKeyword returns string:
	'occurrence'
;

OccurrenceDefKeyword returns string:
	OccurrenceKeyword 'def'
;

fragment OccurrenceDefinitionPrefix:
	BasicDefinitionPrefix?
	( isIndividual ?= 'individual' 
	  ownedRelationship += EmptyMultiplicityMember
	)?
	DefinitionExtensionKeyword*
;

OccurrenceDefinition:
	{infer OccurrenceDefinition}
	OccurrenceDefinitionPrefix OccurrenceDefKeyword DefinitionCore
;

IndividualDefinition:
	{infer OccurrenceDefinition}
	BasicDefinitionPrefix? isIndividual ?= 'individual' 
	ownedRelationship += EmptyMultiplicityMember
	DefinitionExtensionKeyword* 'def' DefinitionCore
;

EmptyMultiplicityMember:
        {infer OwningMembership}
        ownedRelatedElement += EmptyMultiplicity
;

EmptyMultiplicity:
	{infer Multiplicity}
;

/* Occurrence Usages */

OccurrenceUsageKeyword returns string:
	OccurrenceKeyword
;

fragment OccurrenceUsagePrefix:
	( EndUsagePrefix
	| BasicUsagePrefix
	  ( isIndividual ?= 'individual' )?
	  ( portionKind = PortionKind )?
	)
	UsageExtensionKeyword*
;

OccurrenceUsage:
	{infer OccurrenceUsage}
	OccurrenceUsagePrefix OccurrenceUsageKeyword UsageCore
;

IndividualUsage:
	{infer OccurrenceUsage}
	BasicUsagePrefix isIndividual ?= 'individual' 
	UsageExtensionKeyword* UsageCore
;

PortionUsage:
	{infer OccurrenceUsage}
	BasicUsagePrefix ( isIndividual ?= 'individual' )?
	portionKind = PortionKind
	UsageExtensionKeyword* UsageCore
;

PortionKind returns string:
	'snapshot' | 'timeslice';

EventOccurrenceUsage:
	 {infer EventOccurrenceUsage}
	 OccurrenceUsagePrefix 'event'
	( ownedRelationship += OwnedReferenceSubsetting FeatureSpecializationPart?
   	| OccurrenceUsageKeyword UsageDeclaration? )
    UsageCompletion
;

/* Occurrence Successions */

EmptySuccessionMember:
	{infer FeatureMembership}
	ownedRelatedElement += EmptySuccession
;

// MINING-001: Simplified EmptySuccession for Langium compatibility
// Reference grammar has: 'then' MultiplicitySourceEndMember EmptyTargetEndMember
// But Langium doesn't handle empty rules ({infer} only) well in this context.
// Langium-idiomatic fix: make MultiplicitySourceEndMember optional, remove EmptyTargetEndMember.
// This allows 'then <next-usage>' patterns in DefinitionBodyItem.
EmptySuccession:
	{infer SuccessionAsUsage}
	'then' ( ownedRelationship += MultiplicitySourceEndMember )?
;

MultiplicitySourceEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += MultiplicitySourceEnd 
;

// PROB-001 Fix: Keep {infer} but make OwnedMultiplicity REQUIRED
// This prevents the rule from matching empty strings, allowing EmptySuccession
// to complete with just 'then' when no [...] multiplicity follows.
// Known Langium limitation: rules that can match empty strings don't always work
MultiplicitySourceEnd:
	{infer ReferenceUsage}
	ownedRelationship += OwnedMultiplicity
;

EmptyTargetEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += EmptyTargetEnd 
;

EmptyTargetEnd:
	{infer ReferenceUsage}
;

/* ITEMS */

ItemKeyword returns string:
	'item'
;

ItemDefKeyword returns string:
	ItemKeyword 'def'
;

ItemUsageKeyword returns string:
	ItemKeyword
;

ItemDefinition:
	{infer ItemDefinition}
	OccurrenceDefinitionPrefix ItemDefKeyword DefinitionCore
;

ItemUsage:
	{infer ItemUsage}
	OccurrenceUsagePrefix ItemUsageKeyword UsageCore
;

/* PARTS */

PartKeyword returns string:
	'part'
;

PartDefKeyword returns string:
	PartKeyword 'def'
;

PartUsageKeyword returns string:
	PartKeyword
;

PartDefinition:
	{infer PartDefinition}
	OccurrenceDefinitionPrefix PartDefKeyword DefinitionCore
;

PartUsage:
	{infer PartUsage}
	OccurrenceUsagePrefix PartUsageKeyword UsageCore
;

/* PORTS */

/* Port Definitions */

PortKeyword returns string:
	'port'
;

PortDefKeyword returns string:
	PortKeyword 'def'
;

PortDefinition:
	{infer PortDefinition}
	DefinitionPrefix PortDefKeyword DefinitionCore
	ownedRelationship += ConjugatedPortDefinitionMember
;

ConjugatedPortDefinitionMember:
	{infer OwningMembership}
	ownedRelatedElement += ConjugatedPortDefinition 
;

ConjugatedPortDefinition:
	{infer ConjugatedPortDefinition}
	ownedRelationship += PortConjugation
;

PortConjugation:
	{infer PortConjugation}
;

ConjugatedPortTyping:
	{infer ConjugatedPortTyping}
	conjugatedPortDefinition = [ConjugatedPortDefinition:ConjugatedQualifiedName]
;

ConjugatedQualifiedName returns string:
	'~' QualifiedName
;

/* Port Usages */

PortUsageKeyword returns string:
	PortKeyword
;

PortUsage:
	{infer PortUsage}
	OccurrenceUsagePrefix PortUsageKeyword UsageCore
;

OwnedCrossMultiplicityMember:
	{infer OwningMembership}
	ownedRelatedElement += OwnedCrossMultiplicity
;

OwnedCrossMultiplicity:
	{infer Feature}
	ownedRelationship += OwnedMultiplicity
;

/* Binding Connectors */

BindingKeyword returns string:
	'binding'
;

BindingConnectorAsUsage:
	{infer BindingConnectorAsUsage}
	UsagePrefix ( BindingKeyword UsageDeclaration? )?
	'bind' ownedRelationship += ConnectorEndMember 
	'=' ownedRelationship += ConnectorEndMember 
	DefinitionBody	
;

/* Successions */

SuccessionKeyword returns string:
	'succession'
;

SuccessionAsUsage:
	{infer SuccessionAsUsage}
	UsagePrefix ( SuccessionKeyword UsageDeclaration? )? 
	'first' ownedRelationship += ConnectorEndMember 
	( 'if' ownedRelationship += IfGuardExpressionBody )?
	'then' ownedRelationship += ConnectorEndMember
	DefinitionBody
;

/* Connection Definitions */

ConnectionKeyword returns string:
	'connection'
;

ConnectionDefKeyword returns string:
	ConnectionKeyword 'def' 
;

ConnectionDefinition:
	{infer ConnectionDefinition}
	OccurrenceDefinitionPrefix ConnectionDefKeyword DefinitionCore
;

/* Connection Usages */

ConnectorKeyword returns string:
	'connect'
;

ConnectionUsageKeyword returns string:
	ConnectionKeyword
;

ConnectionUsage:
	{infer ConnectionUsage}
	OccurrenceUsagePrefix 
	( ConnectionUsageKeyword UsageDeclaration? ValuePart?
	  ( ConnectorKeyword ConnectorPart )? 
	| ConnectorKeyword ConnectorPart
	) UsageBody
;

fragment ConnectorPart:
	BinaryConnectorPart | NaryConnectorPart
;

fragment BinaryConnectorPart:
	ownedRelationship += ConnectorEndMember 'to' 
	ownedRelationship += ConnectorEndMember
;

fragment NaryConnectorPart:
	'(' ownedRelationship += ConnectorEndMember ',' 
	    ownedRelationship += ConnectorEndMember
	    ( ',' ownedRelationship += ConnectorEndMember )* ')'
;

EmptySourceEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += EmptySourceEnd 
;

EmptySourceEnd:
	{infer ReferenceUsage}
;

/* INTERFACES */

/* Interface Definitions */

InterfaceKeyword returns string:
	'interface'
;

InterfaceDefKeyword returns string:
	InterfaceKeyword 'def'
;

InterfaceDefinition:
	{infer InterfaceDefinition}
	OccurrenceDefinitionPrefix InterfaceDefKeyword DefinitionDeclaration InterfaceBody
;

fragment InterfaceBody:
	';' | '{' InterfaceBodyItem* '}'
;

fragment InterfaceBodyItem:
	  ownedRelationship += DefinitionMember 
	| ownedRelationship += VariantUsageMember
	| ownedRelationship += InterfaceNonOccurrenceUsageMember
	| ( ownedRelationship += EmptySuccessionMember )?
	  ownedRelationship += InterfaceOccurrenceUsageMember
	| ownedRelationship += AliasMember
	| ownedRelationship += Import
;

InterfaceNonOccurrenceUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += InterfaceNonOccurrenceUsageElement 
;

InterfaceNonOccurrenceUsageElement:
	  {infer UsageCore}
	  ReferenceUsage
	| AttributeUsage
	| EnumerationUsage
	| BindingConnectorAsUsage
	| SuccessionAsUsage
;

InterfaceOccurrenceUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += InterfaceOccurrenceUsageElement 
;

InterfaceOccurrenceUsageElement:
	{infer UsageCore}
	DefaultInterfaceEnd | StructureUsageElement | BehaviorUsageElement
;

DefaultInterfaceEnd:
    {infer PortUsage}
    isEnd ?= 'end' UsageCore
;

/* Interface Usages */

InterfaceUsageKeyword returns string:
	InterfaceKeyword
;

InterfaceUsage:
	{infer InterfaceUsage}
	OccurrenceUsagePrefix InterfaceUsageKeyword InterfaceUsageDeclaration InterfaceBody
;

fragment InterfaceUsageDeclaration:
	UsageDeclaration? ( ConnectorKeyword InterfacePart )? | InterfacePart
;

fragment InterfacePart:
	BinaryInterfacePart | NaryInterfacePart
;

fragment BinaryInterfacePart:
	ownedRelationship += InterfaceEndMember 'to' 
	ownedRelationship += InterfaceEndMember
;

fragment NaryInterfacePart:
	'(' ownedRelationship += InterfaceEndMember ',' 
	    ownedRelationship += InterfaceEndMember
	    ( ',' ownedRelationship += InterfaceEndMember )* ')'
;

InterfaceEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += InterfaceEnd 
;

InterfaceEnd:
	{infer PortUsage}
	( ownedRelationship += OwnedCrossMultiplicityMember )?
	( declaredName = Name ReferencesKeyword )? 
	ownedRelationship += OwnedReferenceSubsetting
;

/* ALLOCATIONS */

/* Allocation Definitions */

AllocationKeyword returns string:
	'allocation'
;

AllocationDefKeyword returns string:
	AllocationKeyword 'def'
;

AllocationDefinition:
	{infer AllocationDefinition}
	OccurrenceDefinitionPrefix AllocationDefKeyword DefinitionCore
;

/* AllocationUsage Usages */

AllocationUsageKeyword returns string:
	AllocationKeyword
;

AllocateKeyword returns string:
	'allocate'
;

AllocationUsage:
	{infer AllocationUsage}
	OccurrenceUsagePrefix AllocationUsageDeclaration UsageBody
;

fragment AllocationUsageDeclaration:
	    AllocationUsageKeyword UsageDeclaration? ( AllocateKeyword ConnectorPart )?
	  | AllocateKeyword ConnectorPart
;

/* FLOWS */

/* Flow Definitions */

FlowKeyword returns string:
	'flow'
;

FlowDefKeyword returns string:
	FlowKeyword 'def'
;

FlowDefinition:
	{infer FlowDefinition}
	OccurrenceDefinitionPrefix FlowDefKeyword DefinitionCore
;

/* Messages */

MessageKeyword returns string:
	'message'
;

Message:
	{infer FlowUsage}
	OccurrenceUsagePrefix MessageKeyword MessageDeclaration DefinitionBody
;

fragment MessageDeclaration:
	  UsageDeclaration? ValuePart?
      ( 'of' ownedRelationship += PayloadFeatureMember )?
      ( 'from' ownedRelationship += MessageEventMember 
        'to' ownedRelationship += MessageEventMember
      )?
    | ownedRelationship += MessageEventMember 'to' 
	  ownedRelationship += MessageEventMember
;

MessageEventMember:
	{infer ParameterMembership}
	ownedRelatedElement += MessageEvent 
;

MessageEvent:
	{infer EventOccurrenceUsage}
	ownedRelationship += OwnedReferenceSubsetting
;

/* Flow Usages */

FlowUsage:
	{infer FlowUsage}
	OccurrenceUsagePrefix FlowKeyword 
	FlowDeclaration DefinitionBody
;

SuccessionFlowKeyword returns string:
	SuccessionKeyword FlowKeyword
;

SuccessionFlowUsage:
	{infer SuccessionFlowUsage}
	OccurrenceUsagePrefix SuccessionFlowKeyword 
	FlowDeclaration DefinitionBody
;

fragment Payload:
	  Identification? PayloadFeatureSpecializationPart ValuePart?
	| Identification? ValuePart
    | ownedRelationship += OwnedFeatureTyping ( ownedRelationship += OwnedMultiplicity )?
    | ownedRelationship += OwnedMultiplicity ownedRelationship += OwnedFeatureTyping
;

ActionKeyword returns string:
	'action'
;

ActionDefKeyword returns string:
	ActionKeyword 'def'
;

ActionDefinition:
	{infer ActionDefinition}
	OccurrenceDefinitionPrefix ActionDefKeyword DefinitionDeclaration ActionBody
;

fragment ActionBody:
	  ';' 
	  // Note: Using a syntactic predicate here seems to avoid a possible infinite loop
	  // while incrementally parsing.
	| '{' ActionBodyItem* '}' 
;

// GRAM-009: Removed => predicates to allow backtracking
// MINING-002: EmptySuccessionMember as standalone alternative
// When 'then' is followed by a usage (like 'include use case'), these are parsed as
// TWO separate members: first EmptySuccessionMember, then the usage member.
// This fixes 'then include use case' patterns.
// CRITICAL: EmptySuccessionMember must come BEFORE TargetSuccessionMember, otherwise
// 'then include' patterns fail because TargetSuccessionMember greedily consumes 'then'.
fragment ActionBodyItem:
	  ownedRelationship += Import
	| ownedRelationship += AliasMember
	| ownedRelationship += DefinitionMember
	| ownedRelationship += VariantUsageMember
	| ownedRelationship += NonOccurrenceUsageMember
	| ownedRelationship += InitialNodeMember
	// GRAM-023: Standalone guarded succession patterns (if ... then ...; else ...;)
	// 'else' is unambiguous (only used for default succession).
	| ownedRelationship += StandaloneDefaultSuccessionMember
	// 'if' patterns: either guarded succession (if expr then target;) or IfNode (if expr { body })
	// CombinedIfMember handles both cases by parsing 'if' expr, then branching on 'then' vs '{'
	| ownedRelationship += CombinedIfMember
	// MINING-002: EmptySuccessionMember MUST precede TargetSuccessionMember and usage members
	| ownedRelationship += EmptySuccessionMember
	| ownedRelationship += StructureUsageMember
	| ownedRelationship += BehaviorUsageMember
	| ownedRelationship += ActionNodeMember
	// MINING-002: TargetSuccessionMember MUST be LAST
	// It greedily consumes 'then' and expects a target reference, not a usage
	| ownedRelationship += TargetSuccessionMember
;

InitialNodeMember:
	{infer Membership}
	MemberPrefix 'first' memberElement = [Feature:QualifiedName]
	RelationshipBody	
;

ActionNodeMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += ActionNode 
;

// GRAM-011: Removed MemberPrefix to avoid consuming visibility
// GRAM-033: Put distinctive token FIRST in each alternative (before {infer})
// This ensures parser can distinguish alternatives before committing via {infer}
TargetSuccessionMember:
	  ThenSuccessionMemberKeyword
	| IfGuardSuccessionMemberKeyword
	| BracketGuardSuccessionMemberKeyword
	| ElseSuccessionMemberKeyword
;

// GRAM-033: Each alternative starts with its distinctive keyword, then {infer}
ThenSuccessionMemberKeyword:
	'then' {infer FeatureMembership}
	ownedRelatedElement += ThenActionTargetSuccessionBody
;

IfGuardSuccessionMemberKeyword:
	'if' {infer FeatureMembership}
	ownedRelatedElement += IfGuardedTargetSuccessionBody
;

BracketGuardSuccessionMemberKeyword:
	'[' {infer FeatureMembership}
	ownedRelatedElement += BracketGuardedTargetSuccessionBody
;

ElseSuccessionMemberKeyword:
	'else' {infer FeatureMembership}
	ownedRelatedElement += DefaultTargetSuccessionBody
;

// GRAM-033: Succession bodies (after keyword is consumed)
ThenActionTargetSuccessionBody:
	  InlineTargetSuccessionBody  // 'then' already consumed, continues with inline target
	| TargetSuccessionBody UsageBody  // 'then' already consumed, continues with target reference
;

// Body of InlineTargetSuccession after 'then' is consumed
InlineTargetSuccessionBody:
	{infer SuccessionAsUsage}
	ownedRelationship += MultiplicitySourceEndMember
	ownedRelationship += InlineActionTargetMember
;

// Body of TargetSuccession after 'then' is consumed
TargetSuccessionBody:
	{infer SuccessionAsUsage}
	ownedRelationship += MultiplicitySourceEndMember
	ownedRelationship += ConnectorEndMember
;

IfGuardedTargetSuccessionBody:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	ownedRelationship += IfGuardExpressionBody  // Expression (without 'if' - already consumed)
	'then' ownedRelationship += TransitionSuccessionMember
	UsageBody
;

BracketGuardedTargetSuccessionBody:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	ownedRelationship += BracketGuardExpressionBody  // Expression (after '[' - continues with expr])
	'then' ownedRelationship += TransitionSuccessionMember
	UsageBody
;

DefaultTargetSuccessionBody:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	ownedRelationship += TransitionSuccessionMember  // 'else' already consumed
	UsageBody
;

// GRAM-033: Expression bodies after keyword is consumed
// The 'if' keyword was already consumed by the parent rule
IfGuardExpressionBody:
	{infer TransitionFeatureMembership}
	ownedRelatedElement += OwnedExpression
;

// The '[' was already consumed by the parent rule; we still need ']' at the end
BracketGuardExpressionBody:
	{infer TransitionFeatureMembership}
	ownedRelatedElement += OwnedExpression ']'
;

// GRAM-023: CombinedIfMember handles both if patterns
CombinedIfMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += CombinedIfNode
;
// GRAM-023: CombinedIfNode handles both guarded succession and if-action patterns
CombinedIfNode:
	{infer TransitionUsage}
	ActionNodePrefix
	'if' ownedRelationship += ExpressionParameterMember
	(
		// Guarded succession: if expr then target;
		'then' ownedRelationship += TransitionSuccessionMember ';'
		( 'else' ownedRelationship += TransitionSuccessionMember ';' )?
	|
		// If-action: if expr { body } [else ...]
		{infer IfActionUsage}
		ownedRelationship += ActionBodyParameterMember
		( 'else' ownedRelationship += ( ActionBodyParameterMember | IfNodeParameterMember ) )?
	)
;
// GRAM-023: Standalone guarded succession members
StandaloneGuardedSuccessionMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += StandaloneGuardedSuccession
;
StandaloneGuardedSuccession:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	ownedRelationship += GuardExpressionMember
	'then' ownedRelationship += TransitionSuccessionMember
	';'
;
// GRAM-023: Default succession as standalone action body item
StandaloneDefaultSuccessionMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += StandaloneDefaultSuccession
;
StandaloneDefaultSuccession:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	'else' ownedRelationship += TransitionSuccessionMember
	';'
;

GuardedSuccessionMember:
	{infer FeatureMembership}
	ownedRelatedElement += GuardedSuccession 
;

/* Action Usages */

ActionUsageKeyword returns string:
	ActionKeyword
;

ActionUsage:
	{infer ActionUsage}
	OccurrenceUsagePrefix ActionUsageKeyword ActionUsageDeclaration ActionBody
;

PerformActionUsage:
	{infer PerformActionUsage}
	OccurrenceUsagePrefix 'perform' PerformActionUsageDeclaration ActionBody
;

fragment PerformActionUsageDeclaration:
   	( ownedRelationship += OwnedReferenceSubsetting FeatureSpecializationPart?
   	| ActionUsageKeyword UsageDeclaration? )
    ValuePart?
;

fragment ActionUsageDeclaration:
	  UsageDeclaration? ValuePart?
;

/* Action Nodes */

// GRAM-035: AssignmentNode first to ensure 'assign' is recognized
ActionNode:
	  AssignmentNode
	| SendNode
	| AcceptNode
	| IfNode | WhileLoopNode | ForLoopNode
	| TerminateNode
	| ControlNode
;


fragment ActionNodeUsageDeclaration:
	ActionUsageKeyword UsageDeclaration?
;

fragment ActionNodePrefix:
	OccurrenceUsagePrefix ActionNodeUsageDeclaration?
;

AcceptNode:
	{infer AcceptActionUsage}
	OccurrenceUsagePrefix AcceptNodeDeclaration ActionBody
;

fragment AcceptNodeDeclaration:
	ActionNodeUsageDeclaration? 'accept' AcceptParameterPart
;

fragment AcceptParameterPart:
	ownedRelationship += PayloadParameterMember
	( 'via' ownedRelationship += NodeParameterMember )?
;

PayloadParameterMember:
	{infer ParameterMembership}
	ownedRelatedElement += PayloadParameter 
;

PayloadParameter:
	  {infer ReferenceUsage}
	  Payload
	| Identification? PayloadFeatureSpecializationPart? TriggerValuePart
;

fragment TriggerValuePart:
	ownedRelationship += TriggerFeatureValue
;

TriggerFeatureValue:
	{infer FeatureValue}
	ownedRelatedElement += TriggerExpression
;

TriggerExpression:
	  {infer TriggerInvocationExpression}
	  kind = TimeTriggerKind
	  ownedRelationship += ArgumentMember
	| kind = ChangeTriggerKind
	  ownedRelationship += ArgumentExpressionMember
;

TimeTriggerKind returns string:
	'at' | 'after'
;

ChangeTriggerKind returns string:
	'when'
;

ArgumentExpressionMember:
    {infer ParameterMembership}
    ownedRelatedElement += ArgumentExpression
;

ArgumentExpression:
    {infer Feature}
    ownedRelationship += ArgumentExpressionValue
;

ArgumentExpressionValue:
    {infer FeatureValue}
    ownedRelatedElement += OwnedExpressionReference
;

SendNode:
	{infer SendActionUsage}
	OccurrenceUsagePrefix ActionNodeUsageDeclaration? 'send' 
	( ActionBody
	| ( 
		( ownedRelationship += NodeParameterMember SenderReceiverPart?
	    | ownedRelationship += EmptyParameterMember SenderReceiverPart
	    )
	    ActionBody
	  )
	)
;

fragment SendNodeDeclaration:
	ActionNodeUsageDeclaration? 'send' 
	ownedRelationship += NodeParameterMember SenderReceiverPart?
;

fragment SenderReceiverPart:
	'via' ownedRelationship += NodeParameterMember 
	  ( 'to' ownedRelationship += NodeParameterMember )?
	| ownedRelationship += EmptyParameterMember
	  'to' ownedRelationship += NodeParameterMember
;

NodeParameterMember:
	{infer ParameterMembership}
	ownedRelatedElement += NodeParameter 
;

NodeParameter:
	{infer ReferenceUsage}
	ownedRelationship += FeatureBinding
;

FeatureBinding:
	{infer FeatureValue}
	ownedRelatedElement += OwnedExpression
;

AssignmentNode:
	{infer AssignmentActionUsage}
	OccurrenceUsagePrefix AssignmentNodeDeclaration ActionBody
;
// GRAM-035: Top-level assignment action usage
// Pattern: 'action name assign target := value;' at package level
ActionAssignUsage:
	{infer AssignmentActionUsage}
	OccurrenceUsagePrefix AssignmentNodeDeclaration ActionBody
;


// GRAM-035: Restructured to handle chained (tgt.rfnt) and simple (x) cases
// The '.' is now explicit, with predicate to distinguish cases
fragment AssignmentNodeDeclaration:
	ActionNodeUsageDeclaration? 'assign'
	// Optional chained target: 'base.' prefix
	( ( Name '.' ) ownedRelationship += AssignmentTargetMember '.' )?
	// Feature being assigned (rfnt or x)
	ownedRelationship += FeatureChainMember
	':='
	ownedRelationship += NodeParameterMember
;


AssignmentTargetMember:
	{infer ParameterMembership}
	ownedRelatedElement += TargetParameter 
;

// GRAM-035: Simplified - no predicate needed, always parse the binding
TargetParameter:
	{infer ReferenceUsage}
	ownedRelationship += TargetBinding
	ownedRelationship += TargetFeatureMember
;


TargetFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += TargetFeature 
;

TargetFeature:
	{infer ReferenceUsage}
	ownedRelationship += TargetAccessedFeatureMember
;

TargetAccessedFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += EmptyUsage 
;

TargetBinding:
	{infer FeatureValue}
	ownedRelatedElement += TargetExpression 
;

// GRAM-035: Simplified TargetExpression - don't consume dot chains
TargetExpression:
	{infer Expression}
	BaseExpression
;


ExpressionParameterMember:
	{infer ParameterMembership}
	ownedRelatedElement += OwnedExpression 
;

IfNode:
	{infer IfActionUsage}
	ActionNodePrefix 
	'if' ownedRelationship += ExpressionParameterMember
	ownedRelationship += ActionBodyParameterMember
	( 'else' ownedRelationship += ( ActionBodyParameterMember | IfNodeParameterMember ) )?
;

ActionBodyParameterMember:
	{infer ParameterMembership}
	ownedRelatedElement += ActionBodyParameter 
;

ActionBodyParameter:
	{infer ActionUsage} ( ActionUsageKeyword UsageDeclaration? )? '{' ActionBodyItem* '}'
;

IfNodeParameterMember:
	{infer ParameterMembership}
	ownedRelatedElement += IfNode 
;

WhileLoopNode:
	{infer WhileLoopActionUsage}
	ActionNodePrefix
	( 'while' ownedRelationship += ExpressionParameterMember
	| 'loop' ownedRelationship += EmptyParameterMember
	)
	ownedRelationship += ActionBodyParameterMember
	( 'until' ownedRelationship += ExpressionParameterMember ';' )?
;

ForLoopNode:
	{infer ForLoopActionUsage}
	ActionNodePrefix
	'for' ownedRelationship += ForVariableDeclarationMember
	'in' ownedRelationship += NodeParameterMember
	ownedRelationship += ActionBodyParameterMember
;


ForVariableDeclarationMember:
	{infer FeatureMembership}
	ownedRelatedElement += ForVariableDeclaration 
;


ForVariableDeclaration:
	{infer ReferenceUsage}
	UsageDeclaration
;

TerminateNode:
	{infer TerminateActionUsage}
	OccurrenceUsagePrefix ActionNodeUsageDeclaration? 
	'terminate' 
	( ActionBody
	| ownedRelationship += NodeParameterMember
	  ActionBody
	)
;

ControlNode:
	  {infer ControlNode}
	  MergeNode
	| DecisionNode
	| JoinNode
	| ForkNode
;

fragment ControlNodePrefix:
	  RefPrefix
	  ( isIndividual ?= 'individual' )?
	  ( portionKind = PortionKind )?
	  UsageExtensionKeyword*
;

MergeNode:
	{infer MergeNode}
	ControlNodePrefix 
	isComposite ?= 'merge' UsageDeclaration?
	ActionBody
;

DecisionNode:
	{infer DecisionNode}
	ControlNodePrefix 
	isComposite ?= 'decide' UsageDeclaration?
	ActionBody
;

JoinNode:
	{infer JoinNode}
	ControlNodePrefix 
	isComposite ?= 'join' UsageDeclaration?
	ActionBody
;

ForkNode:
	{infer ForkNode}
	ControlNodePrefix 
	isComposite ?= 'fork' UsageDeclaration?
	ActionBody
;

EmptyParameterMember:
	{infer ParameterMembership}
	ownedRelatedElement += EmptyUsage 
;

EmptyUsage:
	{infer ReferenceUsage}
;

/* Action Successions */

// GRAM-012: ActionTargetSuccession with inline action support
ActionTargetSuccession:
	{infer Usage}
	(
		// 'if' pattern: guarded succession (branch after decide)
		GuardedTargetSuccession UsageBody
	|
		// 'else' pattern: default succession (else branch after decide)
		DefaultTargetSuccession UsageBody
	|
		// 'then' patterns with inline actions (then action x { }, then assign x := v;)
		InlineTargetSuccession
	|
		// 'then' patterns with references (then x;)
		TargetSuccession UsageBody
	)
;

TargetSuccession:
	{infer SuccessionAsUsage}
	ownedRelationship += MultiplicitySourceEndMember
	'then' ownedRelationship += ConnectorEndMember
;
// GRAM-012: Inline succession where target is an ActionNode
InlineTargetSuccession:
	{infer SuccessionAsUsage}
	ownedRelationship += MultiplicitySourceEndMember
	'then' ownedRelationship += InlineActionTargetMember
;
// GRAM-012: Member wrapper for inline action targets
InlineActionTargetMember:
	{infer EndFeatureMembership}
	MemberPrefix ownedRelatedElement += ( ActionNode | ActionUsage )
;


GuardedTargetSuccession:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	ownedRelationship += GuardExpressionMember
	'then' ownedRelationship += TransitionSuccessionMember
;

DefaultTargetSuccession:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	'else' ownedRelationship += TransitionSuccessionMember
;

GuardedSuccession:
	{infer TransitionUsage}
	( SuccessionKeyword UsageDeclaration )? 'first'
	ownedRelationship += TransitionSourceMember 
	ownedRelationship += EmptyParameterMember
	ownedRelationship += GuardExpressionMember
	'then' ownedRelationship += TransitionSuccessionMember
	UsageBody
;

/* STATES */

/* State Definitions */

StateKeyword returns string:
	'state'
;

StateDefKeyword returns string:
	StateKeyword 'def'
;

StateDefinition:
	{infer StateDefinition}
	OccurrenceDefinitionPrefix StateDefKeyword DefinitionDeclaration StateDefBody
;

fragment StateDefBody:
	';' | ( isParallel ?= 'parallel' )? '{' StateBodyPart '}'
;

fragment StateBodyPart:
	// Note: Using a syntactic predicate here seems to avoid a possible infinite loop
	// while incrementally parsing.
	StateBodyItem*
;

fragment StateBodyItem:
    // Standard alternatives - metadata and definitions first
      ownedRelationship += Import
    | ownedRelationship += AliasMember
    | ownedRelationship += DefinitionMember
    | ownedRelationship += VariantUsageMember
    | ownedRelationship += NonOccurrenceUsageMember
    // MINING-003: EmptySuccessionMember MUST precede StructureUsageMember/BehaviorUsageMember
    // Same pattern as MINING-002 for ActionBodyItem. Handles `then state stateB;` by parsing
    // `then` as empty succession, then `state stateB;` as behavior usage.
    | ownedRelationship += EmptySuccessionMember
    | ownedRelationship += StructureUsageMember
    | ownedRelationship += BehaviorUsageMember
    | ownedRelationship += ActionNodeMember
    // Keyword-first succession alternatives - after usage members
    // MINING-003: StateThenSuccessionMember MUST be AFTER usage members
    // It handles `then <reference>;` patterns and would greedily consume `then` before
    // EmptySuccessionMember could handle `then <usage>` patterns.
    | ownedRelationship += StateThenSuccessionMember
    | ownedRelationship += StateAcceptSuccessionMember
    | ownedRelationship += StateIfSuccessionMember
    | ownedRelationship += StateBracketSuccessionMember
    | ownedRelationship += TransitionUsageMember
    // ADR-001: Entry/do/exit predicates
    | ownedRelationship += EntryActionMember
      ( ownedRelationship += EntryTransitionMember )*
    | ownedRelationship += DoActionMember
    | ownedRelationship += ExitActionMember
;

EntryActionMember:
	{infer StateSubactionMembership}
	MemberPrefix kind = EntryActionKind ownedRelatedElement += StateActionUsage 
;

EntryActionKind returns string:
	'entry'
;

DoActionMember:
	{infer StateSubactionMembership}
	MemberPrefix kind = DoActionKind ownedRelatedElement += StateActionUsage 
;

DoActionKind returns string:
	'do'
;

ExitActionMember:
	{infer StateSubactionMembership}
	MemberPrefix kind = ExitActionKind ownedRelatedElement += StateActionUsage 
;

ExitActionKind returns string:
	'exit'
;

EntryTransitionMember:
	{infer FeatureMembership}
	MemberPrefix 
	( ownedRelatedElement += GuardedTargetSuccession 
	| 'then' ownedRelatedElement += TransitionSuccession 
	) ';'
;

StateActionUsage:
	EmptyActionUsage ';' | PerformedActionUsage ActionBody
;

EmptyActionUsage:
	{infer ActionUsage}
;

PerformedActionUsage:
	  {infer ActionUsage}
	  {infer PerformActionUsage} PerformActionUsageDeclaration 
	| {infer AcceptActionUsage} AcceptNodeDeclaration 
	| {infer SendActionUsage} SendNodeDeclaration
	| {infer AssignmentActionUsage} AssignmentNodeDeclaration
;

TransitionUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += TransitionUsage 
;

TargetTransitionUsageMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += TargetTransitionUsage 
;

// GRAM-036: Guard predicate for TargetTransitionUsageMember
// Matches valid target transition patterns but NOT full 'transition source then target'
TargetTransitionGuard returns string:
	// Valid patterns: 'then', 'accept...then', 'if...then', 'do...then'
	// Also 'transition' followed by trigger/guard/effect/then (not a source)
	  'then'
	| 'accept'
	| 'if' | '['
	| 'do'
	| 'else'
	| 'transition' ( 'then' | 'accept' | 'if' | '[' | 'do' )
;

/* State Usages */

StateUsageKeyword returns string:
	StateKeyword
;

StateUsage:
	{infer StateUsage}
	OccurrenceUsagePrefix StateUsageKeyword ActionUsageDeclaration StateUsageBody
;

fragment StateUsageBody:
	';' | ( isParallel ?= 'parallel' )? '{' StateBodyPart '}'
;

ExhibitStateUsage:
    {infer ExhibitStateUsage}
    OccurrenceUsagePrefix 'exhibit' 
    ( ownedRelationship += OwnedReferenceSubsetting FeatureSpecializationPart?
    | StateUsageKeyword UsageDeclaration?
    )
    ValuePart? StateUsageBody
;

/* Transition Usages */

TransitionUsageKeyword returns string:
	'transition'
;

// GRAM-036: TransitionUsage with named transition support
// Valid patterns:
// 1. 'transition name first source then target;' - named with first
// 2. 'transition first source then target;' - anonymous with first
// 3. 'transition source then target;' - anonymous without first
TransitionUsage:
	{infer TransitionUsage}
	TransitionUsageKeyword
	// GRAM-036: Named transitions use (declaredName = Name) before 'first'
	// Order matters: named pattern first, then anonymous pattern
	( declaredName = Name 'first'
	| 'first'
	)?
	ownedRelationship += TransitionSourceMember
	ownedRelationship += EmptyParameterMember
	( ownedRelationship += EmptyParameterMember 
	  ownedRelationship += TriggerActionMember )?
	( ownedRelationship += GuardExpressionMember )?
	( ownedRelationship += EffectBehaviorMember )?
	'then' ownedRelationship += TransitionSuccessionMember
	ActionBody
;

// GRAM-036: TargetTransitionUsage for transitions attached to other actions
// Key difference from TransitionUsage: no source member
// The 'transition' keyword alternative uses predicate to avoid matching TransitionUsage patterns
TargetTransitionUsage:
	{infer TransitionUsage}
	ownedRelationship += EmptyParameterMember
	// Predicate: 'transition' only matches if followed by trigger/guard/effect/then, NOT a source name
	( ( TransitionUsageKeyword ( 'then' | 'accept' | 'if' | '[' | 'do' ) )
	  TransitionUsageKeyword
	  ( ownedRelationship += EmptyParameterMember
	    ownedRelationship += TriggerActionMember )?
	  ( ownedRelationship += GuardExpressionMember )?
	  ( ownedRelationship += EffectBehaviorMember )?
	| ownedRelationship += EmptyParameterMember 
	  ownedRelationship += TriggerActionMember
	  ( ownedRelationship += GuardExpressionMember )?
	  ( ownedRelationship += EffectBehaviorMember )?
	| ownedRelationship += GuardExpressionMember
	  ( ownedRelationship += EffectBehaviorMember )?
	)?
	'then' ownedRelationship += TransitionSuccessionMember
	ActionBody
;

TransitionSourceMember:
	  {infer Membership}
	  memberElement = [Feature:QualifiedName]
	| {infer OwningMembership} ownedRelatedElement += OwnedFeatureChain 
;

TriggerActionMember:
	{infer TransitionFeatureMembership}
	kind = TriggerFeatureKind ownedRelatedElement += TriggerAction 
;

TriggerFeatureKind returns string:
	'accept';

TriggerAction:
	{infer AcceptActionUsage}
	AcceptParameterPart
;

GuardExpressionMember:
	{infer TransitionFeatureMembership}
	kind = GuardFeatureKind ownedRelatedElement += OwnedExpression 
;

GuardFeatureKind returns string:
	'if';

EffectBehaviorMember:
	{infer TransitionFeatureMembership}
	kind = EffectFeatureKind ownedRelatedElement += EffectBehaviorUsage 
;

EffectFeatureKind returns string:
	'do';

EffectBehaviorUsage:
	  {infer ActionUsage}
	  EmptyActionUsage | PerformedActionUsage ( '{' ActionBodyItem* '}' )?
;

TransitionSuccessionMember:
	{infer OwningMembership}
	ownedRelatedElement += TransitionSuccession 
;

TransitionSuccession:
	{infer SuccessionAsUsage}
	ownedRelationship += EmptySourceEndMember 
	ownedRelationship += ConnectorEndMember
;



// GRAM-038: Keyword-first rules for StateBodyItem (ISSUE-001/002)

// Standalone target transition: then <target>;
// NOTE: We intentionally keep this token-first and narrow the post-then shape to a simple target reference.
// This avoids Chevrotain lookahead ambiguity caused by epsilon-heavy Succession/End-member rules.
StateThenSuccessionMember:
    'then' {infer FeatureMembership}
    ownedRelatedElement += StateThenTarget ';'
;

StateThenTarget:
    {infer ReferenceUsage}
    target = [Feature:QualifiedName]
;

// Accept...then target transitions in state bodies.
// IMPORTANT: Do NOT use MemberPrefix here; it will greedily consume the payload/type token (e.g. `X`).
// Also note: Langium 3.5.x does not preserve `=>` predicates in the generated parser, so we keep this purely token-first.
StateAcceptSuccessionMember:
    'accept' {infer FeatureMembership}
    ownedRelatedElement += StateAcceptThenTarget ';'
;

StateAcceptThenTarget:
    {infer TransitionUsage}
    AcceptParameterPart
    ( 'if' ownedRelatedElement += OwnedExpression )?
    // Accept either `do action a then ...` or `do action a; then ...`
    ( 'do' ownedRelatedElement += EffectBehaviorUsage ';'? )?
    'then'
    target = [Feature:QualifiedName]
;

// Standalone guarded target transitions in state bodies.
// Use a predicate so GuardExpressionMember can consume 'if' exactly once.
StateIfSuccessionMember:
	'if' {infer FeatureMembership}
    MemberPrefix ownedRelatedElement += StateIfSuccessionBody
;

StateIfSuccessionBody:
    {infer TransitionUsage}
    ownedRelationship += EmptyParameterMember
    ownedRelationship += GuardExpressionMember
    'then' ownedRelationship += TransitionSuccessionMember
    ActionBody
;

// Bracket-guard form: [expr] then target;
StateBracketSuccessionMember:
	'[' {infer FeatureMembership}
    MemberPrefix ownedRelatedElement += StateBracketSuccessionBody
;

StateBracketSuccessionBody:
    {infer TransitionUsage}
    ownedRelationship += EmptyParameterMember
    ownedRelationship += BracketGuardExpressionMember
    'then' ownedRelationship += TransitionSuccessionMember
    ActionBody
;

BracketGuardExpressionMember:
    {infer TransitionFeatureMembership}
    kind = '['
    ownedRelatedElement += OwnedExpression ']'
;

/* CALCULATIONS */

/* Calculation Definitions */

CalculationKeyword returns string:
	'calc'
;

CalculationDefKeyword returns string:
	CalculationKeyword 'def'
;

CalculationDefinition:
	{infer CalculationDefinition}
	OccurrenceDefinitionPrefix CalculationDefKeyword DefinitionDeclaration 
	CalculationBody
;

fragment CalculationBody:
	';' | '{' CalculationBodyPart '}' 
;

fragment CalculationBodyPart:
	CalculationBodyItem*
	( ownedRelationship += ResultExpressionMember )?
;

fragment CalculationBodyItem:
	  ActionBodyItem
	| ownedRelationship += ReturnParameterMember
;

ReturnParameterMember:
	{infer ReturnParameterMembership}
	MemberPrefix 'return' 
	ownedRelatedElement += UsageElement 
;


/* Calculation Usages */

CalculationUsageKeyword returns string:
	CalculationKeyword
;

CalculationUsage:
	{infer CalculationUsage}
	OccurrenceUsagePrefix CalculationUsageKeyword ActionUsageDeclaration CalculationBody
;

/* CONSTRAINTS */

/* Constraint Definitions */

ConstraintKeyword returns string:
	'constraint'
;

ConstraintDefKeyword returns string:
	ConstraintKeyword 'def'
;

ConstraintDefinition:
	{infer ConstraintDefinition}
	OccurrenceDefinitionPrefix ConstraintDefKeyword DefinitionDeclaration CalculationBody  
;

/* Constraint Usages */

ConstraintUsageKeyword returns string:
	ConstraintKeyword
;

ConstraintUsage:
	{infer ConstraintUsage}
	OccurrenceUsagePrefix ConstraintUsageKeyword ConstraintUsageDeclaration CalculationBody
;

AssertConstraintUsage:
	{infer AssertConstraintUsage}
	OccurrenceUsagePrefix 'assert' ( isNegated ?= 'not' )?
    ( ownedRelationship += OwnedReferenceSubsetting FeatureSpecializationPart?
    | ConstraintUsageKeyword ConstraintUsageDeclaration
    )
    CalculationBody
;

fragment ConstraintUsageDeclaration:
	  UsageDeclaration? ValuePart?
;

/* REQUIREMENTS */

/* Requirement Definitions */

RequirementKeyword returns string:
	'requirement'
;

RequirementDefKeyword returns string:
	RequirementKeyword 'def'
;

RequirementDefinition:
	{infer RequirementDefinition}
	OccurrenceDefinitionPrefix RequirementDefKeyword DefinitionDeclaration RequirementBody  
;

fragment RequirementBody:
	  ';' | '{' RequirementBodyItem* '}'
;

fragment RequirementBodyItem:
	  DefinitionBodyItem
	| ownedRelationship += SubjectMember
	| ownedRelationship += RequirementConstraintMember
	| ownedRelationship += FramedConcernMember
	| ownedRelationship += RequirementVerificationMember
	| ownedRelationship += ActorMember
	| ownedRelationship += StakeholderMember
;

SubjectMember:
	{infer SubjectMembership}
	MemberPrefix ownedRelatedElement += SubjectUsage 
;

SubjectUsage:
	{infer ReferenceUsage}
	'subject' UsageExtensionKeyword* UsageCore
;

RequirementConstraintMember:
	{infer RequirementConstraintMembership}
	MemberPrefix kind = RequirementConstraintKind 
	ownedRelatedElement += RequirementConstraintUsage 
;

RequirementConstraintKind returns string:
	'assume' | 'require';

RequirementConstraintUsage:
      {infer ConstraintUsage}
      ownedRelationship += OwnedReferenceSubsetting FeatureSpecialization* 
      CalculationBody
    | ( UsageExtensionKeyword* ConstraintUsageKeyword | UsageExtensionKeyword+ )
      ConstraintUsageDeclaration CalculationBody
;

FramedConcernMember:
	{infer FramedConcernMembership}
	MemberPrefix kind = FramedConcernKind 
	ownedRelatedElement += FramedConcernUsage 
;

FramedConcernKind returns string:
	'frame';

FramedConcernUsage:
      {infer ConcernUsage}
      ownedRelationship += OwnedReferenceSubsetting FeatureSpecialization* 
      RequirementBody
    | ( UsageExtensionKeyword* ConcernUsageKeyword | UsageExtensionKeyword+ ) 
      ConstraintUsageDeclaration CalculationBody
;

ActorMember:
	{infer ActorMembership}
	MemberPrefix
	ownedRelatedElement += ActorUsage 
;

ActorUsage:
      {infer PartUsage}
      'actor' UsageExtensionKeyword* UsageCore
;

StakeholderMember:
	{infer StakeholderMembership}
	MemberPrefix
	ownedRelatedElement += StakeholderUsage 
;

StakeholderUsage:
      {infer PartUsage}
      'stakeholder' UsageExtensionKeyword* UsageCore
;

/* Requirement Usages */

RequirementUsageKeyword returns string:
	RequirementKeyword
;

RequirementUsage:
	{infer RequirementUsage}
	OccurrenceUsagePrefix RequirementUsageKeyword ConstraintUsageDeclaration RequirementBody
;

SatisfyRequirementUsage:
	{infer SatisfyRequirementUsage}
	OccurrenceUsagePrefix 'assert'? ( isNegated ?= 'not' )? 'satisfy' 
	( ownedRelationship += OwnedReferenceSubsetting FeatureSpecializationPart?
    | RequirementUsageKeyword UsageDeclaration? 
    )
    ValuePart?
    ( 'by' ownedRelationship += SatisfactionSubjectMember )?
     RequirementBody
;

SatisfactionSubjectMember:
	{infer SubjectMembership}
	ownedRelatedElement += SatisfactionParameter 
;

SatisfactionParameter:
	{infer ReferenceUsage}
	ownedRelationship += SatisfactionFeatureValue
;

SatisfactionFeatureValue:
	{infer FeatureValue}
	ownedRelatedElement += SatisfactionReferenceExpression
;

SatisfactionReferenceExpression:
	{infer FeatureReferenceExpression}
	ownedRelationship += FeatureChainMember
;

/* CONCERNS */

/* Concern Definitions */

ConcernKeyword returns string:
	'concern'
;

ConcernDefKeyword returns string:
	ConcernKeyword 'def'
;

ConcernDefinition:
	{infer ConcernDefinition}
	OccurrenceDefinitionPrefix ConcernDefKeyword DefinitionDeclaration RequirementBody  
;

ConcernUsageKeyword returns string:
	ConcernKeyword
;

ConcernUsage:
	{infer ConcernUsage}
	OccurrenceUsagePrefix ConcernUsageKeyword ConstraintUsageDeclaration RequirementBody
;

/* CASES */

/* Case Definitions */

CaseKeyword returns string:
	'case'
;

CaseDefKeyword returns string:
	CaseKeyword 'def'
;

CaseDefinition:
	{infer CaseDefinition}
	OccurrenceDefinitionPrefix CaseDefKeyword DefinitionDeclaration CaseBody
;

fragment CaseBody:
	    ';' 
	  | '{' CaseBodyItem*
	        ( ownedRelationship += ResultExpressionMember )?
	    '}' 
;

fragment CaseBodyItem:
	  CalculationBodyItem
	| ownedRelationship += SubjectMember 
	| ownedRelationship += ActorMember
	| ownedRelationship += ObjectiveMember
	
;

ObjectiveMember:
	{infer ObjectiveMembership}
	MemberPrefix 'objective' ownedRelatedElement += ObjectiveRequirementUsage 
;

ObjectiveRequirementUsage:
	{infer RequirementUsage}
	UsageExtensionKeyword* ConstraintUsageDeclaration RequirementBody
;

/* Case Usages */

CaseUsageKeyword returns string:
	CaseKeyword
;

// TODO: Correct erroneous use of ConstraintUsageDeclaration for CaseUsage from resolution of SYSML2-783.

CaseUsage:
	{infer CaseUsage}
	OccurrenceUsagePrefix CaseUsageKeyword ActionUsageDeclaration CaseBody
;

/* ANALYSIS CASES */

AnalysisCaseKeyword returns string:
	'analysis'
;

AnalysisCaseDefKeyword returns string:
	AnalysisCaseKeyword 'def'
;

AnalysisCaseUsageKeyword returns string:
	AnalysisCaseKeyword
;

AnalysisCaseDefinition:
	{infer AnalysisCaseDefinition}
	OccurrenceDefinitionPrefix AnalysisCaseDefKeyword DefinitionDeclaration CaseBody
;

AnalysisCaseUsage:
	{infer AnalysisCaseUsage}
	OccurrenceUsagePrefix AnalysisCaseUsageKeyword ActionUsageDeclaration CaseBody
;

/* VERIFICATION CASES */

VerificationCaseKeyword returns string:
	'verification'
;

VerificationCaseDefKeyword returns string:
	VerificationCaseKeyword 'def'
;

VerificationCaseUsageKeyword returns string:
	VerificationCaseKeyword
;

VerificationCaseDefinition:
	{infer VerificationCaseDefinition}
	OccurrenceDefinitionPrefix VerificationCaseDefKeyword DefinitionDeclaration CaseBody
;

VerificationCaseUsage:
	{infer VerificationCaseUsage}
	OccurrenceUsagePrefix VerificationCaseUsageKeyword ActionUsageDeclaration CaseBody
;

RequirementVerificationMember:
	{infer RequirementVerificationMembership}
	MemberPrefix kind = RequirementVerificationKind 
	ownedRelatedElement += RequirementVerificationUsage 
;

RequirementVerificationKind returns string:
	'verify';

RequirementVerificationUsage:
      {infer RequirementUsage}
      ownedRelationship += OwnedReferenceSubsetting FeatureSpecialization* 
      RequirementBody
    | ( UsageExtensionKeyword* RequirementUsageKeyword | UsageExtensionKeyword+ )
      ConstraintUsageDeclaration RequirementBody
;

/* USE CASES */

UseCaseKeyword returns string:
	'use' 'case'
;

UseCaseDefKeyword returns string:
	UseCaseKeyword 'def'
;

UseCaseUsageKeyword returns string:
	UseCaseKeyword
;

UseCaseDefinition:
	{infer UseCaseDefinition}
	OccurrenceDefinitionPrefix UseCaseDefKeyword DefinitionDeclaration CaseBody
;

UseCaseUsage:
	{infer UseCaseUsage}
	OccurrenceUsagePrefix UseCaseUsageKeyword ActionUsageDeclaration CaseBody
;

IncludeUseCaseUsage:
	{infer IncludeUseCaseUsage}
	OccurrenceUsagePrefix 'include' 
   	( ownedRelationship += OwnedReferenceSubsetting FeatureSpecializationPart?
   	| UseCaseUsageKeyword UsageDeclaration? )
    ValuePart?
	CaseBody
;

/* VIEWS */

/* View Definitions */

ViewKeyword returns string:
	'view'
;

ViewDefKeyword returns string:
	ViewKeyword 'def'
;

ViewDefinition:
	{infer ViewDefinition}
	OccurrenceDefinitionPrefix ViewDefKeyword DefinitionDeclaration ViewDefinitionBody
;

fragment ViewDefinitionBody:
	  ';' 
	| '{' ViewDefinitionBodyItem* '}'
;

fragment ViewDefinitionBodyItem:
	  DefinitionBodyItem
	| ownedRelationship += ElementFilterMember
	| ownedRelationship += ViewRenderingMember
;

ViewRenderingMember:
	{infer ViewRenderingMembership}
	MemberPrefix 'render' 
	ownedRelatedElement += ViewRenderingUsage 
;

ViewRenderingUsage:
	  {infer RenderingUsage}
	  ownedRelationship += OwnedReferenceSubsetting FeatureSpecialization* UsageBody
	| ( UsageExtensionKeyword* 'rendering' | UsageExtensionKeyword+ ) UsageCore
;

/* View Usages */

ViewUsageKeyword returns string:
	ViewKeyword
;

ViewUsage:
	{infer ViewUsage}
	OccurrenceUsagePrefix ViewUsageKeyword UsageDeclaration? ValuePart? ViewBody
;

fragment ViewBody:
	';' | '{' ViewBodyItem* '}'
;

fragment ViewBodyItem:
	  DefinitionBodyItem
	| ownedRelationship += ElementFilterMember
	| ownedRelationship += Expose
	| ownedRelationship += ViewRenderingMember
;

fragment ExposePrefix:
	visibility = ExposeVisibilityKind
;

ExposeVisibilityKind returns string:
	'expose';

Expose:
	{infer Expose}
	( MembershipExpose | NamespaceExpose )
	RelationshipBody
;

MembershipExpose:
	{infer MembershipExpose}
	ExposePrefix ImportedMembership
;

NamespaceExpose:
	{infer NamespaceExpose}
	ExposePrefix 
	( ImportedNamespace
	| ownedRelatedElement += FilterPackage
	)
;

/* VIEWPOINTS */

ViewpointKeyword returns string:
	'viewpoint'
;

ViewpointDefKeyword returns string:
	ViewpointKeyword 'def'
;

ViewpointUsageKeyword returns string:
	ViewpointKeyword
;

ViewpointDefinition:
	{infer ViewpointDefinition}
	OccurrenceDefinitionPrefix ViewpointDefKeyword DefinitionDeclaration RequirementBody  
;

ViewpointUsage:
	{infer ViewpointUsage}
	OccurrenceUsagePrefix ViewpointUsageKeyword ConstraintUsageDeclaration RequirementBody
;

/* RENDERINGS */

RenderingKeyword returns string:
	'rendering'
;

RenderingDefKeyword returns string:
	RenderingKeyword 'def'
;

RenderingDefinition:
	{infer RenderingDefinition}
	OccurrenceDefinitionPrefix RenderingDefKeyword DefinitionCore
;

RenderingUsageKeyword returns string:
	RenderingKeyword
;

RenderingUsage:
	{infer RenderingUsage}
	OccurrenceUsagePrefix RenderingUsageKeyword UsageCore
;

