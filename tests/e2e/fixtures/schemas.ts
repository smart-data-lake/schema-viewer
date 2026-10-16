import exampleSchema from '../../../src/example-schema.json';
import { MISSING_IN_OLDER_SCHEMA, NEWEST_SCHEMA, OLDER_SCHEMA } from '../fixture';

const SUB_FEED_TYPE_KEYWORDS = ['x-subFeedTypes', 'x-readSubFeedTypes', 'x-writeSubFeedTypes'];

/**
 * The schemas served by the e2e dev server (see vite.config.e2e.ts).
 *
 * Both are derived from src/example-schema.json, which mirrors a real SDLB schema, so that there is only
 * one schema fixture in the repository. The older version is the same schema with a few elements removed,
 * which shifts the positions of the elements below them - a link created against one version therefore
 * points to a different element in the other version as long as links are position based. Like the versions
 * exported before smart-data-lake/smart-data-lake#1181, the older one does not list SubFeed types and does not
 * prefix its custom keywords with 'x-'.
 */
export function buildFixtureSchemas(): Record<string, unknown> {
  return {
    [NEWEST_SCHEMA]: exampleSchema,
    [OLDER_SCHEMA]: buildOlderSchema()
  };
}

function buildOlderSchema(): any {
  const older = structuredClone(exampleSchema) as any;
  const version = OLDER_SCHEMA.replace('sdl-schema-', '').replace('.json', '');
  delete older['x-version'];
  older.version = version;
  older.id = `${OLDER_SCHEMA}#`;

  delete older.properties[MISSING_IN_OLDER_SCHEMA.topLevelProperty];

  const dataObjectClasses = older.properties.dataObjects.additionalProperties.oneOf as { $ref: string }[];
  older.properties.dataObjects.additionalProperties.oneOf = dataObjectClasses
    .filter(c => !c.$ref.endsWith('/' + MISSING_IN_OLDER_SCHEMA.dataObjectClass));

  delete older.definitions.DataObject.HiveTableDataObject.properties[MISSING_IN_OLDER_SCHEMA.hiveTableDataObjectProperty];

  for (const definitions of [older.definitions.Action, older.definitions.DataObject]) {
    for (const definition of Object.values(definitions) as any[]) {
      SUB_FEED_TYPE_KEYWORDS.forEach(k => delete definition[k]);
    }
  }

  return older;
}
