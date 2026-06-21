# Landing Page Specification

## Purpose

Esta especificación detalla el comportamiento visual, interactivo y de navegación de la página de aterrizaje (landing page) rediseñada de TaskForge.

## Requirements

### Requirement: Dark Theme Visual Interface

La landing page DEBE forzar la visualización en tema oscuro (dark mode) independientemente del tema activo seleccionado en el dashboard por el usuario, para mantener una coherencia técnica premium y de alto contraste.

#### Scenario: Visualización inicial de la página
- GIVEN que el usuario accede a la URL raíz de la aplicación ("/")
- WHEN la página de aterrizaje se carga
- THEN el tema visual DEBE ser oscuro con una grilla técnica de fondo en CSS y glows violeta/azul
- AND la tipografía principal DEBE usar Outfit (para títulos) e Inter (para texto de lectura)

### Requirement: Interactive Product Demo

La página DEBE incluir un mockup interactivo simplificado de la jerarquía de categorías y del Kanban de tareas para demostrar las funcionalidades de la aplicación sin realizar llamadas a la base de datos ni requerir autenticación.

#### Scenario: Interacción con el tablero Kanban demostrativo
- GIVEN que el usuario visualiza la demo interactiva del Kanban en la landing
- WHEN el usuario realiza un hover sobre una tarjeta de tarea o columna
- THEN la tarjeta o columna DEBE mostrar una micro-animación de hover y un brillo sutil en su borde
- AND el usuario DEBE poder ver estados realistas y prioridades en las tareas del mockup

### Requirement: Responsive Navigation Action

La página DEBE ofrecer una llamada a la acción (CTA) responsiva y dinámica que derive al usuario al área correcta de trabajo de acuerdo a su estado de autenticación.

#### Scenario: Acción de usuario autenticado
- GIVEN que un usuario autenticado (con sesión activa) accede a la landing page
- WHEN el usuario hace clic en el botón principal
- THEN el sistema DEBE redirigir al usuario al dashboard ("/dashboard")
- AND el botón DEBE mostrar el texto "Ir al dashboard"

#### Scenario: Acción de usuario no autenticado
- GIVEN que un usuario sin sesión activa accede a la landing page
- WHEN el usuario hace clic en el botón principal
- THEN el sistema DEBE redirigir al usuario a la página de autenticación ("/auth")
- AND el botón DEBE mostrar el texto "Comenzar ahora"
