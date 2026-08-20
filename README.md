# chubbyts-framework-router-path-to-regexp

[![CI](https://github.com/chubbyts/chubbyts-framework-router-path-to-regexp/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-framework-router-path-to-regexp/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-framework-router-path-to-regexp/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-framework-router-path-to-regexp?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-framework-router-path-to-regexp%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-framework-router-path-to-regexp/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-framework-router-path-to-regexp.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-framework-router-path-to-regexp)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-framework-router-path-to-regexp&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-framework-router-path-to-regexp)

## Description

Path-to-regex routing implementation for [chubbyts-framework][2].

## Requirements

 * node: 22
 * [@chubbyts/chubbyts-framework][2]: ^3.2.0
 * [@chubbyts/chubbyts-http-error][3]: ^3.4.0
 * [@chubbyts/chubbyts-undici-server][4]: ^1.2.0
 * [path-to-regexp][5]: ^8.4.2

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-framework-router-path-to-regexp][1].

```ts
npm i @chubbyts/chubbyts-framework-router-path-to-regexp@^3.4.0
```

## Usage

All examples below share the following route setup:

```ts
import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
import { createRoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
import { createGetRoute } from '@chubbyts/chubbyts-framework/dist/router/route';

const routesByName: RoutesByName = createRoutesByName([
  createGetRoute({
    path: '/api/pets/:id',
    name: 'pet_read',
    handler: petReadHandler,
  }),
]);
```

### createPathToRegexpMatch

Creates a `Match` function which resolves an incoming server request to the matching route, including the matched path attributes. Throws a "not found" http error if no route matches the path, or a "method not allowed" http error if a route matches the path but not the method.

```ts
import type { Match } from '@chubbyts/chubbyts-framework/dist/router/route-matcher';
import { createPathToRegexpMatch } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';

const match: Match = createPathToRegexpMatch(routesByName);

// { ..., attributes: { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' } }
const route = match(serverRequest); // GET https://example.com/api/pets/82434d3a-7c6b-4dbf-8e4e-30ee8966a545
```

### createPathToRegexpGeneratePath

Creates a `GeneratePath` function which generates a path for a given route name, with optional path attributes and query string.

```ts
import type { GeneratePath } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
import { createPathToRegexpGeneratePath } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';

const generatePath: GeneratePath = createPathToRegexpGeneratePath(routesByName);

// /api/pets/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key=value
const path = generatePath('pet_read', { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' }, 'key=value');
```

### createPathToRegexpGenerateUrl

Creates a `GenerateUrl` function which generates an absolute url for a given route name, with optional path attributes and query string. Scheme, user info, host and port are taken from the given server request.

```ts
import type { GenerateUrl } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
import { createPathToRegexpGenerateUrl } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';

const generateUrl: GenerateUrl = createPathToRegexpGenerateUrl(routesByName);

// https://example.com/api/pets/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key=value
const url = generateUrl(serverRequest, 'pet_read', { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' }, 'key=value');
```

### Deprecated aliases

 * `createPathToRegexpRouteMatcher` is a deprecated alias for `createPathToRegexpMatch`
 * `createPathToRegexpPathGenerator` is a deprecated alias for `createPathToRegexpGeneratePath`
 * `createPathToRegexpUrlGenerator` is a deprecated alias for `createPathToRegexpGenerateUrl`

## Copyright

2026 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-framework-router-path-to-regexp
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-framework
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-error
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
[5]: https://www.npmjs.com/package/path-to-regexp
