import type { Route } from '@chubbyts/chubbyts-framework/router/route';
import type { Match } from '@chubbyts/chubbyts-framework/router/route-matcher';
import type { RoutesByName } from '@chubbyts/chubbyts-framework/router/routes-by-name';
import type { GeneratePath, GenerateUrl } from '@chubbyts/chubbyts-framework/router/url-generator';
import type { ServerRequest } from '@chubbyts/chubbyts-http-types/message';
import {
  createBadRequest,
  createMethodNotAllowed,
  createNotFound,
} from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { MatchFunction, PathFunction } from 'path-to-regexp';
import { compile, match } from 'path-to-regexp';

const decodePath = (path: string): string => {
  try {
    return decodeURI(path);
  } catch {
    throw createBadRequest({
      detail: `The path "${path}" contains invalid percent-encoding.`,
    });
  }
};

/**
 * ```ts
 * import type { Match } from '@chubbyts/chubbyts-framework/router/route-matcher';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/router/routes-by-name';
 * import { createPathToRegexpMatch } from '@chubbyts/chubbyts-framework-router-path-to-regexp/path-to-regexp-router';
 *
 * const routesByName: RoutesByName = ...;
 *
 * const pathToRegexpMatch: Match = createPathToRegexpMatch(routesByName);
 * ```
 */
export const createPathToRegexpMatch = (routesByName: RoutesByName): Match => {
  const matchersByName: Map<string, MatchFunction<Record<string, string>>> = new Map(
    Array.from(routesByName.entries()).map(([name, route]) => [name, match(route.path)]),
  );

  return (serverRequest: ServerRequest): Route => {
    const path = serverRequest.uri.path;

    const decodedPath = decodePath(path);

    const matchWithMethods: Array<string> = [];

    for (const [name, route] of routesByName.entries()) {
      const matcherByName = matchersByName.get(name) as MatchFunction<Record<string, string>>;

      const matchedPath = matcherByName(decodedPath);

      if (!matchedPath) {
        continue;
      }

      if (route.method === serverRequest.method) {
        return { ...route, attributes: matchedPath.params as Record<string, string> };
      }

      // oxlint-disable-next-line functional/immutable-data
      matchWithMethods.push(route.method);
    }

    if (matchWithMethods.length > 0) {
      throw createMethodNotAllowed({
        detail: `Method "${serverRequest.method}" at path "${path}" is not allowed. Must be one of: "${matchWithMethods.join(
          '", "',
        )}".`,
      });
    }

    throw createNotFound({
      detail: `The path "${path}" you are looking for could not be found.`,
    });
  };
};

/**
 * ```ts
 * import type { GeneratePath } from '@chubbyts/chubbyts-framework/router/url-generator';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/router/routes-by-name';
 * import { createPathToRegexpGeneratePath } from '@chubbyts/chubbyts-framework-router-path-to-regexp/path-to-regexp-router';
 *
 * const routesByName: RoutesByName = ...;
 *
 * const pathToRegexpGeneratePath: GeneratePath = createPathToRegexpGeneratePath(routesByName);
 * ```
 */
export const createPathToRegexpGeneratePath = (routesByName: RoutesByName): GeneratePath => {
  const compilesByName: Map<string, PathFunction<Record<string, string>>> = new Map(
    Array.from(routesByName.entries()).map(([name, route]) => [name, compile(route.path)]),
  );

  return (name: string, attributes?: Record<string, string>, query?: string) => {
    const route = routesByName.get(name);

    if (undefined === route) {
      throw new Error(`Missing route: "${name}"`);
    }

    const compileByName = compilesByName.get(name) as PathFunction<Record<string, string>>;

    return compileByName(attributes) + (undefined !== query ? '?' + query : '');
  };
};

/**
 * ```ts
 * import type { GenerateUrl } from '@chubbyts/chubbyts-framework/router/url-generator';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/router/routes-by-name';
 * import { createPathToRegexpGenerateUrl } from '@chubbyts/chubbyts-framework-router-path-to-regexp/path-to-regexp-router';
 *
 * const routesByName: RoutesByName = ...;
 *
 * const pathToRegexpGenerateUrl: GenerateUrl = createPathToRegexpGenerateUrl(routesByName);
 * ```
 */
export const createPathToRegexpGenerateUrl = (routesByName: RoutesByName): GenerateUrl => {
  const generatePath = createPathToRegexpGeneratePath(routesByName);

  return (serverRequest: ServerRequest, name: string, attributes?: Record<string, string>, query?: string) => {
    const { scheme, userInfo, host, port } = serverRequest.uri;

    return (
      scheme +
      '://' +
      (userInfo !== '' ? `${userInfo}@` : '') +
      host +
      (port !== undefined ? ':' + port : '') +
      generatePath(name, attributes, query)
    );
  };
};
