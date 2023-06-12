import { RootNode, ClassNode, PropertyNode, SchemaType, SchemaNode } from './SchemaNode';
import { JSONSchema7 } from 'json-schema';

export type JSONSchema = JSONSchema7 & CanBeDeprecated;
// deprecated is not yet available in JSON schema draft07
type CanBeDeprecated = {
  deprecated?: boolean
}

// types which are used when a class can be chosen from a list of classes
const classSelectionTypes: SchemaType[] = ['anyOf', 'allOf', 'oneOf', 'mapOf'];

/**
 * For constructing a {@link SchemaNode} tree from a JSON schema.
 */
export default class JsonSchemaParser {
  private readonly fullSchema: JSONSchema
  private readonly idGenerator: NodeIdGenerator;

  constructor(schema: JSONSchema) {
    this.fullSchema = schema;
    this.idGenerator = new NodeIdGenerator();
  }

  /**
   * Constructs the {@link SchemaNode} tree and returns the root node.
   */
  parseSchema(): RootNode {
    const rootNode = new RootNode(this.idGenerator.generateId());
    const topLevelProperties = this.parseProperties(this.fullSchema);
    topLevelProperties.forEach(p => rootNode.addChild(p));
    return rootNode;
  }

  private parseProperties(object: JSONSchema): PropertyNode[] {
    if (!object.properties) {
      return [];
    }
    const requiredProperties = new Set(object.required);
    return Object.keys(object.properties).map((propertyName) => {
      return this.parseProperty(propertyName, requiredProperties.has(propertyName), object.properties![propertyName] as JSONSchema);
    })
  }

  private parseProperty(name: string, required: boolean, propertySchema: JSONSchema): PropertyNode {
    const enrichedSchema = this.enrichSchemaWithRef(propertySchema);
    let {type, typeDetails} = this.parseType(enrichedSchema);
    const deprecated = this.isDeprecated(enrichedSchema);
    const childNodes = this.parseChildren(type, enrichedSchema);
    if (this.hasClassNodeChildren(type, enrichedSchema)) {
      const typeDetailsAboutChildren = this.inferTypeDetailsFromChildClasses(childNodes as ClassNode[]);
      typeDetails = typeDetails ? `${typeDetails} ${typeDetailsAboutChildren}` : typeDetailsAboutChildren;
    }
    const propertyNode = new PropertyNode(this.idGenerator.generateId(), name, type, required, deprecated, typeDetails,
      enrichedSchema.description);
    childNodes.forEach(c => propertyNode.addChild(c));
    return propertyNode;
  }

  private enrichSchemaWithRef(schemaElement: JSONSchema): JSONSchema {
    return schemaElement.$ref ? {...this.getSchemaFromRef(schemaElement.$ref), ...schemaElement} : schemaElement;
  }

  private getSchemaFromRef(ref: string): JSONSchema {
    const path = ref.split('/').slice(1); // first element is #, so we skip it
    // our definitions section where the refs point to is not compatible with the JSONSchema typing
    let currentElement = this.fullSchema as any;
    for (const p of path) {
      currentElement = currentElement[p];
    }
    return currentElement as JSONSchema;
  }

  /**
   * Determines the type of the schema element.
   * If type details are available in the top level element, they are extracted as well.
   */
  private parseType(schemaElement: JSONSchema): { type: SchemaType, typeDetails?: string } {
    if (schemaElement.oneOf) {
      return {type: 'oneOf'};
    } else if (schemaElement.anyOf) {
      return {type: 'anyOf'};
    } else if (schemaElement.allOf) {
      return {type: 'allOf'};
    } else if (schemaElement.additionalProperties && (schemaElement.additionalProperties as JSONSchema).oneOf) {
      return {type: 'mapOf'};
    } else if (schemaElement.enum) {
      return {type: 'enum', typeDetails: schemaElement.enum.join(', ')};
    } else if (schemaElement.const) {
      return {type: 'const', typeDetails: schemaElement.const.toString()};
    } else if (schemaElement.type === 'object') {
      return {type: 'object', typeDetails: schemaElement.title};
    } else if (schemaElement.type === 'array') {
      return this.parseArrayType(schemaElement);
    } else if (schemaElement.type) { // string, number etc.
      return {type: schemaElement.type as SchemaType}; // we do not use union types in our schema, so this can only be a single type
    } else {
      throw new Error(`Could not infer type from schema ${JSON.stringify(schemaElement)}`);
    }
  }

