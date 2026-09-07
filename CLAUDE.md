# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **publishable React library** (`@smart-data-lake/sdlb-schema-viewer`) that renders Smart Data Lake Builder JSON config schemas as an interactive d3 tree. It is not an application — `src/index.tsx` and `src/App.tsx` exist only as a local dev harness (they fetch schemas from `https://smartdatalake.ch/json-schema-viewer/schemas/`) and are excluded from `tsconfig.json`'s `include`, so they never end up in `dist`.

The public API surface is exactly `src/main.ts`: `SchemaViewer` and `defaultTheme`. `vite-plugin-dts` only generates types for that file, so anything a consumer needs must be re-exported there.

## Commands

Node 22+ and yarn are required.

```bash
yarn install                       # yarn install --frozen-lockfile in CI
yarn start                         # vite dev server on http://localhost:5173
yarn build                         # library build into dist/
yarn test                          # vitest run (single pass), unit tests in src only
yarn test:watch
yarn test:e2e                      # playwright, specs in tests/e2e
yarn test:e2e:ui                   # interactive playwright runner
yarn lint                          # eslint src tests, --max-warnings=0 (warnings fail)

npx vitest run src/utils/JsonSchemaParser.test.ts        # one test file
npx vitest run -t 'part of test name'                    # one test by name
npx playwright test element-links                        # one e2e spec
npx playwright install chromium                          # once, before the first e2e run
```

CI (`.github/workflows/build.yml`) runs `lint`, `build`, `test` on Node 22/23/24, plus `test:e2e` on Node 22, for every branch except `main` and for PRs.

## Branching and release

`develop` is the integration branch and the PR target. Pushing to `main` triggers `.github/workflows/release.yml`, which lints/builds/tests, runs `yarn publish` to GitHub Packages (`npm.pkg.github.com`), and force-pushes a git tag named after `package.json`'s `version`. So a release is: bump `version` in `package.json` on `develop`, then merge `develop` → `main`.

## Dependency rules

Everything the component needs at runtime lives in **`peerDependencies`** and is stripped from the bundle by `rollup-plugin-peer-deps-external`; the same packages are duplicated in `devDependencies` for local dev and tests. A new runtime import must be added to *both*, not to `dependencies` — putting it in `dependencies` will silently inline it into `dist/main.js`.

`tsconfig.json` aliases `@mui/material` → `@mui/joy`. Styling is Joy UI; MUI Material components are not used directly.

## Architecture

Rendering is a two-stage pipeline, and the boundary between them matters:

**1. JSON Schema → `SchemaNode` tree** (`src/utils/JsonSchemaParser.ts`, `src/utils/SchemaNode.ts`)

`JsonSchemaParser` walks a `JSONSchema7` (plus a `deprecated` flag, which draft-07 lacks) and produces a tree of three node classes: `RootNode`, `PropertyNode`, `ClassNode` (a Scala class in the SDLB schema). Node dispatch everywhere uses the **visitor pattern** (`SchemaVisitor<T>`) — adding a node subclass means updating `SchemaVisitor` and every implementation, which are spread across `D3NodeUtils.ts` (`labelVisitor`, `deprecatedVisitor`), `D3SchemaTree.ts` (`expandOnlyRootNodeVisitor`), `NodeSearch.tsx`, and `DetailsPanelContent.tsx`. Use `toVisitor(fn)` when the behaviour is uniform across node types.

The parser deliberately assumes SDLB-schema shape rather than general JSON Schema — comments mark each spot. Notably: `type` is never a union; `items` is never an array; `$ref` targets are merged shallowly with the referring element (`enrichSchemaWithRef`, local element wins); `additionalProperties.oneOf` is treated as a `mapOf`; and a `$ref` under a `Others` definitions section means "no base class". Type details for nodes whose children are `ClassNode`s can only be inferred *after* parsing the children (the common base class, or the single class name).

**2. `SchemaNode` tree → SVG** (`src/utils/D3SchemaTree.ts`, `D3NodePainter.ts`, `D3LinkPainter.ts`, `D3Zoom.ts`)

D3 owns the DOM inside the `<g>` ref, not React. Consequences to respect:

