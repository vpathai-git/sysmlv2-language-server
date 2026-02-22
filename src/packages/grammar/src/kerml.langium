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

grammar KerML

/* ROOT NAMESPACE */

entry RootNamespace:
	{infer Namespace}NamespaceBodyElement*
;

/* ELEMENTS */

/* Elements */

fragment Identification:
	  '<' declaredShortName = Name '>' ( declaredName = Name )?
	| declaredName = Name
;

/* Relationships */

fragment RelationshipBody:
    ';' | '{' RelationshipOwnedElement* '}'
;

fragment RelationshipOwnedElement:
      ownedRelatedElement += OwnedRelatedElement
    | ownedRelationship += OwnedAnnotation
;

OwnedRelatedElement:
    {infer Element}
    NonFeatureElement | FeatureElement
;

/* DEPENDENCIES */

Dependency:
	{infer Dependency}
	( ownedRelationship += PrefixMetadataAnnotation )*
	'dependency' ( Identification? 'from' )?
    client += [Element:QualifiedName] ( ',' client += [Element:QualifiedName] )* 'to'
    supplier += [Element:QualifiedName] ( ',' supplier += [Element:QualifiedName] )*
    RelationshipBody
;

/* ANNOTATIONS */

Annotation:
	{infer Annotation}
	annotatedElement = [Element:QualifiedName]
;

OwnedAnnotation:
	{infer Annotation}
	ownedRelatedElement += AnnotatingElement
;

AnnotatingElement:
	  {infer AnnotatingElement}
	  Comment
	| Documentation
	| TextualRepresentation
	| MetadataFeature
;

/* Comments */

Comment:
	{infer Comment}
	( 'comment' Identification? 
	  ('about' ownedRelationship += Annotation
	     ( ',' ownedRelationship += Annotation )* )? 
	)?
	( 'locale' locale = STRING_VALUE )?
	body = REGULAR_COMMENT
;

Documentation:
	{infer Documentation}
	'doc' Identification? 
	( 'locale' locale = STRING_VALUE )?
	body = REGULAR_COMMENT
;

/* Textual Representation */

TextualRepresentation:
    {infer TextualRepresentation}
    ( 'rep' Identification? )?
    'language' language = STRING_VALUE 
    body = REGULAR_COMMENT
;

/* NAMESPACES */

Namespace:
	{infer Namespace}
	( ownedRelationship += PrefixMetadataMember )*
	NamespaceDeclaration NamespaceBody
;

fragment NamespaceDeclaration:
	'namespace' Identification? 
;

fragment NamespaceBody:
	  ';' 
	| '{' ( // Note: PackageBodyElement is expanded here to avoid
			// infinite loops in the incremental parser.
		    ownedRelationship += NamespaceMember 
	      | ownedRelationship += AliasMember
	      | ownedRelationship += Import )* 
	  '}'
;

/* Namespace Bodies */

fragment NamespaceBodyElement:
	  ownedRelationship += NamespaceMember
	| ownedRelationship += AliasMember
	| ownedRelationship += Import
;

fragment MemberPrefix:
    ( visibility = VisibilityIndicator )?
;

NamespaceMember:
	  {infer OwningMembership}
	  NonFeatureMember | NamespaceFeatureMember
;

NonFeatureMember:
	{infer OwningMembership}
	MemberPrefix ownedRelatedElement += MemberElement 
;

NamespaceFeatureMember:
	{infer OwningMembership}
	MemberPrefix ownedRelatedElement += FeatureElement 
;

AliasMember:
	{infer Membership}
	MemberPrefix 
	'alias' ( '<' memberShortName = Name '>' )? ( memberName = Name )?
	'for' memberElement = [Element:QualifiedName]
	RelationshipBody
;

fragment ImportPrefix:
	visibility = VisibilityIndicator  
	'import' ( isImportAll ?= 'all' )?
;

Import:
	{infer Import}
	( MembershipImport | NamespaceImport )
	RelationshipBody
;

MembershipImport:
	{infer MembershipImport}
	ImportPrefix ImportedMembership
;

fragment ImportedMembership:
	importedMembership = [Membership:QualifiedName]
	( '::' isRecursive ?= '**' )?	
;

NamespaceImport:
	{infer NamespaceImport}
	ImportPrefix 
	( ImportedNamespace
	| ownedRelatedElement += FilterPackage
	)
;

fragment ImportedNamespace:
	importedNamespace = [Namespace:QualifiedName] '::' '*'
	( '::' isRecursive ?= '**' )?
