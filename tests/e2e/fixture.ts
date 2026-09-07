/**
 * The schemas served to the app during the e2e tests, so that specs assert against named constants
 * instead of magic strings. The fixtures are derived from src/example-schema.json,
 * see tests/e2e/fixtures/schemas.ts.
 */

/** the newest schema, and therefore the one preselected on a bare url */
export const NEWEST_SCHEMA = 'sdl-schema-2.5.1.json';

/** an older schema version, in which the elements of {@link TABLE_ELEMENT} sit at different positions */
export const OLDER_SCHEMA = 'sdl-schema-2.4.0.json';

export const SCHEMAS = [NEWEST_SCHEMA, OLDER_SCHEMA];

/**
 * What the older schema is missing compared to the newest one. Each removal shifts the position of one
 * element on the path to {@link TABLE_ELEMENT} by one, which is what makes the two versions interesting
 * for the link specs.
 */
export const MISSING_IN_OLDER_SCHEMA = {
  /** shifts the position of dataObjects and actions in the root */
  topLevelProperty: 'connections',
  /** shifts the position of the classes following it in dataObjects */
  dataObjectClass: 'AccessTableDataObject',
  /** shifts the position of the properties following it in HiveTableDataObject */
  hiveTableDataObjectProperty: 'path'
};

/** node labels as they are rendered in the graph */
export const ROOT_LABEL = 'schema{ }';
export const TOP_LEVEL_LABELS = {
  global: 'global{ }',
  connections: 'connections[mapOf]',
  dataObjects: 'dataObjects[mapOf]*',
  actions: 'actions[mapOf]*'
};

/**
 * The element the link specs navigate to: dataObjects > HiveTableDataObject > table.
 * The path parameters are kept here because they are the serialization format under test - a change of
 * the format should only have to be made in this file.
 */
export const TABLE_ELEMENT = {
  name: 'table',
  label: 'table{ }*',
  type: 'object',
  labelsOnPath: [TOP_LEVEL_LABELS.dataObjects, 'HiveTableDataObject{ }', 'table{ }*'],
  /** the ancestors shown below the name in the search results */
  searchAncestors: 'dataObjects>HiveTableDataObject>table',
  pathParam: 'dataObjects/HiveTableDataObject/table',
  /** how the same element was referenced before the paths were composed of names */
  positionPathParamInNewestSchema: '[2,10,6]',
  positionPathParamInOlderSchema: '[1,9,5]'
};

/** a top level element, used to check that the path parameter follows the selection */
export const ACTIONS_ELEMENT = {
  name: 'actions',
  label: TOP_LEVEL_LABELS.actions,
  pathParam: 'actions'
};

/**
 * An element which only exists in the newest schema, because
 * {@link MISSING_IN_OLDER_SCHEMA.hiveTableDataObjectProperty} is removed from the older one.
 */
export const ELEMENT_MISSING_IN_OLDER_SCHEMA = {
  name: MISSING_IN_OLDER_SCHEMA.hiveTableDataObjectProperty,
  parentName: 'HiveTableDataObject',
  parentLabel: 'HiveTableDataObject{ }',
  pathParam: 'dataObjects/HiveTableDataObject/path'
};

/** a path parameter which does not point to an element in any of the schemas */
export const UNKNOWN_PATH_PARAM = 'doesNotExist';

/** a class of dataObjects, used to check the details panel and the search */
export const HIVE_TABLE_DATA_OBJECT = {
  name: 'HiveTableDataObject',
  label: 'HiveTableDataObject{ }',
  /** the ancestors shown below the name in the search results */
  searchAncestors: 'dataObjects>HiveTableDataObject',
  type: 'object: HiveTableDataObject extends DataObject',
  descriptionContains: 'Provides details to access Hive tables'
};

/** a class of connections, used to check expanding and collapsing */
export const HIVE_TABLE_CONNECTION = {
  name: 'HiveTableConnection',
  label: 'HiveTableConnection{ }'
};

/** the first property of global, used to check that nodes start out collapsed */
export const GLOBAL_FIRST_PROPERTY_LABEL = 'kryoClasses[string]';
