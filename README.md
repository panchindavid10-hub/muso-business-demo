# Muso Business · Revisión del sitio web

Versión de revisión para el cliente, hecha en HTML, CSS y JavaScript nativo. Incluye español e inglés, fotografías de referencia, cotización asistida por WhatsApp y ilustraciones de helicóptero y aeronave de ala fija que se ensamblan y separan al desplazarse.

**Vista previa:** https://panchindavid10-hub.github.io/muso-business-demo/

## Publicación

Los archivos de esta carpeta se publican desde la raíz de la rama principal con GitHub Pages. No requiere instalación ni compilación. Las rutas están preparadas para `/muso-business-demo/` y `.nojekyll` permite servir los archivos estáticos directamente.

Esta copia de revisión lleva `noindex,follow`. Al preparar el dominio definitivo, actualizar las rutas y las URLs de canonical, idiomas, Open Graph, JSON-LD y sitemap; retirar `noindex` cuando corresponda.

## Edición

- `es/` y `en/`: páginas en ambos idiomas.
- `assets/css/`: diseño general y animación.
- `assets/js/`: menú, cotización y animación de aeronaves.
- `assets/img/` y `assets/fonts/`: recursos alojados localmente.
- `ASSETS.md`: fuentes y licencias de los recursos visuales.

El formulario prepara un mensaje que el visitante revisa y envía desde WhatsApp. No almacena solicitudes ni envía correos. Las ilustraciones de las aeronaves son conceptuales y se muestran estáticas cuando se solicita reducir movimiento o la ventana tiene poca altura. El selector sigue permitiendo alternar entre ambas.

Las fotografías son referencias del sector y no representan instalaciones, personal o inventario de Muso Business. El contenido comercial está sujeto a confirmación de disponibilidad y alcance por la empresa.

## Explorador de aeronaves

El bloque interactivo de la portada muestra primero el helicóptero. Los botones «Helicópteros» y «Ala fija» alternan la ilustración y sus familias de componentes, conservando el punto del recorrido de ensamblado. Así se presentan ambas líneas sin repetir una segunda sección de scroll. Sin JavaScript se conserva el helicóptero estático.

Las piezas SVG usan atributos `data-aircraft-part` y `data-explode-x/y/rotate`. La animación se actualiza con el desplazamiento y se detiene fuera del área visible.

Comprobación de fases, selección de modelos y alternativas estáticas:

```bash
node tests/aircraft.test.mjs
```
