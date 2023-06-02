/**
 * Abstract base class for constructing a schema tree.
 */
export abstract class SchemaNode {
  readonly id: number;
  children: SchemaNode[] = [];
  showChildren: boolean = false;
  parent?: SchemaNode;

  protected constructor(id: number) {
    this.id = id;
  }

  /**
   * Adds child to node and updates parent of child node.
   */
  addChild(child: SchemaNode) {
    if (child.parent) {
      throw new Error('Node cannot be assigned to multiple parent nodes!')
    }
    child.parent = this;
    this.children.push(child);
  }

  /**
   * @returns the children which should be visible when this node is visible
   */
  get visibleChildren(): SchemaNode[] {
    return this.showChildren ? this.children : [];
  }

  traverse(visitor: SchemaVisitor<void>) {
    this.accept(visitor);
    this.children.forEach(c => c.traverse(visitor));
  }

  /**
   * Accept function for the visitor pattern.
   */
  abstract accept<T>(visitor: SchemaVisitor<T>): T;
}

export class RootNode extends SchemaNode {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(id: number) {
    super(id);
  }

  accept<T>(visitor: SchemaVisitor<T>): T {
    return visitor.visitRootNode(this);
  }
}

export type SchemaType =
  | 'oneOf'
  | 'anyOf'
  | 'allOf'
  | 'mapOf'
  | 'enum'
  | 'const'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'any';

/**
 * A node which corresponds to a property in an object.
 */
export class PropertyNode extends SchemaNode {
  readonly propertyName: string;
  readonly type: SchemaType;
  readonly typeDetails?: string;
  readonly required: boolean;
  readonly deprecated: boolean;
  readonly description?: string;

  constructor(id: number, propertyName: string, type: SchemaType, required: boolean, deprecated: boolean,
              typeDetails?: string, description?: string) {
    super(id);
    this.propertyName = propertyName;
    this.type = type;
    this.required = required;
    this.deprecated = deprecated;
    this.description = description;
    this.typeDetails = typeDetails;
  }

  accept<T>(visitor: SchemaVisitor<T>): T {
    return visitor.visitPropertyNode(this);
  }
}

/**
 * A node which corresponds to a Scala class.
 */
export class ClassNode extends SchemaNode {
  readonly className: string;
  readonly deprecated: boolean;
  readonly baseClass?: string;
  readonly description?: string;

  constructor(id: number, className: string, deprecated: boolean, description?: string, baseClass?: string) {
    super(id);
    this.className = className;
    this.deprecated = deprecated;
    this.baseClass = baseClass;
    this.description = description;
  }

  accept<T>(visitor: SchemaVisitor<T>): T {
    return visitor.visitClassNode(this);
  }
}

/**
 * Visitor for the visitor pattern, to apply behaviour based on the node class.
 */
export interface SchemaVisitor<T> {
  visitRootNode(n: RootNode): T;
  visitPropertyNode(n: PropertyNode): T;
  visitClassNode(n: ClassNode): T;
}

export function toVisitor<T>(fn: (n: SchemaNode) => T): SchemaVisitor<T> {
  return {
    visitClassNode: fn,
    visitPropertyNode: fn,
    visitRootNode: fn
  }
}
