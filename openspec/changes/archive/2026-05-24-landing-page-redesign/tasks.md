# Tasks: Rediseño Radical de la Landing Page

## Phase 1: Foundation

- [ ] 1.1 Importar tipografías *Outfit* e *Inter* y añadir meta tags SEO en `frontend/index.html`.
- [ ] 1.2 Añadir clases CSS para la grilla técnica (`.grid-pattern`) y luces de neón (`.radial-glow`) en `frontend/src/index.css`.

## Phase 2: Core Implementation

- [ ] 2.1 Reestructurar `frontend/src/pages/LandingPage.tsx` con el contenedor oscuro (`dark bg-surface-950`) y el header moderno.
- [ ] 2.2 Diseñar la sección Hero con el título de alto contraste tipográfico y gradientes en `LandingPage.tsx`.
- [ ] 2.3 Implementar el componente visual de mockup del Kanban y árbol de categorías demostrativo en `LandingPage.tsx`.
- [ ] 2.4 Agregar secciones de Características principales y Garantía de seguridad RLS con efectos hover dinámicos en `LandingPage.tsx`.
- [ ] 2.5 Añadir micro-animaciones (transiciones suaves en hover) a todas las tarjetas y botones en `LandingPage.tsx`.

## Phase 3: Integration & Testing

- [ ] 3.1 [RED] Crear archivo de tests `frontend/src/test/LandingPage.test.tsx` definiendo los casos fallantes para el renderizado del tema oscuro y la navegación según el estado de `useAuthStore`.
- [ ] 3.2 [GREEN] Asegurar que los botones de acción deriven correctamente a `/dashboard` (usuario autenticado) o `/auth` (usuario sin sesión) en `LandingPage.tsx`, haciendo pasar los tests.
- [ ] 3.3 [REFACTOR] Optimizar los estilos Tailwind en `LandingPage.tsx` y eliminar clases duplicadas o innecesarias.

## Phase 4: Verification & Polish

- [ ] 4.1 Ejecutar `npm run lint` en la carpeta `frontend` para comprobar la calidad del código TypeScript.
- [ ] 4.2 Ejecutar `npm run test:run` para comprobar que todos los tests pasen correctamente.
