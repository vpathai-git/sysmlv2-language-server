# @sysml/core

SysML v2 core domain model with **tree-graph architecture**.

Dual representation combining containment hierarchy and reference graph for efficient model navigation and analysis.

## Features

✅ **Tree-Graph Model** - Containment tree + reference graph
✅ **Efficient Navigation** - O(1) parent/child access, graph traversal
✅ **Cycle Detection** - Find circular dependencies
✅ **Path Finding** - Trace relationships between elements
✅ **Type-Safe** - Full TypeScript support
✅ **Extensible** - Adapter pattern for custom element types

## Installation

```bash
npm install @sysml/core
```

## Architecture

The core model uses a **dual representation**:

1. **Containment Tree** - Parent-child relationships (packages, definitions, usages)
2. **Reference Graph** - Cross-references (specializations, redefinitions, etc.)

```
           Containment Tree              Reference Graph
              (hierarchy)                 (relationships)

       root                           PartDef A ──specializes──> PartDef B
        │                                  │
    ┌───┴───┐                              │
  Pkg A   Pkg B                            └──redefines──> Feature X
    │       │
  PartDef PartUsage
```

This enables:
- Fast tree navigation (parent/children)
- Efficient graph queries (paths, cycles)
- Model analysis and validation

## Usage

### Create Model Programmatically

```typescript
import { SysMLModel, SysMLMetatype } from '@sysml/core';

const model = new SysMLModel();

// Create package
const pkg = model.createElement(
  SysMLMetatype.PACKAGE,
  'VehicleSystem'
);

console.log(pkg.qualifiedName); // 'root::VehicleSystem'

// Create part definition
const vehicleDef = model.createElement(
  SysMLMetatype.PART_DEFINITION,
  'Vehicle',
  pkg.id
);

// Create part usage
const enginePart = model.createElement(
  SysMLMetatype.PART_USAGE,
  'engine',
  vehicleDef.id
);

console.log(enginePart.qualifiedName); // 'root::VehicleSystem::Vehicle::engine'
```

### Navigate Tree

```typescript
// Get element by ID
const element = model.getElementById(pkg.id);

// Get children
const children = pkg.children;
console.log(`Package has ${children.length} children`);

// Get parent
const parent = enginePart.parent;
console.log(`Parent: ${parent?.name}`);

// Get all descendants
function getAllDescendants(element: SysMLElement): SysMLElement[] {
  const descendants: SysMLElement[] = [];
  for (const child of element.children) {
    descendants.push(child);
    descendants.push(...getAllDescendants(child));
  }
  return descendants;
}
```

### Query by Type

```typescript
// Find all part definitions
const partDefs = model.getElementsByType(SysMLMetatype.PART_DEFINITION);
console.log(`Found ${partDefs.length} part definitions`);

// Filter by predicate
const largeParts = model.getElementsByPredicate(
  (el) => el.metatype === SysMLMetatype.PART_USAGE && el.name.length > 10
);
```

### Work with Reference Graph

```typescript
import { EdgeType } from '@sysml/core';

// Add reference edge
model.addEdge(childId, parentId, EdgeType.SPECIALIZES);

// Get reference graph
const graph = model.getReferenceGraph();

// Find paths between elements
const paths = graph.findPaths(sourceId, targetId, {
  maxDepth: 5,
  edgeTypes: [EdgeType.SPECIALIZES, EdgeType.REDEFINES]
});

// Detect cycles
const cycles = graph.findCycles();
if (cycles.length > 0) {
  console.warn('Circular dependencies detected:', cycles);
}

// Get all specializations of an element
const edges = graph.getOutgoingEdges(elementId);
const specializations = edges.filter(e => e.type === EdgeType.SPECIALIZES);
```

## API Reference

### SysMLModel

Main model class managing elements and relationships.