;

FilterPackage:
	{infer Package}
	ownedRelationship += FilterPackageImport
	( ownedRelationship += FilterPackageMember )+
;

FilterPackageImport:
	 {infer Import}
	 FilterPackageMembershipImport | FilterPackageNamespaceImport
;

FilterPackageMembershipImport:
	{infer MembershipImport}
	ImportedMembership
;

FilterPackageNamespaceImport:
	{infer NamespaceImport}
	ImportedNamespace
;

FilterPackageMember:
	{infer ElementFilterMembership}
	visibility = FilterPackageMemberVisibility ownedRelatedElement += OwnedExpression ']'
;

FilterPackageMemberVisibility returns string:
	'[';

VisibilityIndicator returns string:
	'public' | 'private' | 'protected';

/* Namespace Elements */

MemberElement:
	{infer Element}
	AnnotatingElement | NonFeatureElement
;

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

/* PACKAGES */

Package:
	{infer Package}
	( ownedRelationship += PrefixMetadataMember )*
	PackageDeclaration PackageBody 
;

LibraryPackage:
	{infer LibraryPackage}
	( isStandard ?= 'standard' )? 'library'
	( ownedRelationship += PrefixMetadataMember )*
	PackageDeclaration PackageBody
;

fragment PackageDeclaration:
	'package' Identification?
;

fragment PackageBody:
	  ';' 
	| '{' ( // Note: PackageBodyElement is expanded here to avoid
			// infinite loops in the incremental parser.
		    ownedRelationship += NamespaceMember 
	      | ownedRelationship += ElementFilterMember
	      | ownedRelationship += AliasMember
	      | ownedRelationship += Import )*
	  '}'
;

ElementFilterMember:
	{infer ElementFilterMembership}
	MemberPrefix
	'filter' ownedRelatedElement += OwnedExpression ';'
;

/* TYPES */

/* Types */

fragment TypePrefix:
	( isAbstract ?= 'abstract' )? 
	( ownedRelationship += PrefixMetadataMember )*
;

Type:
    {infer Type}
    TypePrefix 'type' 
    TypeDeclaration TypeBody
;

fragment TypeDeclaration: 
    ( isSufficient ?= 'all' )? Identification?
    ( ownedRelationship += OwnedMultiplicity )? 
    ( SpecializationPart | ConjugationPart )
    TypeRelationshipPart*
;

fragment SpecializationPart:
      ( ':>' | 'specializes' ) ownedRelationship += OwnedSpecialization
      ( ',' ownedRelationship += OwnedSpecialization )*
;

fragment ConjugationPart:
	( '~' | 'conjugates' ) ownedRelationship += OwnedConjugation
;

fragment TypeRelationshipPart:
	DisjoiningPart | UnioningPart | IntersectingPart | DifferencingPart
;

fragment DisjoiningPart:
	'disjoint' 'from' ownedRelationship += OwnedDisjoining
	( ',' ownedRelationship += OwnedDisjoining )* 
;

fragment UnioningPart:
	'unions' ownedRelationship += Unioning
	( ',' ownedRelationship += Unioning )* 
;

fragment IntersectingPart:
	'intersects' ownedRelationship += Intersecting
	( ',' ownedRelationship += Intersecting )* 
;

fragment DifferencingPart:
	'differences' ownedRelationship += Differencing
	( ',' ownedRelationship += Differencing )* 
;

fragment TypeBody:
	 ';' 
	| '{' ( ownedRelationship += NonFeatureMember 
		  | ownedRelationship += FeatureMember 
		  | ownedRelationship += AliasMember
		  | ownedRelationship += Import
	      )* 
	  '}'
;

/* Feature Membership */

FeatureMember:
	{infer OwningMembership}
	TypeFeatureMember | OwnedFeatureMember
;

TypeFeatureMember:
	{infer OwningMembership}
	MemberPrefix 'member' ownedRelatedElement += FeatureElement 
;

OwnedFeatureMember:
	{infer FeatureMembership}
	MemberPrefix ownedRelatedElement += FeatureElement 
;

/* Specialization */

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

OwnedSpecialization:
	  {infer Specialization}
	  general = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

/* Conjugation */

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

OwnedConjugation:
	  {infer Conjugation}
	  originalType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

/* Disjoining */

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

OwnedDisjoining:
	  {infer Disjoining}
	  disjoiningType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

/* Unioning, Intersecting and Differencing */

