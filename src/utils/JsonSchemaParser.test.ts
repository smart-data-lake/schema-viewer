import JsonSchemaParser, { getCustomKeyword, JSONSchema } from './JsonSchemaParser';
import { ClassNode, PropertyNode } from './SchemaNode';
import { resolvePath } from './SchemaSerialization';
import exampleSchema from '../example-schema.json';
import { test, expect } from 'vitest';

test('fields of properties are parsed', () => {
  let jsonSchema = {
    "type": "object",
    "properties": {
      "someName": {
        "type": "boolean",
        "description": "some description",
        "deprecated": true
      },
    }
  }
  const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

  const propertyNode = root.children[0] as PropertyNode;
  expect(propertyNode.propertyName).toBe('someName');
  expect(propertyNode.type).toBe('boolean');
  expect(propertyNode.description).toBe('some description');
  expect(propertyNode.deprecated).toBe(true);
  expect(propertyNode.id).toBeDefined();
});

test('multiple properties are parsed', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property1": {
        "type": "string"
      },
      "property2": {
        "type": "number"
      },
      "property3": {
        "type": "boolean"
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  expect(root.children).toHaveLength(3);
});

test('nested properties are parsed', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property1": {
        "type": "object",
        "properties": {
          "property2": {
            "type": "object",
            "title": "ClassName",
            "properties": {
              "property3": {
                "type": "string"
              }
            }
          }
        }
      },
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const property1 = root.children[0] as PropertyNode;
  const property2 = property1.children[0] as PropertyNode;
  const property3 = property2.children[0] as PropertyNode;
  expect(property1.propertyName).toBe('property1');
  expect(property1.type).toBe('object');
  expect(property1.typeDetails).toBeUndefined();
  expect(property2.propertyName).toBe('property2');
  expect(property2.type).toBe('object');
  expect(property2.typeDetails).toBe('ClassName');
  expect(property3.propertyName).toBe('property3');
  expect(property3.type).toBe('string');
  expect(property3.typeDetails).toBeUndefined();
});

test('required properties are parsed to required property nodes', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "required": ["requiredProperty"],
    "properties": {
      "requiredProperty": {
        "type": "string"
      },
      "optionalProperty": {
        "type": "string"
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const requiredPropertyNode = root.children.map(p => p as PropertyNode).find(p => p.propertyName === 'requiredProperty');
  const optionalPropertyNode = root.children.map(p => p as PropertyNode).find(p => p.propertyName === 'optionalProperty');
  expect(requiredPropertyNode!.required).toBe(true);
  expect(optionalPropertyNode!.required).toBe(false);
});

test('arrays with simple items do not have children', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const arrayNode = root.children[0] as PropertyNode;
  expect(arrayNode.type).toBe('array');
  expect(arrayNode.typeDetails).toBe('string');
  expect(arrayNode.children).toHaveLength(0);
});

test('map with simple values is parsed with the value type as type details', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "type": "object",
        "additionalProperties": {
          "type": "string"
        }
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const mapNode = root.children[0] as PropertyNode;
  expect(mapNode.type).toBe('mapOf');
  expect(mapNode.typeDetails).toBe('string');
  expect(mapNode.children).toHaveLength(0);
});

test('map with a single class as values is parsed to a class node child', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "type": "object",
        "description": "some description",
        "additionalProperties": {
          "type": "object",
          "title": "ClassName",
          "required": ["classProperty"],
          "properties": {
            "classProperty": {
              "type": "string"
            }
          }
        }
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const mapNode = root.children[0] as PropertyNode;
  const classNode = mapNode.children[0] as ClassNode;
  const propertyInClassNode = classNode.children[0] as PropertyNode;
  expect(mapNode.type).toBe('mapOf');
  expect(mapNode.typeDetails).toBe('ClassName');
  expect(mapNode.description).toBe('some description');
  expect(mapNode.children).toHaveLength(1);
  expect(classNode.className).toBe('ClassName');
  expect(propertyInClassNode.propertyName).toBe('classProperty');
  expect(propertyInClassNode.required).toBe(true);
});

