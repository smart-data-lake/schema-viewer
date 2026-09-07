import { RootNode, ClassNode, PropertyNode, SchemaType, SchemaNode } from './SchemaNode';
import { JSONSchema7 } from 'json-schema';

export type JSONSchema = JSONSchema7 & CanBeDeprecated;
// deprecated is not yet available in JSON schema draft07
type CanBeDeprecated = {
  deprecated?: boolean
}

// types which are used when a class can be chosen from a list of classes
const classSelectionTypes: SchemaType[] = ['anyOf', 'allOf', 'oneOf'];

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
    } else if (this.isMap(schemaElement)) {
      return this.parseMapType(schemaElement);
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
    // we only have single object items in our schema, so items is not an array
    const itemType = this.getValueType(array.items as JSONSchema);
    if (itemType === 'object') {
      return {type: 'array'};
    } else {
      return {type: 'array', typeDetails: itemType};
    }
  }

  /**
   * Maps are defined as objects without properties, where the schema of the values is given in additionalProperties.
   */
  private isMap(schemaElement: JSONSchema): boolean {
    const values = schemaElement.additionalProperties;
    // additionalProperties can also be a boolean, which does not tell us anything about the values
    return !schemaElement.properties && typeof values === 'object' && Object.keys(values).length > 0;
  }

  private parseMapType(map: JSONSchema): { type: SchemaType, typeDetails?: string } {
    const values = this.getMapValues(map);
    if (this.hasClassValues(values)) {
      // the type details of class values are inferred from the child class nodes
      return {type: 'mapOf'};
    } else {
      return {type: 'mapOf', typeDetails: this.getValueType(values)};
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
    switch (type) {
      case 'array':
        // we only have single object items in our schema, so items is not an array
        return Boolean(propertySchema.items) && this.hasClassValues(propertySchema.items as JSONSchema);
      case 'mapOf':
        return this.hasClassValues(this.getMapValues(propertySchema));
      default:
        return classSelectionTypes.includes(type);
    }
  }

  /**
   * @returns whether the values of a container type, i.e. the items of an array or the values of a map,
   * are parsed to {@link ClassNode}s.
   */
  private hasClassValues(valueSchema: JSONSchema): boolean {
    const enrichedValues = this.enrichSchemaWithRef(valueSchema);
    const valueType = this.parseType(enrichedValues).type;
    if (valueType === 'mapOf') {
      // for maps of maps the classes are the values of the inner map
      return this.hasClassValues(this.getMapValues(enrichedValues));
    }
    // objects are only parsed to class nodes if they have a title, which is used as class name
    return classSelectionTypes.includes(valueType) || (valueType === 'object' && Boolean(enrichedValues.title));
  }

  private getMapValues(map: JSONSchema): JSONSchema {
    return map.additionalProperties as JSONSchema;
  }

  private getValueType(valueSchema: JSONSchema): SchemaType {
    return this.parseType(this.enrichSchemaWithRef(valueSchema)).type;
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
        return this.getClassElementsForValues(this.getMapValues(schemaElement));
      case 'array':
        // we only have single object items in our schema, so items is not an array
        return schemaElement.items ? this.getClassElementsForValues(schemaElement.items as JSONSchema) : [];
      default:
        throw new Error(`Type ${type} does not have class node children.`)
    }
  }

  /**
   * @returns the schemas of the classes for the values of a container type, i.e. the items of an array or the
   * values of a map.
   */
  private getClassElementsForValues(valueSchema: JSONSchema): JSONSchema[] {
    const valueType = this.getValueType(valueSchema);
    return [...classSelectionTypes, 'mapOf'].includes(valueType)
      // for these types the class schemas are nested one level deeper
      ? this.getClassElements(valueType, this.enrichSchemaWithRef(valueSchema))
      // the reference is not resolved here, because the base class is extracted from it when the class is parsed
      : [valueSchema];
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