Unioning:
	  {infer Unioning}
	  unioningType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

Intersecting:
	  {infer Intersecting}
	  intersectingType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

Differencing:
	  {infer Differencing}
	  differencingType = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

/* CLASSIFIERS */

/* Classifiers */

Classifier:
	{infer Classifier}
	TypePrefix 'classifier' 
	ClassifierDeclaration TypeBody
;

fragment ClassifierDeclaration:	
    (isSufficient ?= 'all' )? Identification?
	( ownedRelationship += OwnedMultiplicity )?
	( SuperclassingPart | ClassifierConjugationPart )?
	TypeRelationshipPart*
;

fragment SuperclassingPart:
	( ':>' | 'specializes' ) ownedRelationship += Ownedsubclassification 
	( ',' ownedRelationship += Ownedsubclassification )*
;

fragment ClassifierConjugationPart:
	( '~' | 'conjugates' ) ownedRelationship += ClassifierConjugation
;

/* Subclassification */

Subclassification:
	{infer Subclassification}
	( 'specialization' Identification? )?
    'subclassifier' subclassifier = [Classifier:QualifiedName]
    ( ':>' | 'specializes') superclassifier = [Classifier:QualifiedName]
    RelationshipBody
;

Ownedsubclassification:
	{infer Subclassification}
	superclassifier = [Classifier:QualifiedName]
;

/* Classifier Conjugation */

ClassifierConjugation:
	{infer Conjugation}
	originalType = [Classifier:QualifiedName]
;

/* FEATURES */

/* Features */

FeatureDirection returns string:
	'in' | 'out' | 'inout';

fragment EndFeaturePrefix:
    ( isConstant ?= 'const')? isEnd ?= 'end'
;

fragment BasicFeaturePrefix:	
	( direction = FeatureDirection )?
	( isDerived ?= 'derived' )?
	( isAbstract ?= 'abstract' )?
	( isComposite ?= 'composite' | isPortion ?= 'portion' )? 
	( isVariable ?= 'var' | isConstant ?= 'const' )?
;

fragment FeaturePrefix:
	( EndFeaturePrefix ( ownedRelationship += OwnedCrossingFeatureMember )?
	| BasicFeaturePrefix
	)
	( ownedRelationship += PrefixMetadataMember )*
;

OwnedCrossingFeatureMember:
	{infer OwningMembership}
	ownedRelatedElement += OwnedCrossingFeature
;

OwnedCrossingFeature:
	{infer Feature}
	BasicFeaturePrefix FeatureDeclaration
;

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

fragment FeatureDeclaration:
	( isSufficient ?= 'all' )? 
	( Identification ( FeatureSpecializationPart | FeatureConjugationPart )?
	| FeatureSpecializationPart
	| FeatureConjugationPart
	)
	FeatureRelationshipPart*
;

fragment FeatureRelationshipPart:
	TypeRelationshipPart | ChainingPart | InvertingPart | TypeFeaturingPart
;

fragment ChainingPart:
	'chains' ( ownedRelationship += OwnedFeatureChaining | FeatureChain )
;

fragment InvertingPart:
	'inverse' 'of' ownedRelationship += OwnedFeatureInverting
;

fragment TypeFeaturingPart:
	'featured' 'by' ownedRelationship += OwnedTypeFeaturing 
	( ',' ownedRelationship += OwnedTypeFeaturing )*
;

fragment FeatureSpecializationPart:
	  ( FeatureSpecialization )+ MultiplicityPart? FeatureSpecialization*
	| MultiplicityPart FeatureSpecialization*
;

fragment MultiplicityPart:
	  ownedRelationship += OwnedMultiplicity 
	| ( ownedRelationship += OwnedMultiplicity )?
	  ( isOrdered ?= 'ordered' isNonunique ?= 'nonunique'?
	  | isNonunique ?= 'nonunique' isOrdered ?= 'ordered'?
	  )
;

fragment FeatureSpecialization:
	Typings | Subsettings | References | Crossings | Redefinitions
;

fragment Typings:
	TypedBy ( ',' ownedRelationship += OwnedFeatureTyping )*
;

fragment TypedBy:
	( ':' | 'typed' 'by' ) ownedRelationship += OwnedFeatureTyping
;

fragment Subsettings:
	Subsets ( ',' ownedRelationship += OwnedSubsetting )*
;

fragment Subsets:
	( ':>' | 'subsets' ) ownedRelationship += OwnedSubsetting 
;

fragment References:
	ReferencesKeyword ownedRelationship += OwnedReferenceSubsetting
