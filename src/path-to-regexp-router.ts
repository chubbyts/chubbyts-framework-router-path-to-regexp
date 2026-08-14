import type { Route } from '@chubbyts/chubbyts-framework/dist/router/route';
import type { Match } from '@chubbyts/chubbyts-framework/dist/router/route-matcher';
import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
import type { MatchFunction, PathFunction } from 'path-to-regexp';
import { compile, match } from 'path-to-regexp';
import {
  createBadRequest,
  createMethodNotAllowed,
  createNotFound,
} from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { GeneratePath, GenerateUrl } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const decodePathname = (pathname: string): string => {
  try {
    return decodeURI(pathname);
  } catch {
    throw createBadRequest({
      detail: `The path "${pathname}" contains invalid percent-encoding.`,
    });
  }
};

/**
 * ```ts
 * import type { Match } from '@chubbyts/chubbyts-framework/dist/router/route-matcher';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
 * import { createPathToRegexpMatch } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';
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

  return (request: ServerRequest): Route => {
    const url = new URL(request.url);

    const pathname = decodePathname(url.pathname);

    const matchWithMethods: Array<string> = [];

    for (const [name, route] of routesByName.entries()) {
      const matcherByName = matchersByName.get(name) as MatchFunction<Record<string, string>>;

      const matchedPathname = matcherByName(pathname);

      if (!matchedPathname) {
        continue;
      }

      if (route.method === request.method) {
        return { ...route, attributes: matchedPathname.params as Record<string, string> };
      }

      // oxlint-disable-next-line functional/immutable-data
      matchWithMethods.push(route.method);
    }

    if (matchWithMethods.length > 0) {
      throw createMethodNotAllowed({
        detail: `Method "${request.method}" at path "${url.pathname}" is not allowed. Must be one of: "${matchWithMethods.join(
          '", "',
        )}".`,
      });
    }

    throw createNotFound({
      detail: `The path "${url.pathname}" you are looking for could not be found.`,
    });
  };
};

export const createPathToRegexpRouteMatcher = createPathToRegexpMatch;

/**
 * ```ts
 * import type { GeneratePath } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
 * import { createPathToRegexpGeneratePath } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';
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

export const createPathToRegexpPathGenerator = createPathToRegexpGeneratePath;

/**
 * ```ts
 * import type { GeneratePath, GenerateUrl } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
 * import { createPathToRegexpGenerateUrl } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';
 *
 * const generatePath: GeneratePath = ...;
 *
 * const pathToRegexpGenerateUrl: GenerateUrl = createPathToRegexpGenerateUrl(generatePath);
 * ```
 */
export const createPathToRegexpGenerateUrl = (generatePath: GeneratePath): GenerateUrl => {
  return (serverRequest: ServerRequest, name: string, attributes?: Record<string, string>, query?: string) => {
    const { protocol, username, password, hostname, port } = new URL(serverRequest.url);
    const path = generatePath(name, attributes, query);

    return (
      protocol +
      '//' +
      (username && password ? `${username}:${password}@` : '') +
      hostname +
      (port ? ':' + port : '') +
      path
    );
  };
};

export const createPathToRegexpUrlGenerator = createPathToRegexpGenerateUrl;