```typescript
class SysMLModel {
  // Create element
  createElement(
    metatype: SysMLMetatype,
    name: string,
    parentId?: UUID
  ): SysMLElement;

  // Retrieve elements
  getElementById(id: UUID): SysMLElement | undefined;
  getElementsByType(metatype: SysMLMetatype): SysMLElement[];
  getElementsByPredicate(predicate: (el: SysMLElement) => boolean): SysMLElement[];

  // Reference graph
  addEdge(sourceId: UUID, targetId: UUID, type: EdgeType): void;
  getReferenceGraph(): ReferenceGraph;

  // Tree operations
  getContainmentTree(): ContainmentTree;
  getRoot(): SysMLElement;
}
```

### SysMLElement

Individual model element.

```typescript
interface SysMLElement {
  readonly id: UUID;
  readonly name: string;
  readonly metatype: SysMLMetatype;
  readonly parent: SysMLElement | null;
  readonly children: ReadonlyArray<SysMLElement>;
  readonly qualifiedName: string;

  // Metadata
  metadata: Map<string, any>;
}
```

### SysMLMetatype

Element types from SysML v2 specification.

```typescript
enum SysMLMetatype {
  // Packages
  PACKAGE = 'PACKAGE',
  LIBRARY_PACKAGE = 'LIBRARY_PACKAGE',

  // Definitions
  PART_DEFINITION = 'PART_DEFINITION',
  ATTRIBUTE_DEFINITION = 'ATTRIBUTE_DEFINITION',
  ACTION_DEFINITION = 'ACTION_DEFINITION',
  STATE_DEFINITION = 'STATE_DEFINITION',
  REQUIREMENT_DEFINITION = 'REQUIREMENT_DEFINITION',
  // ... and many more

  // Usages
  PART_USAGE = 'PART_USAGE',
  ATTRIBUTE_USAGE = 'ATTRIBUTE_USAGE',
  ACTION_USAGE = 'ACTION_USAGE',
  STATE_USAGE = 'STATE_USAGE',
  REQUIREMENT_USAGE = 'REQUIREMENT_USAGE',
  // ... and many more
}
```

### EdgeType

Reference relationship types.

```typescript
enum EdgeType {
  SPECIALIZES = 'SPECIALIZES',
  SUBSETS = 'SUBSETS',
  REDEFINES = 'REDEFINES',
  TYPES = 'TYPES',
  FEATURES = 'FEATURES',
  DEPENDS_ON = 'DEPENDS_ON'
}
```

### ReferenceGraph

Graph operations and queries.

```typescript
class ReferenceGraph {
  // Add/remove edges
  addEdge(source: UUID, target: UUID, type: EdgeType): void;
  removeEdge(edgeId: UUID): void;

  // Query edges
  getEdge(id: UUID): GraphEdge | undefined;
  getOutgoingEdges(nodeId: UUID): GraphEdge[];
  getIncomingEdges(nodeId: UUID): GraphEdge[];

  // Path finding
  findPaths(
    source: UUID,
    target: UUID,
    options?: PathOptions
  ): Path[];

  // Cycle detection
  findCycles(): Cycle[];

  // Graph analysis
  getConnectedComponents(): UUID[][];
  getTopologicalSort(): UUID[];
}
```

## Use Cases

### ✅ Build Models Programmatically

```typescript
import { SysMLModel, SysMLMetatype } from '@sysml/core';

// Define a vehicle system
const model = new SysMLModel();

const system = model.createElement(SysMLMetatype.PACKAGE, 'VehicleSystem');
const vehicle = model.createElement(SysMLMetatype.PART_DEFINITION, 'Vehicle', system.id);
const engine = model.createElement(SysMLMetatype.PART_USAGE, 'engine', vehicle.id);
const wheels = model.createElement(SysMLMetatype.PART_USAGE, 'wheels', vehicle.id);

// Add specialization relationship
const electricVehicle = model.createElement(SysMLMetatype.PART_DEFINITION, 'ElectricVehicle', system.id);
model.addEdge(electricVehicle.id, vehicle.id, EdgeType.SPECIALIZES);
```

### ✅ Analyze Model Structure

