# Design: Rediseño Radical de la Landing Page

## Technical Approach

La implementación reemplazará por completo el contenido de `LandingPage.tsx`. Forzaremos el modo oscuro agregando la clase `dark` y `bg-surface-950` en el contenedor raíz. Usaremos gradientes lineales CSS en `index.css` para generar una grilla técnica semitransparente de fondo, y capas con desenfoque de filtro (`blur-3xl`) para crear efectos de neón glow detrás del texto y del mockup. La sección de hero incluirá un mockup visual interactivo de la interfaz principal de TaskForge.

## Architecture Decisions

### Decision: Forzar Modo Oscuro en la Landing Page

| Opción | Tradeoffs | Decisión |
|--------|-----------|----------|
| Soportar ambos temas nativos (claro/oscuro) | Mayor consistencia con el dashboard, pero menor impacto visual inicial. | Rechazado |
| **Forzar modo oscuro en la landing page** | Look moderno técnico inmediato (Scale/OpenClaw), sin importar la configuración del sistema. | **Elegido** |

**Rationale**: Las landing pages de herramientas orientadas a desarrolladores (como Vercel, Stripe o Scale) lucen mucho mejor y tienen mayor impacto visual cuando se presentan directamente en modo oscuro.

### Decision: Mockup Kanban Demostrativo

| Opción | Tradeoffs | Decisión |
|--------|-----------|----------|
| Integrar `@dnd-kit/core` en la landing | Interactividad real de drag & drop, pero aumenta el tamaño del bundle y la complejidad de la landing. | Rechazado |
| **Mockup estático/hover reactivo con Tailwind** | Excelente rendimiento, peso nulo de bundle adicional, interacción sutil de hover suficiente para la demo. | **Elegido** |

**Rationale**: Un mockup visual estático con micro-interacciones de hover es perfectamente suficiente para comunicar el valor del producto sin sobrecargar de JavaScript el primer render de la landing.

## Data Flow

```
   useAuthStore (User Session)
         │
         ▼
    LandingPage ──(Redirige)──► Si está autenticado: /dashboard
         │
         └─────(Redirige)──► Si NO está autenticado: /auth
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/LandingPage.tsx` | Modify | Reemplazo por el nuevo diseño oscuro, mockup Kanban y grilla visual. |
| `frontend/index.html` | Modify | Agregar fuentes Google Fonts Outfit e Inter en el head para tipografía premium. |
| `frontend/src/index.css` | Modify | Añadir clases de utilidad `.grid-pattern` y `.radial-glow` para los fondos técnicos. |

## Interfaces / Contracts

No se agregan nuevas interfaces. Se consume la API de `useAuthStore` existente para verificar la sesión activa:
```typescript
const { user } = useAuthStore()
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Renderizado básico y consistencia de tema | Verificar que el contenedor de la landing page tenga forzados los estilos oscuros. |
| Integration | Comportamiento dinámico de los botones de navegación | Probar que el botón CTA dirija a `/dashboard` si hay usuario en `useAuthStore` o a `/auth` si es `null`. |

## Migration / Rollout

No requiere migración de datos. Cambio puramente visual en el cliente.

## Open Questions

None
