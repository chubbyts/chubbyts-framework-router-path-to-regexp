import { describe, expect, test } from 'vitest';
import type { Route } from '@chubbyts/chubbyts-framework/dist/router/route';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import {
  createPathToRegexpPathGenerator,
  createPathToRegexpRouteMatcher,
  createPathToRegexpUrlGenerator,
} from '../src/path-to-regexp-router';

describe('path-to-regexp-router', () => {
  describe('routes as map', () => {
    describe('createPathToRegexpRouteMatcher', () => {
      test('not found', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api', _route: 'Route' } as Route]]);

        const pathToRegexpRouteMatcher = createPathToRegexpRouteMatcher(routesByName);

        try {
          pathToRegexpRouteMatcher(serverRequest);
          throw new Error('expected error');
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "NotFound",
              "detail": "The page "/" you are looking for could not be found. Check the address bar to ensure your URL is spelled correctly.",
              "status": 404,
              "title": "Not Found",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
            }
          `);
        }
      });

      test('method not allowed', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([
          ['name1', { method: 'POST', path: '/api', _route: 'Route' } as Route],
          ['name2', { method: 'PUT', path: '/api', _route: 'Route' } as Route],
        ]);

        const pathToRegexpRouteMatcher = createPathToRegexpRouteMatcher(routesByName);

        try {
          pathToRegexpRouteMatcher(serverRequest);
          throw new Error('expected error');
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "MethodNotAllowed",
              "detail": "Method "GET" at path "/api" is not allowed. Must be one of: "POST", "PUT".",
              "status": 405,
              "title": "Method Not Allowed",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.6",
            }
          `);
        }
      });

      test('matched', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([
          ['name', { method: 'GET', path: '/api', _route: 'Route' } as Route],
        ]);

        const pathToRegexpRouteMatcher = createPathToRegexpRouteMatcher(routesByName);

        expect(pathToRegexpRouteMatcher(serverRequest)).toMatchInlineSnapshot(`
          {
            "_route": "Route",
            "attributes": {},
            "method": "GET",
            "path": "/api",
          }
        `);
      });
    });

    describe('createPathToRegexpPathGenerator', () => {
      test('with attributes and query params', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpPathGenerator = createPathToRegexpPathGenerator(routesByName);

        expect(
          pathToRegexpPathGenerator('name', { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' }, 'key[subKey]=value'),
        ).toMatchInlineSnapshot('"/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"');
      });

      test('without attributes and query params', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet', _route: 'Route' } as Route]]);

        const pathToRegexpPathGenerator = createPathToRegexpPathGenerator(routesByName);

        expect(pathToRegexpPathGenerator('name')).toMatchInlineSnapshot('"/api/pet"');
      });

      test('without attributes', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpPathGenerator = createPathToRegexpPathGenerator(routesByName);

        expect(() => {
          pathToRegexpPathGenerator('name');
        }).toThrow('Missing parameters: id');
      });

      test('with missing route', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpPathGenerator = createPathToRegexpPathGenerator(routesByName);

        expect(() => {
          pathToRegexpPathGenerator('noname');
        }).toThrow('Missing route: "noname"');
      });
    });

    describe('createPathToRegexpUrlGenerator', () => {
      test('with userInfo and port', () => {
        const serverRequest = { method: 'GET', url: 'https://user:password@example.com:10443/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpUrlGenerator = createPathToRegexpUrlGenerator(createPathToRegexpPathGenerator(routesByName));

        expect(
          pathToRegexpUrlGenerator(
            serverRequest,
            'name',
            { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' },
            'key[subKey]=value',
          ),
        ).toMatchInlineSnapshot(
          '"https://user:password@example.com:10443/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"',
        );
      });

      test('without userInfo and without port', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpUrlGenerator = createPathToRegexpUrlGenerator(createPathToRegexpPathGenerator(routesByName));

        expect(
          pathToRegexpUrlGenerator(
            serverRequest,
            'name',
            { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' },
            'key[subKey]=value',
          ),
        ).toMatchInlineSnapshot('"https://example.com/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"');
      });
    });
  });
});