  private parseArrayType(array: JSONSchema): { type: SchemaType, typeDetails?: string } {
    let itemType = this.getArrayItemType(array);
    if (itemType === 'object') {
      return {type: 'array'};
    } else {
      return {type: 'array', typeDetails: itemType};
    }
  }

  private isDeprecated(schemaElement: JSONSchema): boolean {
    return Boolean(schemaElement.deprecated);
  }

  private parseChildren(type: SchemaType, propertySchema: JSONSchema): SchemaNode[] {
    if (this.hasClassNodeChildren(type, propertySchema)) {
      const classChildren = this.getClassElements(type, propertySchema);
      return classChildren.map(c => this.parseClass(c));
    } else if (type === 'object' && propertySchema.properties) {
      return this.parseProperties(propertySchema);
    } else {
      return [];
    }
  }

  private hasClassNodeChildren(type: SchemaType, propertySchema: JSONSchema): boolean {
    return classSelectionTypes.includes(type)
      || (type === 'array' && [...classSelectionTypes, 'object'].includes(this.getArrayItemType(propertySchema)));
  }

  private getArrayItemType(array: JSONSchema): SchemaType {
    // we only have single object items in our schema, so it is not an array
    const items = array.items as JSONSchema;
    const enrichedItems = this.enrichSchemaWithRef(items);
    return this.parseType(enrichedItems).type;
  }

  private getClassElements(type: SchemaType, schemaElement: JSONSchema): JSONSchema[] {
    // we need to cast to JSONSchema here because in theory it is possible that the array elements are boolean
    // but this is not the case in our schema
    switch (type) {
      case 'anyOf':
        return schemaElement.anyOf as JSONSchema[];
      case 'allOf':
        return schemaElement.allOf as JSONSchema[];
      case 'oneOf':
        return schemaElement.oneOf as JSONSchema[];
      case 'mapOf':
        return (schemaElement.additionalProperties as JSONSchema).oneOf as JSONSchema[];
      case 'array':
        return this.getClassElementsForArray(schemaElement);
      default:
        throw new Error(`Type ${type} does not have class node children.`)
    }
  }

  private getClassElementsForArray(arrayElement: JSONSchema): JSONSchema[] {
    if (!arrayElement.items) {
      return [];
    }
    // we only have single object items in our schema, so it is not an array
    const items = arrayElement.items as JSONSchema;
    const itemsType = this.getArrayItemType(arrayElement);
    return classSelectionTypes.includes(itemsType) ? this.getClassElements(itemsType, items) : [items];
  }

  private parseClass(classSchema: JSONSchema): ClassNode {
    const enrichedSchema = this.enrichSchemaWithRef(classSchema);
    const baseClass = classSchema.$ref ? this.extractBaseClassFromRef(classSchema.$ref) : undefined;
    if (!enrichedSchema.title) throw new Error(`Class schema found without title: ${JSON.stringify(enrichedSchema)}`);
    const deprecated = this.isDeprecated(enrichedSchema);
    const classNode = new ClassNode(this.idGenerator.generateId(), enrichedSchema.title, deprecated,
      enrichedSchema.description, baseClass);
    const propertyNodes = this.parseProperties(enrichedSchema);
    propertyNodes.forEach(p => classNode.addChild(p));
    return classNode;
  }

  private extractBaseClassFromRef(ref: string): string | undefined {
    const baseClass = ref.split('/').slice(-2).shift();
    if (!baseClass) {
      throw new Error(`Base class could not be extracted from reference ${ref}.`)
    }
    // the 'Others' section is used for classes without a base class
    return baseClass !== 'Others' ? baseClass : undefined;
  }

  /**
   * Nodes with {@link ClassNode} children are missing type details after parsing because they need to inferred from the children.
   * This function looks at the classes of the children and generates the type details.
   */
  private inferTypeDetailsFromChildClasses(classChildren: ClassNode[]): string | undefined {
    if (classChildren.length === 1) {
      return classChildren[0].className;
    } else {
      return this.getCommonBaseClass(classChildren);
    }
  }

  private getCommonBaseClass(classNodes: ClassNode[]): string | undefined {
    const baseClasses = new Set(classNodes.map(c => c.baseClass))
    // there is only a common base class if all of them are the same
    if (baseClasses.size === 1) {
      return baseClasses.values().next().value;
    }
  }
}

class NodeIdGenerator {
  nextId = 0;

  generateId(): number {
    return this.nextId++;
  }
}