test('map with untitled objects as values does not have children', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "type": "object",
        "additionalProperties": {
          "type": "object"
        }
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const mapNode = root.children[0] as PropertyNode;
  expect(mapNode.type).toBe('mapOf');
  expect(mapNode.typeDetails).toBe('object');
  expect(mapNode.children).toHaveLength(0);
});

test.each([[true], [false]])('object with additionalProperties=%s is not parsed as map', (additionalProperties: boolean) => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "type": "object",
        "additionalProperties": additionalProperties
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const objectNode = root.children[0] as PropertyNode;
  expect(objectNode.type).toBe('object');
  expect(objectNode.children).toHaveLength(0);
});

test('enum is parsed with possible values', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "type": "string",
        "enum": ["value1", "value2"],
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const enumNode = root.children[0] as PropertyNode;
  expect(enumNode.type).toBe('enum');
  expect(enumNode.typeDetails).toBe('value1, value2');
});

test('const is parsed with possible value', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "const": "constant"
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema).parseSchema();

  const enumNode = root.children[0] as PropertyNode;
  expect(enumNode.type).toBe('const');
  expect(enumNode.typeDetails).toBe('constant');
});

describe('schema references are resolved in', () => {
  test('property schema', () => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          "$ref": "#/definitions/BaseClass/ConcreteClass"
        },
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass": {
            "type": "object",
            "title": "ClassName",
            "description": "some description"
          }
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    expect(propertyNode.type).toBe('object');
    expect(propertyNode.typeDetails).toBe('ClassName');
    expect(propertyNode.description).toBe('some description');
  });

  test.each([['oneOf'], ['allOf'], ['anyOf']])('%s', (type: string) => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          [type]: [{
            "$ref": "#/definitions/BaseClass/ConcreteClass1"
          }, {
            "$ref": "#/definitions/BaseClass/ConcreteClass2"
          }]
        },
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass1": {
            "type": "object",
            "title": "ClassName1",
            "description": "some description"
          },
          "ConcreteClass2": {
            "type": "object",
            "title": "ClassName2",
            "deprecated": true,
          }
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    const classNode1 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName1')
    const classNode2 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName2')
    expect(propertyNode.type).toBe(type);
    expect(propertyNode.typeDetails).toBe('BaseClass');
    expect(classNode1!.baseClass).toBe('BaseClass');
    expect(classNode1!.description).toBe('some description');
    expect(classNode1!.deprecated).toBe(false);
    expect(classNode2!.baseClass).toBe('BaseClass');
    expect(classNode2!.description).toBeUndefined();
    expect(classNode2!.deprecated).toBe(true);
  });

  test('mapOf', () => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          "additionalProperties": {
            "oneOf": [{
              "$ref": "#/definitions/BaseClass/ConcreteClass1"
            }, {
              "$ref": "#/definitions/BaseClass/ConcreteClass2"
            }]
          },
        }
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass1": {
            "type": "object",
            "title": "ClassName1",
            "description": "some description"
          },
          "ConcreteClass2": {
            "type": "object",
            "title": "ClassName2",
            "deprecated": true,
          }
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    const classNode1 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName1')
    const classNode2 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName2')
    expect(propertyNode.type).toBe("mapOf");
    expect(propertyNode.typeDetails).toBe('BaseClass');
    expect(classNode1!.baseClass).toBe('BaseClass');
    expect(classNode1!.description).toBe('some description');
    expect(classNode1!.deprecated).toBe(false);
    expect(classNode2!.baseClass).toBe('BaseClass');
    expect(classNode2!.description).toBeUndefined();
    expect(classNode2!.deprecated).toBe(true);
  });

  test('mapOf with single ref', () => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/BaseClass/ConcreteClass"
          }
        }
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass": {
            "type": "object",
            "title": "ClassName"
          },
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    const classNode = propertyNode.children[0] as ClassNode;
    expect(propertyNode.type).toBe('mapOf');
    expect(propertyNode.typeDetails).toBe('ClassName');
    expect(classNode.className).toBe('ClassName');
    expect(classNode.baseClass).toBe('BaseClass');
  });

  test('array with single ref', () => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/BaseClass/ConcreteClass"
          }
        }
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass": {
            "type": "object",
            "title": "ClassName"
          },
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    const classNode = propertyNode.children[0] as ClassNode;
    expect(propertyNode.type).toBe('array');
    expect(propertyNode.typeDetails).toBe('ClassName');
    expect(classNode.className).toBe('ClassName');
    expect(classNode.baseClass).toBe('BaseClass');
  });

  test.each([['oneOf'], ['allOf'], ['anyOf']])('array containing %s', (type: string) => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          "type": "array",
          "items": {
            [type]: [{
              "$ref": "#/definitions/BaseClass/ConcreteClass1"
            }, {
              "$ref": "#/definitions/BaseClass/ConcreteClass2"
            }]
          }
        }
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass1": {
            "type": "object",
            "title": "ClassName1",
            "description": "some description"
          },
          "ConcreteClass2": {
            "type": "object",
            "title": "ClassName2",
            "deprecated": true,
          }
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    const classNode1 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName1')
    const classNode2 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName2')
    expect(propertyNode.type).toBe("array");
    expect(propertyNode.typeDetails).toBe(`${type} BaseClass`);
    expect(classNode1!.baseClass).toBe('BaseClass');
    expect(classNode1!.description).toBe('some description');
    expect(classNode1!.deprecated).toBe(false);
    expect(classNode2!.baseClass).toBe('BaseClass');
    expect(classNode2!.description).toBeUndefined();
    expect(classNode2!.deprecated).toBe(true);
  });

  test('array containing mapOf', () => {
    let jsonSchema = {
      "type": "object",
      "properties": {
        "property": {
          "type": "array",
          "items": {
            "additionalProperties": {
              "oneOf": [{
                "$ref": "#/definitions/BaseClass/ConcreteClass1"
              }, {
                "$ref": "#/definitions/BaseClass/ConcreteClass2"
              }]
            }
          }
        }
      },
      "definitions": {
        "BaseClass": {
          "ConcreteClass1": {
            "type": "object",
            "title": "ClassName1",
            "description": "some description"
          },
          "ConcreteClass2": {
            "type": "object",
            "title": "ClassName2",
            "deprecated": true,
          }
        }
      }
    }
    const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

    const propertyNode = root.children[0] as PropertyNode;
    const classNode1 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName1')
    const classNode2 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName2')
    expect(propertyNode.type).toBe("array");
    expect(propertyNode.typeDetails).toBe(`mapOf BaseClass`);
    expect(classNode1!.baseClass).toBe('BaseClass');
    expect(classNode1!.description).toBe('some description');
    expect(classNode1!.deprecated).toBe(false);
    expect(classNode2!.baseClass).toBe('BaseClass');
    expect(classNode2!.description).toBeUndefined();
    expect(classNode2!.deprecated).toBe(true);
  });
});

