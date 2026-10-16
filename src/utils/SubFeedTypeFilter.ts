import { allSubFeedTypes, ClassNode, SchemaNode, SchemaVisitor, SubFeedTypes } from './SchemaNode';

/**
 * Decides whether a node is hidden by a filter. Its subtree is hidden along with it.
 */
export type NodeFilter = (n: SchemaNode) => boolean;

export const noNodeHidden: NodeFilter = () => false;

export const subFeedTypesVisitor: SchemaVisitor<SubFeedTypes | undefined> = {
  visitClassNode: (n: ClassNode) => n.subFeedTypes,
  visitPropertyNode: () => undefined,
  visitRootNode: () => undefined
};

/**
 * @returns the short name of a SubFeed type, e.g. 'SparkConnect' for 'SparkConnectSubFeed'
 */
export function formatSubFeedType(subFeedType: string): string {
  return subFeedType.replace(/SubFeed$/, '');
}

/**
 * @returns the SubFeed types sorted by their short name, so that e.g. 'Spark' comes before 'SparkConnect'
 */
export function sortSubFeedTypes(subFeedTypes: string[]): string[] {
  return [...subFeedTypes].sort((t1, t2) => formatSubFeedType(t1).localeCompare(formatSubFeedType(t2)));
}

/**
 * @returns the SubFeed types listed anywhere in the schema, sorted
 */
export function collectSubFeedTypes(schema: SchemaNode): string[] {
  const types = new Set<string>();
  schema.traverse({
    visitClassNode: n => n.subFeedTypes && allSubFeedTypes(n.subFeedTypes).forEach(t => types.add(t)),
    visitPropertyNode: () => {},
    visitRootNode: () => {}
  });
  return sortSubFeedTypes(Array.from(types));
}

/**
 * Hides the Actions and DataObjects which support none of the selected SubFeed types. DataObjects match
 * if they can read or write one of them. Elements whose SubFeed types are unknown, because the schema version
 * does not list them, are never hidden.
 */
export function createSubFeedTypeFilter(selectedTypes: string[]): NodeFilter {
  if (selectedTypes.length === 0) {
    return noNodeHidden;
  }
  return n => {
    const subFeedTypes = n.accept(subFeedTypesVisitor);
    return Boolean(subFeedTypes) && !allSubFeedTypes(subFeedTypes!).some(t => selectedTypes.includes(t));
  };
}

export function isHiddenWithAncestors(node: SchemaNode, isHidden: NodeFilter): boolean {
  return isHidden(node) || (node.parent ? isHiddenWithAncestors(node.parent, isHidden) : false);
}

/**
 * @returns the node itself if it is visible, otherwise its closest ancestor which is
 */
export function closestVisibleNode(node: SchemaNode, isHidden: NodeFilter): SchemaNode {
  return isHiddenWithAncestors(node, isHidden) && node.parent ? closestVisibleNode(node.parent, isHidden) : node;
}
