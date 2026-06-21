import { Hono } from 'hono'
import { openApiDoc } from './openapi'

export const docsRouter = new Hono()

// GET /docs/openapi.json — serves the OpenAPI 3.1 spec as JSON
docsRouter.get('/openapi.json', (c) => c.json(openApiDoc))

// GET /docs — minimal HTML page with Scalar UI pointing to the OpenAPI spec
docsRouter.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task API Docs</title>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/docs/openapi.json"
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`)
})
