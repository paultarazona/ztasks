# Landing Page Specification

## Purpose

Esta especificación detalla el comportamiento visual, interactivo y de navegación de la página de aterrizaje (landing page) minimalista en blanco limpio de ztasks.

## Requirements

### Requirement: Light Theme Visual Interface

La landing page DEBE forzar la visualización en tema claro (light mode) para mantener una coherencia de diseño suizo técnico, limpio y de altísimo contraste tipográfico.

#### Scenario: Visualización inicial de la página
- GIVEN que el usuario accede a la URL raíz de la aplicación ("/")
- WHEN la página de aterrizaje se carga
- THEN el tema visual DEBE ser claro con una grilla técnica fina gris-violeta de fondo y glows pastel sutiles
- AND la tipografía principal DEBE usar Outfit (para títulos) e Inter (para texto de lectura)
- AND el nombre de la marca DEBE ser "ztasks"

### Requirement: Interactive Minimalist Product Demo

La página DEBE incluir un mockup simplificado y flotante del tablero Kanban de tareas sin barra lateral para demostrar el valor del producto en un formato de vidrio blanco esmerilado translúcido con sombras finas.

#### Scenario: Interacción con el tablero Kanban demostrativo
- GIVEN que el usuario visualiza la demo flotante del Kanban en la landing
- WHEN el usuario realiza un hover sobre una tarjeta de tarea o columna
- THEN la tarjeta o columna DEBE mostrar una micro-animación de hover y un brillo/borde sutil
- AND el mockup no DEBE renderizar ninguna barra lateral o lista de navegación

### Requirement: Single Call-To-Action Button

La página DEBE ofrecer un único botón principal de llamado a la acción (CTA) de alto contraste en negro sólido con el texto "Comenzar gratis" que dirija de forma condicional al usuario según su estado de autenticación.

#### Scenario: Acción de usuario autenticado
- GIVEN que un usuario autenticado (con sesión activa) accede a la landing page
- WHEN el usuario hace clic en el botón "Comenzar gratis"
- THEN el sistema DEBE redirigir al usuario al dashboard ("/dashboard")

#### Scenario: Acción de usuario no autenticado
- GIVEN que un usuario sin sesión activa accede a la landing page
- WHEN el usuario hace clic en el botón "Comenzar gratis"
- THEN el sistema DEBE redirigir al usuario a la página de autenticación ("/auth")
