# Proposal: Rediseño Radical de la Landing Page

## Intent

El problema actual es que la página de aterrizaje de TaskForge es extremadamente básica y no refleja la calidad y modernidad del producto. El objetivo es crear una landing page de alto impacto visual (estilo Scale.com / OpenClaw.ai) que sea moderna, técnica y limpia, para persuadir de forma efectiva a los usuarios y guiarlos al flujo de inicio de sesión o dashboard.

## Scope

### In Scope
- Nueva estructura visual e interactiva en `LandingPage.tsx` con estética oscura/técnica premium.
- Grilla técnica de fondo con CSS e iluminación suave (radial neon glows) violeta/azul.
- Panel interactivo de características (Kanban dinámico y jerarquía de carpetas/listas interactiva ficticia en la landing).
- Importación de fuentes Outfit e Inter en `index.html`.
- Secciones para: Hero, Características principales, Garantía de seguridad (RLS) y CTA de inicio de sesión.

### Out of Scope
- Funcionalidad real de base de datos o edición dentro de la landing page.
- Modificación del flujo de autenticación (`AuthPage.tsx`) o Dashboard en esta etapa.

## Capabilities

### New Capabilities
- `landing-page`: Capacidad que describe la interfaz de presentación de la aplicación, su interactividad demostrativa y secciones de conversión de usuarios.

### Modified Capabilities
- None

## Approach

Implementar un diseño visual de última generación en `LandingPage.tsx`. Usaremos una paleta oscura y profunda (`bg-surface-950`) inspirada en Scale.com, aplicando una grilla técnica en CSS mediante gradientes lineales de fondo. Añadiremos focos de color violeta e índigo con filtros blur para crear la atmósfera de neón. El mockup será una representación interactiva del Kanban y de la jerarquía de carpetas usando Tailwind CSS puro para garantizar la velocidad de carga.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/pages/LandingPage.tsx` | Modified | Reemplazo completo por el nuevo diseño técnico interactivo. |
| `frontend/index.html` | Modified | Agregar fuentes premium (*Outfit* e *Inter*) y meta tags SEO. |
| `frontend/src/index.css` | Modified | Agregar utilidades CSS para grilla de fondo y efectos radial glow. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pérdida de rendimiento por filtros de desenfoque (`blur`) | Low | Utilizar aceleración por hardware (`will-change-transform`) y limitar los glows a contenedores fijos. |
| Incompatibilidad de tema global | Low | Forzar estilo oscuro (`.dark`) únicamente en el componente de la landing page. |

## Rollback Plan

Revertir los cambios en los archivos modificados mediante Git:
```bash
git checkout HEAD -- frontend/src/pages/LandingPage.tsx frontend/index.html frontend/src/index.css
```

## Dependencies

- Ninguna externa (Tailwind CSS 3.4 ya está instalado).

## Success Criteria

- [ ] La landing page se renderiza correctamente con una estética oscura moderna y grillas técnicas en cualquier resolución.
- [ ] La demo Kanban de la landing page responde fluidamente a interacciones simples (hover/clicks).
- [ ] El tiempo de carga de la página se mantiene excelente, sin dependencias pesadas de terceros.