```typescript
// Find all requirements
const requirements = model.getElementsByType(SysMLMetatype.REQUIREMENT_USAGE);

// Find elements with long names
const longNames = model.getElementsByPredicate(
  (el) => el.name.length > 20
);

// Get model statistics
const stats = {
  totalElements: model.getElementsByPredicate(() => true).length,
  packages: model.getElementsByType(SysMLMetatype.PACKAGE).length,
  parts: model.getElementsByType(SysMLMetatype.PART_DEFINITION).length,
  depth: getMaxDepth(model.getRoot())
};

function getMaxDepth(element: SysMLElement): number {
  if (element.children.length === 0) return 0;
  return 1 + Math.max(...element.children.map(getMaxDepth));
}
```

### ✅ Validate Model Integrity

```typescript
// Check for cycles in specialization hierarchy
const graph = model.getReferenceGraph();
const cycles = graph.findCycles();

if (cycles.length > 0) {
  console.error('Circular dependencies detected!');
  for (const cycle of cycles) {
    const names = cycle.path.map(id => model.getElementById(id)?.name);
    console.error(`  Cycle: ${names.join(' -> ')}`);
  }
}

// Verify all references are valid
const allEdges = graph.getOutgoingEdges(/* all nodes */);
for (const edge of allEdges) {
  const source = model.getElementById(edge.source);
  const target = model.getElementById(edge.target);

  if (!source || !target) {
    console.error(`Broken reference: ${edge.source} -> ${edge.target}`);
  }
}
```

### ✅ Transform AST to Model

```typescript
import { parseSysML } from '@sysml/grammar';
import { SysMLModel, SysMLMetatype } from '@sysml/core';

// Parse SysML file
const result = parseSysML(sysmlSource);

// Convert AST to model
function astToModel(ast: Model): SysMLModel {
  const model = new SysMLModel();

  function processElement(astEl: any, parentId?: UUID) {
    let metatype: SysMLMetatype;

    // Map AST type to metatype
    switch (astEl.$type) {
      case 'Package':
        metatype = SysMLMetatype.PACKAGE;
        break;
      case 'PartDefinition':
        metatype = SysMLMetatype.PART_DEFINITION;
        break;
      // ... handle all types
    }

    const element = model.createElement(metatype, astEl.name, parentId);

    // Process children
    if (astEl.body?.elements) {
      for (const child of astEl.body.elements) {
        processElement(child, element.id);
      }
    }

    return element;
  }

  for (const element of ast.elements) {
    processElement(element);
  }

  return model;
}

const model = astToModel(result.ast);
```

## Performance

- **Element creation**: O(1)
- **Element lookup by ID**: O(1)
- **Parent/child access**: O(1)
- **Type filtering**: O(n)
- **Path finding**: O(V + E) where V=vertices, E=edges
- **Cycle detection**: O(V + E)

**Memory**:
- ~200 bytes per element
- ~50 bytes per edge
- Typical model (1000 elements): ~250KB

## Relationship to Other Packages

The core model is typically used **after** parsing:

```typescript
// 1. Parse with grammar
import { parseSysML } from '@sysml/grammar';
const ast = parseSysML(source).ast;

// 2. Transform to core model
import { SysMLModel } from '@sysml/core';
const model = astToModel(ast);

// 3. Analyze with core model
const cycles = model.getReferenceGraph().findCycles();
```

Or built programmatically without parsing:

```typescript
// Build model directly
import { SysMLModel } from '@sysml/core';
const model = new SysMLModel();
model.createElement(...);
```

## Related Packages

- **[@sysml/grammar](../grammar)** - Parse SysML files to AST
- **[@sysml/language-server](../language-server)** - IDE support with validation
- **[vscode-extension](../vscode-extension)** - VS Code integration

## Contributing

See [IMPLEMENTATION_SUMMARY.md](../../IMPLEMENTATION_SUMMARY.md) for architecture details.

## License

LGPL-3.0-or-later

## Version

Current version: 0.2.0

---

**Quick Start**: `npm install @sysml/core && import { SysMLModel } from '@sysml/core'`
