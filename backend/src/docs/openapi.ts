/**
 * Minimal hand-crafted OpenAPI 3.1 document.
 * Covers /tasks (CRUD) and /auth/me (GET) with basic schema definitions.
 * Expanded in future slices as more domain routes stabilize.
 */
export const openApiDoc = {
  openapi: '3.1.0',
  info: {
    title: 'Task API',
    version: '1.0.0',
    description: 'Custom Hono backend replacing InsForge SDK',
  },
  components: {
    securitySchemes: {
      session: {
        type: 'http',
        scheme: 'bearer',
        description: 'BetterAuth session token (wired in Slice 4)',
      },
    },
    schemas: {
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'string' },
          categoryId: { type: 'integer', nullable: true },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          statusId: { type: 'integer', nullable: true },
          position: { type: 'integer', nullable: true },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'userId', 'title'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
        },
        required: ['id', 'email', 'name'],
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: {},
        },
        required: ['error', 'code'],
      },
    },
  },
  security: [{ session: [] }],
  paths: {
    '/auth/me': {
      get: {
        summary: 'Get authenticated user profile',
        tags: ['Auth'],
        responses: {
          '200': {
            description: 'Authenticated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/tasks': {
      get: {
        summary: 'List tasks for the authenticated user',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'categoryId',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Filter tasks by category',
          },
        ],
        responses: {
          '200': {
            description: 'Array of tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new task',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  categoryId: { type: 'integer' },
                  description: { type: 'string' },
                  statusId: { type: 'integer' },
                  position: { type: 'integer' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
                required: ['title'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created task',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/tasks/{id}': {
      patch: {
        summary: 'Update a task',
        tags: ['Tasks'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Updated task' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Task not found' },
        },
      },
      delete: {
        summary: 'Delete a task',
        tags: ['Tasks'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Task not found' },
        },
      },
    },
    '/tasks/{id}/reorder': {
      patch: {
        summary: 'Reorder a task (update position)',
        tags: ['Tasks'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { position: { type: 'integer' } },
                required: ['position'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated task with new position' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Task not found' },
        },
      },
    },
  },
}
