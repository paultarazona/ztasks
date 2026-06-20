## Exploration: Rediseño de la Landing Page estilo Scale.com / OpenClaw.ai

### Current State
La página de aterrizaje actual (`LandingPage.tsx`) es extremadamente simple. Consta de un gradiente de fondo claro/oscuro básico, un header con enlace al dashboard, un título centrado y un footer estático. No refleja la potencia visual de una aplicación moderna ni tiene secciones que expliquen las características principales de TaskForge (Kanban, jerarquía recursiva, seguridad RLS).

### Affected Areas
- `frontend/src/pages/LandingPage.tsx` — Reemplazo total de la estructura visual, agregando secciones de hero moderno, grillas de características interactiva, mockups visuales y animaciones fluidas con Tailwind.
- `frontend/index.html` — (Opcional) Importación de tipografías premium desde Google Fonts (ej. *Inter* y *Outfit*) para lograr el look técnico y premium de Scale/OpenClaw.
- `frontend/src/index.css` — Adición de efectos de brillo de fondo (radial glow), grilla técnica (grid pattern) y transiciones avanzadas para componentes interactivos.

### Approaches

1. **Diseño Oscuro Radical con Efecto Grid y Neón Glow (Estilo OpenClaw/Scale)**
   - **Descripción**: Una interfaz de alto contraste, predominantemente oscura (`bg-surface-950`), con una grilla técnica de fondo generada por CSS y luces difusas (glows) violetas/índigo. Incluye un mockup premium del Kanban en el hero.
   - **Pros**:
     - Estética de última generación, impacta visualmente a programadores y profesionales.
     - Mayor contraste y legibilidad para los efectos de hover interactivos.
     - Uso de gradientes de texto de alta fidelidad.
   - **Cons**:
     - Requiere agregar patrones CSS específicos de fondo y glows radiales.
   - **Effort**: Medium

2. **Diseño Híbrido Claro/Oscuro con Tarjetas de Vidrio (Glassmorphism)**
   - **Descripción**: Una página que adapta su diseño de fondo dependiendo del tema global del usuario, usando efectos de vidrio esmerilado (`backdrop-blur`) en tarjetas flotantes y bordes semi-transparentes de color degradado.
   - **Pros**:
     - Se integra nativamente con el store de temas (`useThemeStore`).
     - Look elegante y suave, apto para un público más amplio.
   - **Cons**:
     - Menos "radical" e impactante que el estilo puramente técnico y oscuro.
     - Menor asociación directa con la estética de Scale.com.
   - **Effort**: Medium

### Recommendation
Recomiendo la **Opción 1 (Diseño Oscuro Radical con Efecto Grid y Neón Glow)**. Para lograr que sea "limpio, muy clean y moderno", un fondo técnico oscuro con grillas finas y un gran foco tipográfico es la opción superior. Además, agregaremos una previsualización interactiva de cómo funciona la jerarquía recursiva y el tablero Kanban dentro de la misma landing page.

### Risks
- **Rendimiento**: Los efectos de blur y glows excesivos pueden degradar el scroll. Los mantendremos ligeros mediante aceleración por hardware (`will-change-transform`).
- **Diseño del Tema**: La landing page será predominantemente oscura independientemente de si el tema de la aplicación dentro del dashboard es claro u oscuro (como lo hacen Stripe, Scale y Vercel). Esto requiere forzar estilos oscuros en este componente en particular, lo cual es simple de implementar.

### Ready for Proposal
Yes — Estamos listos para presentar la propuesta formal de diseño al usuario y proceder con el detalle de las especificaciones de la nueva interfaz.
