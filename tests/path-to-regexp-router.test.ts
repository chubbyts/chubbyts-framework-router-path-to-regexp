import { describe, expect, test } from 'vitest';
import type { Route } from '@chubbyts/chubbyts-framework/dist/router/route';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { RoutesByName } from '@chubbyts/chubbyts-framework/dist/router/routes-by-name';
import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import {
  createPathToRegexpGeneratePath,
  createPathToRegexpGenerateUrl,
  createPathToRegexpMatch,
  createPathToRegexpPathGenerator,
  createPathToRegexpRouteMatcher,
  createPathToRegexpUrlGenerator,
} from '../src/path-to-regexp-router';

describe('path-to-regexp-router', () => {
  describe('routes as map', () => {
    describe('createPathToRegexpMatch', () => {
      test('not found', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api', _route: 'Route' } as Route]]);

        const pathToRegexpMatch = createPathToRegexpMatch(routesByName);

        try {
          pathToRegexpMatch(serverRequest);
          throw new Error('expected error');
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "NotFound",
              "detail": "The path "/" you are looking for could not be found.",
              "status": 404,
              "title": "Not Found",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
            }
          `);
        }
      });

      test('bad request on invalid percent-encoding', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/%zz' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api', _route: 'Route' } as Route]]);

        const pathToRegexpMatch = createPathToRegexpMatch(routesByName);

        try {
          pathToRegexpMatch(serverRequest);
          throw new Error('expected error');
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "BadRequest",
              "detail": "The path "/%zz" contains invalid percent-encoding.",
              "status": 400,
              "title": "Bad Request",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
            }
          `);
        }
      });

      test('not found keeps the path percent-encoded', () => {
        const serverRequest = {
          method: 'GET',
          url: 'https://example.com/<script>alert(document.domain)</script>',
        } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api', _route: 'Route' } as Route]]);

        const pathToRegexpMatch = createPathToRegexpMatch(routesByName);

        try {
          pathToRegexpMatch(serverRequest);
          throw new Error('expected error');
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "NotFound",
              "detail": "The path "/%3Cscript%3Ealert(document.domain)%3C/script%3E" you are looking for could not be found.",
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

        const pathToRegexpMatch = createPathToRegexpMatch(routesByName);

        try {
          pathToRegexpMatch(serverRequest);
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

      test('method not allowed keeps the path percent-encoded', () => {
        const serverRequest = {
          method: 'GET',
          url: 'https://example.com/api/<img src=x onerror=alert(document.domain)>',
        } as ServerRequest;

        const routesByName: RoutesByName = new Map([
          ['name', { method: 'POST', path: '/api/:id', _route: 'Route' } as Route],
        ]);

        const pathToRegexpMatch = createPathToRegexpMatch(routesByName);

        try {
          pathToRegexpMatch(serverRequest);
          throw new Error('expected error');
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "MethodNotAllowed",
              "detail": "Method "GET" at path "/api/%3Cimg%20src=x%20onerror=alert(document.domain)%3E" is not allowed. Must be one of: "POST".",
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

        const pathToRegexpMatch = createPathToRegexpMatch(routesByName);

        expect(pathToRegexpMatch(serverRequest)).toMatchInlineSnapshot(`
          {
            "_route": "Route",
            "attributes": {},
            "method": "GET",
            "path": "/api",
          }
        `);
      });
    });

    describe('createPathToRegexpGeneratePath', () => {
      test('with attributes and query params', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpGeneratePath = createPathToRegexpGeneratePath(routesByName);

        expect(
          pathToRegexpGeneratePath('name', { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' }, 'key[subKey]=value'),
        ).toMatchInlineSnapshot('"/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"');
      });

      test('without attributes and query params', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet', _route: 'Route' } as Route]]);

        const pathToRegexpGeneratePath = createPathToRegexpGeneratePath(routesByName);

        expect(pathToRegexpGeneratePath('name')).toMatchInlineSnapshot('"/api/pet"');
      });

      test('without attributes', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpGeneratePath = createPathToRegexpGeneratePath(routesByName);

        expect(() => {
          pathToRegexpGeneratePath('name');
        }).toThrow('Missing parameters: id');
      });

      test('with missing route', () => {
        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpGeneratePath = createPathToRegexpGeneratePath(routesByName);

        expect(() => {
          pathToRegexpGeneratePath('noname');
        }).toThrow('Missing route: "noname"');
      });
    });

    describe('createPathToRegexpGenerateUrl', () => {
      test('with userInfo and port', () => {
        const serverRequest = { method: 'GET', url: 'https://user:password@example.com:10443/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpGenerateUrl = createPathToRegexpGenerateUrl(createPathToRegexpGeneratePath(routesByName));

        expect(
          pathToRegexpGenerateUrl(
            serverRequest,
            'name',
            { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' },
            'key[subKey]=value',
          ),
        ).toMatchInlineSnapshot(
          '"https://user:password@example.com:10443/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"',
        );
      });

      test('with username but without password and with port', () => {
        const serverRequest = { method: 'GET', url: 'https://user@example.com:10443/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpGenerateUrl = createPathToRegexpGenerateUrl(createPathToRegexpGeneratePath(routesByName));

        expect(
          pathToRegexpGenerateUrl(
            serverRequest,
            'name',
            { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' },
            'key[subKey]=value',
          ),
        ).toMatchInlineSnapshot(
          '"https://example.com:10443/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"',
        );
      });

      test('without userInfo and without port', () => {
        const serverRequest = { method: 'GET', url: 'https://example.com/api' } as ServerRequest;

        const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

        const pathToRegexpGenerateUrl = createPathToRegexpGenerateUrl(createPathToRegexpGeneratePath(routesByName));

        expect(
          pathToRegexpGenerateUrl(
            serverRequest,
            'name',
            { id: '82434d3a-7c6b-4dbf-8e4e-30ee8966a545' },
            'key[subKey]=value',
          ),
        ).toMatchInlineSnapshot('"https://example.com/api/pet/82434d3a-7c6b-4dbf-8e4e-30ee8966a545?key[subKey]=value"');
      });
    });

    describe('deprecated aliases', () => {
      describe('createPathToRegexpRouteMatcher', () => {
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
      });

      describe('createPathToRegexpUrlGenerator', () => {
        test('with userInfo and port', () => {
          const serverRequest = { method: 'GET', url: 'https://user:password@example.com:10443/api' } as ServerRequest;

          const routesByName: RoutesByName = new Map([['name', { path: '/api/pet/:id', _route: 'Route' } as Route]]);

          const pathToRegexpUrlGenerator = createPathToRegexpUrlGenerator(
            createPathToRegexpPathGenerator(routesByName),
          );

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
      });
    });
  });
});
