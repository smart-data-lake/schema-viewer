import { ClassNode, PropertyNode, RootNode, SchemaNode } from './SchemaNode';
import { labelVisitor } from './D3NodeUtils';

const arrayPropertyWithChildren = new PropertyNode(0, 'arrayProperty', 'array', false, false, 'SomeClass');
arrayPropertyWithChildren.addChild(new ClassNode(1, 'SomeClass', false));

describe('labelVisitor determines correct node label', () => {
  test.each([
    [new RootNode(0), 'schema{ }'],
    [new PropertyNode(0, 'objectProperty', 'object', false, false), 'objectProperty{ }'],
    [new PropertyNode(0, 'booleanProperty', 'boolean', false, false), 'booleanProperty(boolean)'],
    [new PropertyNode(0, 'requiredProperty', 'string', true, false), 'requiredProperty(string)*'],
    [new PropertyNode(0, 'arrayProperty', 'array', false, false, 'string'), 'arrayProperty[string]'],
    [new PropertyNode(0, 'arrayProperty', 'array', false, false), 'arrayProperty[ ]'],
    [arrayPropertyWithChildren, 'arrayProperty[ ]'],
    [new PropertyNode(0, 'anyOfProperty', 'anyOf', false, false), 'anyOfProperty[anyOf]'],
    [new PropertyNode(0, 'mapOfProperty', 'mapOf', false, false), 'mapOfProperty[mapOf]'],
    [new PropertyNode(0, 'oneOfProperty', 'oneOf', false, false), 'oneOfProperty[oneOf]'],
    [new PropertyNode(0, 'allOfProperty', 'allOf', false, false), 'allOfProperty[allOf]'],
    [new ClassNode(0, 'TestClass', false), 'TestClass{ }']
  ])('%s', (node: SchemaNode, expectedLabel: string) => {
    const nodeLabel = node.accept(labelVisitor);
    expect(nodeLabel).toBe(expectedLabel);
  });
});