test('fields outside of ref override ref fields', () => {
  let jsonSchema = {
    "type": "object",
    "properties": {
      "property": {
        "$ref": "#/definitions/BaseClass/ConcreteClass",
        "deprecated": true
      },
    },
    "definitions": {
      "BaseClass": {
        "ConcreteClass": {
          "type": "object",
          "title": "ClassName",
          "description": "some description",
          "deprecated": false
        }
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

  const propertyNode = root.children[0] as PropertyNode;
  expect(propertyNode.type).toBe('object');
  expect(propertyNode.typeDetails).toBe('ClassName');
  expect(propertyNode.description).toBe('some description');
  expect(propertyNode.deprecated).toBe(true);
});

test('base class is undefined if schema is defined in "Others" section', () => {
  let jsonSchema = {
    "type": "object",
    "properties": {
      "property": {
        "oneOf": [{
          "$ref": "#/definitions/Others/ConcreteClass1"
        }, {
          "$ref": "#/definitions/Others/ConcreteClass2"
        }]
      },
    },
    "definitions": {
      "Others": {
        "ConcreteClass1": {
          "type": "object",
          "title": "ClassName1",
        },
        "ConcreteClass2": {
          "type": "object",
          "title": "ClassName2"
        }
      }
    }
  }
  const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

  const propertyNode = root.children[0] as PropertyNode;
  const classNode1 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName1')
  const classNode2 = propertyNode.children.map(c => c as ClassNode).find(c => c.className === 'ClassName2')
  expect(classNode1!.baseClass).toBeUndefined();
  expect(classNode2!.baseClass).toBeUndefined();
});

test('properties inside class node are parsed', () => {
  let jsonSchema: JSONSchema = {
    "type": "object",
    "properties": {
      "property": {
        "additionalProperties": {
          "oneOf": [{
            "type": "object",
            "title": "ClassName",
            "properties": {
              "classProperty": {
                "type": "string"
              }
            }
          }]
        },
      }
    },
  }
  const root = new JsonSchemaParser(jsonSchema as JSONSchema).parseSchema();

  const propertyNode = root.children[0] as PropertyNode;
  const classNode = propertyNode.children[0] as ClassNode;
  const propertyInClassNode = classNode.children[0] as PropertyNode;
  expect(classNode.className).toBe('ClassName');
  expect(propertyInClassNode.propertyName).toBe('classProperty');
});

describe('SubFeed types', () => {
  function parseClass(schema: JSONSchema, ...path: string[]): ClassNode {
    return resolvePath(path.join('/'), new JsonSchemaParser(schema).parseSchema()) as ClassNode;
  }

  test('are parsed for Actions, without the ignored Scala and Parameter SubFeed types', () => {
    // CopyAction lists ScalaSubFeed and SnowflakeTableDataObject lists ParameterSubFeed in the example schema
    const action = parseClass(exampleSchema as JSONSchema, 'actions', 'CopyAction');
    expect(action.subFeedTypes).toEqual({kind: 'Action', types: ['SnowparkSubFeed', 'SparkConnectSubFeed', 'SparkSubFeed']});
  });

  test('are parsed separately for reading and writing DataObjects, without the ignored ones', () => {
    const dataObject = parseClass(exampleSchema as JSONSchema, 'dataObjects', 'SnowflakeTableDataObject');
    expect(dataObject.subFeedTypes).toEqual({kind: 'DataObject', read: ['SnowparkSubFeed', 'SparkSubFeed'], write: ['SnowparkSubFeed', 'SparkSubFeed']});
  });

  test('are empty if only ignored SubFeed types are listed', () => {
    const action = parseClass(exampleSchema as JSONSchema, 'actions', 'CustomScriptAction');
    expect(action.subFeedTypes).toEqual({kind: 'Action', types: []});
  });

  test('are empty if their keyword is omitted in a schema which lists SubFeed types', () => {
    // AccessTableDataObject cannot be written, so x-writeSubFeedTypes is omitted
    const dataObject = parseClass(exampleSchema as JSONSchema, 'dataObjects', 'AccessTableDataObject');
    expect(dataObject.subFeedTypes).toEqual({kind: 'DataObject', read: ['SparkSubFeed'], write: []});
  });

  test('are undefined in a schema which does not list SubFeed types', () => {
    const olderSchema = JSON.parse(JSON.stringify(exampleSchema).replace(/"x-(read|write)?[sS]ubFeedTypes":\[[^\]]*\],?/g, ''));
    expect(JSON.stringify(olderSchema)).not.toContain('SubFeedTypes');

    expect(parseClass(olderSchema, 'actions', 'CopyAction').subFeedTypes).toBeUndefined();
    expect(parseClass(olderSchema, 'dataObjects', 'HiveTableDataObject').subFeedTypes).toBeUndefined();
  });

  test('are undefined for classes which are no Actions or DataObjects', () => {
    const connection = parseClass(exampleSchema as JSONSchema, 'connections', 'HiveTableConnection');
    expect(connection.subFeedTypes).toBeUndefined();
  });
});

describe('custom keywords', () => {
  test('are looked up with the x- prefix first', () => {
    expect(getCustomKeyword({'x-version': '2.0.0', version: '1.0.0'} as JSONSchema, 'version')).toBe('2.0.0');
  });

  test('fall back to the unprefixed name of older schema versions', () => {
    expect(getCustomKeyword({version: '1.0.0'} as JSONSchema, 'version')).toBe('1.0.0');
  });

  test('are undefined if missing', () => {
    expect(getCustomKeyword({}, 'version')).toBeUndefined();
  });
});