;

// === SHARED EXPRESSIONS (shared expressions) ===

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

/* EXPRESSIONS */

/* Operator Expressions */ 

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
	| FeatureReferenceExpression 
	| MetadataAccessExpression
	| InvocationExpression 
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


ResultExpressionMember:
	{infer ResultExpressionMembership}
	MemberPrefix ownedRelatedElement += OwnedExpression 
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

ReferencesKeyword returns string:
	'::>' | 'references'
;

fragment Crossings:
	( '=>' | 'crosses' ) ownedRelationship += OwnedCrossSubsetting
;

fragment Redefinitions:
	Redefines ( ',' ownedRelationship += OwnedRedefinition )*
;

fragment Redefines:
	( ':>>' | 'redefines' ) ownedRelationship += OwnedRedefinition
;

/* Feature Inverting */

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

OwnedFeatureInverting:
	  {infer FeatureInverting}
	  invertingFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

/* Type Featuring */

TypeFeaturing:
	{infer TypeFeaturing}
	'featuring' ( Identification? 'of')?
	featureOfType = [Feature:QualifiedName]
	'by' featuringType = [Feature:QualifiedName]
	RelationshipBody
;

OwnedTypeFeaturing:
	{infer TypeFeaturing}
	featuringType = [Type:QualifiedName]
;

/* Feature Typing */

FeatureTyping:
	{infer FeatureTyping}
	( 'specialization' Identification? )?
    'typing' typedFeature = [Feature:QualifiedName]
    (':' | 'typed' 'by') FeatureType
    RelationshipBody
;

OwnedFeatureTyping:
	{infer FeatureTyping}
	FeatureType
;

