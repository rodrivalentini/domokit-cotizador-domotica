# DomoKit

Simulador de cotización de domótica: se arma un kit de dispositivos por ambiente, se calcula el total (con instalación opcional e IVA) y se confirma un presupuesto. Entrega final del curso de JavaScript de la diplomatura Full Stack Web Developer de Coderhouse.

> Es un simulador con fines educativos: los precios son ficticios, no hay cobros reales ni registro de usuarios.

## Circuito

1. Ver el catálogo (buscar, filtrar por categoría, ordenar).
2. Elegir un ambiente y agregar dispositivos.
3. Modificar cantidades, quitar dispositivos o vaciar la cotización.
4. Elegir si se incluye la instalación, que suma un 10% del precio de cada unidad, y ver subtotal, IVA y total.
5. Completar los datos de contacto.
6. Confirmar y obtener el presupuesto (se puede imprimir o volver a ver más tarde).

## Cómo ejecutarlo

El catálogo se carga con `fetch` desde `data/dispositivos.json`, por eso **no funciona abriendo `index.html` con doble clic**. Usar un servidor local:

- VS Code: extensión *Live Server* → "Go Live".
- Terminal: `npx serve` o `python -m http.server`.

Necesita internet para cargar SweetAlert2, Toastify y las tipografías.

## Cálculo del presupuesto

- La instalación es opcional y se puede activar o desactivar desde la cotización.
- Si se incluye, se suma el 10% del precio de cada unidad seleccionada.
- El IVA del 21% se calcula sobre el subtotal más la instalación.

## Estructura

```
├── index.html
├── css/styles.css
├── js/
│   ├── api.js        # fetch del JSON
│   ├── storage.js    # funciones de localStorage
│   └── app.js        # DOM y lógica del simulador
├── data/dispositivos.json
└── assets/img/logo.svg
```

## Dónde está cada requisito

| Requisito | Dónde |
| --- | --- |
| Sin `prompt`/`alert`/`confirm` | Todo el proyecto |
| DOM dinámico | `app.js`: catálogo, cotización, resumen y presupuesto |
| Array de objetos en `.json` con `fetch` | `dispositivos.json` y `api.js` |
| `async/await` con `try/catch/finally` | `cargarCatalogo` en `app.js` |
| Funciones de orden superior | `map`, `filter`, `find`, `reduce`, `forEach`, `sort` |
| localStorage: guardar, modificar, borrar, vaciar | `storage.js` y `app.js` |
| Ternario, OR y destructuring | `app.js` |
| Librerías | SweetAlert2 y Toastify |
