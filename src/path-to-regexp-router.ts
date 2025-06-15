import type { Route } from '@chubbyts/chubbyts-framework/dist/router/route';
import type { Match } from '@chubbyts/chubbyts-framework/dist/router/route-matcher';
import type { Routes } from '@chubbyts/chubbyts-framework/dist/router/routes';
import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
import type { Method, Query, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { MatchFunction, PathFunction } from 'path-to-regexp';
import { compile, match } from 'path-to-regexp';
import { createMethodNotAllowed, createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { GeneratePath, GenerateUrl } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
import { stringify } from 'qs';

/**
 * ```ts
 * import type { Match } from '@chubbyts/chubbyts-framework/dist/router/route-matcher';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
 * import { createPathToRegexpRouteMatcher } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';
 *
 * const routesByName: RoutesByName = ...;
 *
 * const pathToRegexpRouteMatcher: Match = createPathToRegexpRouteMatcher(routesByName);
 * ```
 */
export const createPathToRegexpRouteMatcher = (routes: Routes | RoutesByName): Match => {
  const routesByName = typeof routes === 'function' ? routes() : routes;
  const matchersByName: Map<string, MatchFunction<Record<string, string>>> = new Map(
    Array.from(routesByName.entries()).map(([name, route]) => [name, match(route.path)]),
  );

  return (request: ServerRequest): Route => {
    const method = request.method;
    const path = decodeURI(request.uri.path);

    const matchWithMethods: Array<Method> = [];

    for (const [name, route] of routesByName.entries()) {
      const matcherByName = matchersByName.get(name) as MatchFunction<Record<string, string>>;

      const matchedPath = matcherByName(path);

      if (!matchedPath) {
        continue;
      }

      const routeMethod = route.method;

      if (routeMethod === method) {
        return { ...route, attributes: matchedPath.params as Record<string, string> };
      }

      // eslint-disable-next-line functional/immutable-data
      matchWithMethods.push(routeMethod);
    }

    if (matchWithMethods.length > 0) {
      throw createMethodNotAllowed({
        detail: `Method "${method}" at path "${path}" is not allowed. Must be one of: "${matchWithMethods.join(
          '", "',
        )}".`,
      });
    }

    throw createNotFound({
      detail: `The page "${path}" you are looking for could not be found. Check the address bar to ensure your URL is spelled correctly.`,
    });
  };
};

/**
 * ```ts
 * import type { GeneratePath } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
 * import { createPathToRegexpPathGenerator } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';
 *
 * const routesByName: RoutesByName = ...;
 *
 * const pathToRegexpPathGenerator: GeneratePath = createPathToRegexpPathGenerator(routesByName);
 * ```
 */
export const createPathToRegexpPathGenerator = (routes: Routes | RoutesByName): GeneratePath => {
  const routesByName = typeof routes === 'function' ? routes() : routes;
  const compilesByName: Map<string, PathFunction<Record<string, string>>> = new Map(
    Array.from(routesByName.entries()).map(([name, route]) => [name, compile(route.path)]),
  );

  return (name: string, attributes?: Record<string, string>, query?: Query) => {
    const route = routesByName.get(name);

    if (undefined === route) {
      throw new Error(`Missing route: "${name}"`);
    }

    const compileByName = compilesByName.get(name) as PathFunction<Record<string, string>>;

    return compileByName(attributes) + (undefined !== query ? '?' + stringify(query, { encodeValuesOnly: true }) : '');
  };
};

/**
 * ```ts
 * import type { GeneratePath, GenerateUrl } from '@chubbyts/chubbyts-framework/dist/router/url-generator';
 * import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
 * import { createPathToRegexpUrlGenerator } from '@chubbyts/chubbyts-framework-router-path-to-regexp/dist/path-to-regexp-router';
 *
 * const generatePath: GeneratePath = ...;
 *
 * const pathToRegexpUrlGenerator: GenerateUrl = createPathToRegexpUrlGenerator(generatePath);
 * ```
 */
export const createPathToRegexpUrlGenerator = (generatePath: GeneratePath): GenerateUrl => {
  return (request: ServerRequest, name: string, attributes?: Record<string, string>, query?: Query) => {
    const { schema, userInfo, host, port } = request.uri;
    const path = generatePath(name, attributes, query);

    return schema + '://' + (userInfo ? userInfo + '@' : '') + host + (port ? ':' + port : '') + path;
  };
};