- **Expand/collapse state is mutable state on the `SchemaNode` objects** (`showChildren`), not React state. `D3SchemaTree` mutates it and calls `drawTree()`; React is not involved. Collapsing resets the whole subtree.
- After `drawTree()`, previously held `HierarchyPointNode` references are stale — re-look them up via `findNodeBySchemaNode` (which queries the DOM by `node-<id>`).
- The tree is **horizontal**, achieved by swapping x/y coordinates everywhere through `swap()` / `getCoordinates()` / `setCoordinates()` in `D3NodeUtils.ts`. Never touch `node.x`/`node.y` directly.
- Layout size is computed in two iterations (`adaptTreeLayoutSize`): a first pass measures the minimum vertical node distance, then the height is corrected. Horizontal level spacing is derived from the longest visible label per level.
- `SchemaGraph.tsx` recreates the whole `D3SchemaTree`/`D3Zoom` when `props.schema` or `schemaTreeColors` change. Theme colours are therefore compared by `JSON.stringify` before being put into state — otherwise every render would rebuild the tree.

**Linking / deep links** (`src/utils/SchemaSerialization.ts`)

A node is serialized as the array of child indexes from the root, stored in the `path` URL param alongside `schema`. Deliberate behaviour: URL params are only *maintained* if they are already present (a bare URL stays bare and loads the newest schema); `path` is dropped whenever `schema` changes, since indexes are schema-specific.

**Component composition** — `SchemaViewer.tsx` is the only stateful container: it holds the selected schema name, the parsed tree, the selected node, details-panel visibility, and a `Blob` of the pretty-printed raw schema for `DownloadButton`. The details panel is hidden with `display: none` rather than unmounted, to preserve its state. `SchemaSelector` sorts schema names descending with `localeCompare` so the newest version is preselected.

## Testing

Vitest with `globals: true` and the jsdom environment, configured in `vite.config.ts` (not a separate vitest config). `src/setupTests.ts` stubs the SVG geometry APIs jsdom does not implement — `getBBox`, `viewBox`, `width`/`height`, plus `matchMedia` and `URL.createObjectURL`. Code that reads new SVG layout properties will need another stub there rather than a test-local mock.

`src/example-schema.json` is the shared fixture and mirrors real SDLB schema structure (`global`, `connections`, `dataObjects`, `actions`); prefer extending it over inlining schemas in tests.

The eslint config promotes `testing-library/no-node-access` to an **error**, so assertions must go through Testing Library queries even for the d3-rendered SVG (query by the rendered label text, e.g. `dataObjects[mapOf]*`).

## End-to-end tests

`tests/e2e` holds Playwright specs which drive the dev harness in a real browser — the layout-dependent
parts of the d3 graph (zoom, centering, level spacing) cannot be covered in jsdom. Vitest is scoped to
`src/**/*.test.{ts,tsx}` in `vite.config.ts` so it does not pick the specs up.

`playwright.config.ts` starts the dev server with `vite.config.e2e.ts`, which serves the schemas from
`tests/e2e/fixtures/schemas.ts` instead of from smartdatalake.ch (`define` overrides `VITE_SCHEMAS_URL`,
which `src/App.tsx` reads). Those fixtures are both derived from `src/example-schema.json`: the newest one
is the schema unchanged, the older one has a top-level property, a `dataObjects` class and a class property
removed, so the same element sits at different child indexes in the two versions. That is what the link
specs need — there is no second schema file in the repository.

Specs address graph nodes by their rendered label (`nodeLabel`, `nodeCircle` in `tests/e2e/viewer.ts`) and
the unlabelled icon buttons by the `data-testid` which `@mui/icons-material` puts on the icon. Constants
that describe the fixtures — labels, names, and the serialized `path` parameters — live in
`tests/e2e/fixture.ts`, so a change of the path format only has to be made there. `openViewer()` waits for
the tree before interacting: `NodeSearch` is rerendered when the schema arrives and discards earlier input.

The `test.fixme` specs in `element-links.spec.ts` describe how links should behave across schema versions
and fail today, because a `path` is a list of child indexes.

## Testing changes against the SDLB website

Build locally, `yarn pack`, then in the SDLB project's `documentation` branch remove `schema-viewer` from `dependencies` and `yarn add ../schema-viewer/sdlb-schema-viewer-v<version>.tgz`.