fragment FeatureType:
	  type = [Type:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

/* Subsetting */

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

OwnedSubsetting:
	  {infer Subsetting}
	  subsettedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

OwnedReferenceSubsetting:
	  {infer ReferenceSubsetting}
	  referencedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
;

OwnedCrossSubsetting:
	{infer CrossSubsetting}
	( crossedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain
	)
;

/* Redefinition */

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

OwnedRedefinition:
	  {infer Redefinition}
	  redefinedFeature = [Feature:QualifiedName]
	| ownedRelatedElement += OwnedFeatureChain 
;

/* Feature Conjugation */

fragment FeatureConjugationPart:
	( '~' | 'conjugates' ) ownedRelationship += FeatureConjugation
;

FeatureConjugation:
	{infer Conjugation}
	originalType = [Feature:QualifiedName]
;

/* FEATURE VALUES */

fragment ValuePart:
	  ownedRelationship += FeatureValue
;

FeatureValue:
	{infer FeatureValue}
	( '=' 
	| isInitial ?= ':='
	| isDefault ?= 'default' ( '=' | isInitial ?= ':=' )?
	)
	ownedRelatedElement += OwnedExpression
;

/* MULTIPLICITIES */

Multiplicity:
	{infer Multiplicity}
	MultiplicitySubset | MultiplicityRange
;

MultiplicitySubset:
	{infer Multiplicity}
	'multiplicity' Identification? Subsets TypeBody
;

MultiplicityRange:
	{infer MultiplicityRange}
	'multiplicity' Identification? MultiplicityBounds TypeBody
;

OwnedMultiplicity:
	{infer OwningMembership}
	ownedRelatedElement += OwnedMultiplicityRange 
;

OwnedMultiplicityRange:
	{infer MultiplicityRange}
	MultiplicityBounds
;

fragment MultiplicityBounds:
	// TODO: Allow general expressions for bounds. (Causes LL parsing issues.)
	'[' ownedRelationship += MultiplicityExpressionMember
	      ( '..' ownedRelationship += MultiplicityExpressionMember )? ']'
;

MultiplicityExpressionMember:
	{infer OwningMembership}
	ownedRelatedElement += ( LiteralExpression | FeatureReferenceExpression ) 
;

/* CLASSIFICATION */

/* Data Types */

DataType:
	{infer DataType}
	TypePrefix 'datatype' 
	ClassifierDeclaration TypeBody
;

/* Classes */

Class:
	{infer Class}
	TypePrefix 'class' 
	ClassifierDeclaration TypeBody
;

/* STRUCTURES */

Structure:
	{infer Structure}
	TypePrefix 'struct' 
	ClassifierDeclaration TypeBody
;


/* ASSOCIATIONS */

Association:
	{infer Association}
	TypePrefix 'assoc' 
	ClassifierDeclaration TypeBody
;

AssociationStructure:
	{infer AssociationStructure}
	TypePrefix 'assoc' 'struct'
	ClassifierDeclaration TypeBody
;

/* CONNECTORS */

/* Connectors */

Connector:
	{infer Connector}
	FeaturePrefix 'connector' 
	( FeatureDeclaration? ValuePart?
	| ConnectorDeclaration
	) 
	TypeBody	  
;

fragment ConnectorDeclaration:
	BinaryConnectorDeclaration | NaryConnectorDeclaration
;

fragment BinaryConnectorDeclaration:
	( FeatureDeclaration? 'from' | isSufficient ?= 'all' 'from'? )?
	ownedRelationship += ConnectorEndMember 'to' 
	ownedRelationship += ConnectorEndMember
;

fragment NaryConnectorDeclaration:
	FeatureDeclaration? 
	'(' ownedRelationship += ConnectorEndMember ',' 
	    ownedRelationship += ConnectorEndMember
	    ( ',' ownedRelationship += ConnectorEndMember )* 
	')'
;

ConnectorEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += ConnectorEnd 
;

ConnectorEnd:
	{infer Feature}
	( ownedRelationship += OwnedCrossingMultiplicityMember )?
	( declaredName = Name ReferencesKeyword )? 
	ownedRelationship += OwnedReferenceSubsetting
;

OwnedCrossingMultiplicityMember:
	{infer OwningMembership}
	ownedRelatedElement += OwnedCrossingMultiplicity
;

OwnedCrossingMultiplicity:
	{infer Feature}
	ownedRelationship += OwnedMultiplicity
;

/* Binding Connectors */

BindingConnector:
	{infer BindingConnector}
	FeaturePrefix 'binding' 
	BindingConnectorDeclaration TypeBody	
;

fragment BindingConnectorDeclaration:
	  FeatureDeclaration
	  ( 'of' ownedRelationship += ConnectorEndMember 
	    '=' ownedRelationship += ConnectorEndMember )?
	| ( isSufficient ?= 'all' )?
	  ( 'of'? ownedRelationship += ConnectorEndMember 
	    '=' ownedRelationship += ConnectorEndMember )?
;

/* Successions */

Succession:
	{infer Succession}
	FeaturePrefix 'succession' 
	SuccessionDeclaration TypeBody
;

fragment SuccessionDeclaration:
	  FeatureDeclaration
	  ( 'first' ownedRelationship += ConnectorEndMember 
	    'then' ownedRelationship += ConnectorEndMember )?
    | ( isSufficient ?= 'all' )?
	  ( 'first'? ownedRelationship += ConnectorEndMember 
	    'then' ownedRelationship += ConnectorEndMember )?
;

/* BEHAVIORS */

/* Behaviors */

Behavior:
	{infer Behavior}
	TypePrefix 'behavior' 
	ClassifierDeclaration TypeBody
;

/* Steps */

Step:
	{infer Step}
	FeaturePrefix 'step' 
	StepDeclaration TypeBody
;

fragment StepDeclaration:
	FeatureDeclaration? ValuePart?
;

/* FUNCTIONS */

/* Functions */

SysMLFunction:
	{infer SysMLFunction}
	TypePrefix 'function' 
	ClassifierDeclaration FunctionBody  
;

fragment FunctionBody:
	';' | '{' FunctionBodyPart '}'
;

fragment FunctionBodyPart:
	( ownedRelationship += NonFeatureMember 
	| ownedRelationship += FeatureMember 
	| ownedRelationship += AliasMember
	| ownedRelationship += Import
	| ownedRelationship += ReturnFeatureMember
	)* 
	( ownedRelationship += ResultExpressionMember )?
;

ReturnFeatureMember:
	{infer ReturnParameterMembership}
	MemberPrefix 'return' 
	ownedRelatedElement += FeatureElement 
;


/* Expressions */

Expression:
	{infer Expression}
	FeaturePrefix 'expr' 
	ExpressionDeclaration FunctionBody
;

fragment ExpressionDeclaration:
	FeatureDeclaration? ValuePart?
;

/* Predicates */

Predicate:
	{infer Predicate}
	TypePrefix 'predicate' 
	ClassifierDeclaration FunctionBody  
;

/* Boolean Expressions */ 

BooleanExpression:
	{infer BooleanExpression}
	FeaturePrefix 'bool' 
	ExpressionDeclaration FunctionBody
;

/* Invariants */

Invariant:
	{infer Invariant}
	FeaturePrefix 'inv' ( 'true' | isNegated ?= 'false' )?
	ExpressionDeclaration FunctionBody
;

/* INTERACTIONS */

/* Interactions */

Interaction:
	{infer Interaction}
	TypePrefix 'interaction' 
	ClassifierDeclaration TypeBody
;

/* Flows */

Flow:
	{infer Flow}
	FeaturePrefix 'flow' 
	FlowDeclaration TypeBody
;

SuccessionFlow:
	{infer SuccessionFlow}
	FeaturePrefix 'succession' 'flow' FlowDeclaration TypeBody
;

fragment FlowDeclaration:
	  FeatureDeclaration? ValuePart?
      ( 'of'  ownedRelationship += PayloadFeatureMember )?
	  ( 'from' ownedRelationship += FlowEndMember 
	    'to' ownedRelationship += FlowEndMember )?
    | ( isSufficient ?= 'all' )?
      ownedRelationship += FlowEndMember 'to'
	  ownedRelationship += FlowEndMember
;

PayloadFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += PayloadFeature 
;

PayloadFeature:
	  {infer PayloadFeature}
	  Identification? PayloadFeatureSpecializationPart ValuePart?
	| Identification? ValuePart
    | ownedRelationship += OwnedFeatureTyping ( ownedRelationship += OwnedMultiplicity )?
    | ownedRelationship += OwnedMultiplicity ownedRelationship += OwnedFeatureTyping
;

fragment PayloadFeatureSpecializationPart:
	  ( FeatureSpecialization )+ MultiplicityPart? FeatureSpecialization*
	| MultiplicityPart FeatureSpecialization+
;

FlowEndMember:
	{infer EndFeatureMembership}
	ownedRelatedElement += FlowEnd 
;

FlowEnd:
	{infer FlowEnd}
	( ownedRelationship += FlowEndSubsetting )?
	ownedRelationship += FlowFeatureMember
;

FlowEndSubsetting:
	  {infer ReferenceSubsetting}
	  referencedFeature = [Feature:QualifiedName] '.'
	| ownedRelatedElement += FeatureChainPrefix
;

FeatureChainPrefix:
	{infer Feature}
	( ownedRelationship += OwnedFeatureChaining '.' )+
	ownedRelationship += OwnedFeatureChaining '.'
;

FlowFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += FlowFeature 
;

FlowFeature:
	{infer Feature}
	ownedRelationship += FlowRedefinition
;

FlowRedefinition:
	{infer Redefinition}
	redefinedFeature = [Feature:QualifiedName]
;

/* METADATA */

Metaclass:
	{infer Metaclass}
	TypePrefix 'metaclass' 
	ClassifierDeclaration TypeBody
;

PrefixMetadataAnnotation:
	{infer Annotation}
	'#' ownedRelatedElement += PrefixMetadataFeature
;

PrefixMetadataMember:
	{infer OwningMembership}
	'#' ownedRelatedElement += PrefixMetadataFeature 
;

PrefixMetadataFeature:
	{infer MetadataFeature}
	ownedRelationship += MetadataTyping
;

MetadataFeature:
	{infer MetadataFeature}
	( ownedRelationship += PrefixMetadataMember )*
	( '@' | 'metadata' ) MetadataFeatureDeclaration 
	( 'about' ownedRelationship += Annotation 
		( ',' ownedRelationship += Annotation )*
	)?
	MetadataBody
;

fragment MetadataFeatureDeclaration:
	( Identification ( ':' | 'typed' 'by' ) )? ownedRelationship += MetadataTyping
;

MetadataTyping:
	{infer FeatureTyping}
	type = [Metaclass:QualifiedName]
;

fragment MetadataBody:
	  ';' 
	| '{' ( ownedRelationship += NonFeatureMember 
		  | ownedRelationship += MetadataBodyFeatureMember 
		  | ownedRelationship += AliasMember
		  | ownedRelationship += Import
	      )* 
	  '}'
;

MetadataBodyFeatureMember:
	{infer FeatureMembership}
	ownedRelatedElement += MetadataBodyFeature
;

MetadataBodyFeature:
	{infer Feature}
	'feature'? ( ':>>' | 'redefines' )? ownedRelationship += OwnedRedefinition 
	FeatureSpecializationPart? ValuePart?
	MetadataBody
;

/* EXPRESSIONS */

ExpressionBody:
	'{' FunctionBodyPart '}'
;
