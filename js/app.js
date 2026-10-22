const IVA = 0.21;
const PORCENTAJE_INSTALACION = 0.10;
const AMBIENTES = ["Living", "Cocina", "Dormitorio", "Oficina", "Quincho", "Exterior"];

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

const porId = (id) => document.getElementById(id);

const vistas = {
  catalogo: porId("vistaCatalogo"),
  datos: porId("vistaDatos"),
  comprobante: porId("vistaComprobante")
};

let catalogo = [];
let { lineas, conInstalacion } = {
  lineas: [],
  conInstalacion: false,
  ...leerDeStorage(CLAVES_STORAGE.cotizacion, {})
};

// ---------- Catálogo ----------

async function cargarCatalogo() {
  porId("estadoCarga").hidden = false;
  porId("errorCarga").hidden = true;
  try {
    catalogo = await obtenerDispositivos();
    poblarCategorias();
    renderizarCatalogo();
  } catch (error) {
    porId("mensajeError").textContent = error.message || "Ocurrió un error inesperado al cargar los datos.";
    porId("errorCarga").hidden = false;
  } finally {
    porId("estadoCarga").hidden = true;
  }
}

function poblarCategorias() {
  const selectorCategoria = porId("filtroCategoria");
  selectorCategoria.length = 1;
  const categorias = [...new Set(catalogo.map(({ categoria }) => categoria))];
  categorias.forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria;
    selectorCategoria.append(opcion);
  });
}

function poblarAmbientes() {
  AMBIENTES.forEach((ambiente) => {
    const opcion = document.createElement("option");
    opcion.value = ambiente;
    opcion.textContent = ambiente;
    porId("selectorAmbiente").append(opcion);
  });
}

function obtenerDispositivosFiltrados() {
  const texto = porId("campoBusqueda").value.trim().toLowerCase();
  const categoriaElegida = porId("filtroCategoria").value;

  const ordenamientos = {
    nombre: (primero, segundo) => primero.nombre.localeCompare(segundo.nombre),
    precioAscendente: (primero, segundo) => primero.precio - segundo.precio,
    precioDescendente: (primero, segundo) => segundo.precio - primero.precio
  };

  return catalogo
    .filter(({ nombre, categoria }) =>
      (!categoriaElegida || categoria === categoriaElegida) && nombre.toLowerCase().includes(texto))
    .sort(ordenamientos[porId("selectorOrden").value]);
}

function renderizarCatalogo() {
  const dispositivos = obtenerDispositivosFiltrados();
  porId("catalogo").innerHTML = dispositivos.length
    ? dispositivos.map(({ id, nombre, categoria, protocolo, precio, icono, imagen, descripcion }) => `
        <article class="tarjeta">
          ${imagen
            ? `<img class="tarjeta__imagen" src="${imagen}" alt="${nombre}" loading="lazy">`
            : `<div class="tarjeta__icono" aria-hidden="true">${icono}</div>`}
          <p class="tarjeta__etiqueta">${categoria} · ${protocolo}</p>
          <h3>${nombre}</h3>
          <p>${descripcion}</p>
          <div class="tarjeta__pie">
            <strong>${formatoMoneda.format(precio)}</strong>
            <button class="boton" data-agregar="${id}">Agregar</button>
          </div>
        </article>`).join("")
    : `<p class="aviso">No encontramos dispositivos con esa búsqueda. Probá con otra palabra o cambiá la categoría.</p>`;
}

// ---------- Cotización ----------

function persistirCotizacion() {
  guardarEnStorage(CLAVES_STORAGE.cotizacion, { lineas, conInstalacion });
}

function calcularTotales() {
  const cantidadTotal = lineas.reduce((acumulado, { cantidad }) => acumulado + cantidad, 0);
  const subtotal = lineas.reduce((acumulado, { precio, cantidad }) => acumulado + precio * cantidad, 0);
  const instalacion = conInstalacion
    ? lineas.reduce((acumulado, { precio, cantidad }) => (
      acumulado + Math.round(precio * PORCENTAJE_INSTALACION) * cantidad
    ), 0)
    : 0;
  const iva = (subtotal + instalacion) * IVA;
  return { cantidadTotal, subtotal, instalacion, iva, total: subtotal + instalacion + iva };
}

function renderizarCotizacion() {
  const { cantidadTotal, subtotal, instalacion, iva, total } = calcularTotales();

  porId("listaCotizacion").innerHTML = lineas.length
    ? lineas.map(({ clave, nombre, ambiente, precio, cantidad }) => `
        <li class="linea">
          <div>
            <strong>${nombre}</strong>
            <small>${ambiente} · ${formatoMoneda.format(precio)} c/u</small>
          </div>
          <div class="linea__control">
            <button class="boton-cantidad" data-restar="${clave}" aria-label="Quitar uno">−</button>
            <span>${cantidad}</span>
            <button class="boton-cantidad" data-sumar="${clave}" aria-label="Sumar uno">+</button>
            <button class="boton-cantidad boton-cantidad--quitar" data-quitar="${clave}" aria-label="Quitar ${nombre}">✕</button>
          </div>
        </li>`).join("")
    : `<li class="aviso">Todavía no agregaste dispositivos. Elegí un ambiente y sumá los que necesites.</li>`;

  porId("contadorDispositivos").textContent = cantidadTotal;
  porId("textoSubtotal").textContent = formatoMoneda.format(subtotal);
  porId("textoInstalacion").textContent = formatoMoneda.format(instalacion);
  porId("textoIva").textContent = formatoMoneda.format(iva);
  porId("textoTotal").textContent = formatoMoneda.format(total);
  porId("casillaInstalacion").checked = conInstalacion;
  porId("botonContinuar").disabled = !lineas.length;
  porId("botonVaciar").disabled = !lineas.length;
}

function actualizarCotizacion() {
  persistirCotizacion();
  renderizarCotizacion();
}

function agregarDispositivo(idDispositivo) {
  const dispositivo = catalogo.find(({ id }) => id === idDispositivo);
  const ambiente = porId("selectorAmbiente").value;
  const clave = `${idDispositivo}-${ambiente}`;
  const lineaExistente = lineas.find((linea) => linea.clave === clave);

  if (lineaExistente) {
    lineaExistente.cantidad++;
  } else {
    const { id, nombre, categoria, precio } = dispositivo;
    lineas.push({ clave, id, nombre, categoria, precio, ambiente, cantidad: 1 });
  }
  actualizarCotizacion();
  mostrarAviso(`${dispositivo.nombre} agregado en ${ambiente}`);
}

function cambiarCantidad(clave, variacion) {
  const linea = lineas.find((lineaActual) => lineaActual.clave === clave);
  linea.cantidad += variacion;
  if (linea.cantidad <= 0) {
    quitarLinea(clave);
    return;
  }
  actualizarCotizacion();
}

function quitarLinea(clave) {
  lineas = lineas.filter((linea) => linea.clave !== clave);
  actualizarCotizacion();
}

async function vaciarCotizacion() {
  const { isConfirmed } = await Swal.fire({
    title: "¿Vaciar la cotización?",
    text: "Se van a quitar todos los dispositivos que agregaste.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar"
  });
  if (!isConfirmed) return;

  lineas = [];
  conInstalacion = false;
  borrarDeStorage(CLAVES_STORAGE.cotizacion);
  renderizarCotizacion();
  mostrarAviso("Cotización vaciada");
}

// ---------- Datos del cliente y comprobante ----------

function construirDetalleHtml(lineasDetalle, { subtotal, instalacion, iva, total }) {
  const filas = lineasDetalle.map(({ nombre, ambiente, cantidad, precio }) => `
    <tr>
      <td>${nombre}<small>${ambiente}</small></td>
      <td>${cantidad}</td>
      <td>${formatoMoneda.format(precio * cantidad)}</td>
    </tr>`).join("");

  const filaInstalacion = instalacion
    ? `<tr><td colspan="2">Instalación y configuración</td><td>${formatoMoneda.format(instalacion)}</td></tr>`
    : "";

  return `
    <table class="detalle">
      <thead><tr><th>Dispositivo</th><th>Cant.</th><th>Importe</th></tr></thead>
      <tbody>${filas}${filaInstalacion}</tbody>
      <tfoot>
        <tr><td colspan="2">Subtotal + instalación</td><td>${formatoMoneda.format(subtotal + instalacion)}</td></tr>
        <tr><td colspan="2">IVA (21%)</td><td>${formatoMoneda.format(iva)}</td></tr>
        <tr class="detalle__total"><td colspan="2">Total</td><td>${formatoMoneda.format(total)}</td></tr>
      </tfoot>
    </table>`;
}

function leerDatosCliente() {
  return Object.fromEntries(new FormData(porId("formularioCliente")));
}

function restaurarDatosCliente() {
  const datosGuardados = leerDeStorage(CLAVES_STORAGE.cliente, {});
  const formulario = porId("formularioCliente");
  Object.entries(datosGuardados).forEach(([campo, valor]) => {
    if (formulario.elements[campo]) formulario.elements[campo].value = valor;
  });
}

function mostrarVista(nombreVista) {
  Object.entries(vistas).forEach(([nombre, vista]) => {
    vista.hidden = nombre !== nombreVista;
  });
  window.scrollTo({ top: 0 });
}

function irAlResumen() {
  porId("resumenFinal").innerHTML = construirDetalleHtml(lineas, calcularTotales());
  mostrarVista("datos");
}

function renderizarComprobante({ numero, fecha, cliente, lineas: lineasPresupuesto, totales }) {
  const { nombre, email, telefono, ciudad } = cliente;
  porId("numeroPresupuesto").textContent = `N° ${numero}`;
  porId("fechaPresupuesto").textContent = fecha;
  porId("nombreCliente").textContent = nombre;
  porId("contactoCliente").textContent = `${email} · ${telefono} · ${ciudad}`;
  porId("detallePresupuesto").innerHTML = construirDetalleHtml(lineasPresupuesto, totales);
  mostrarVista("comprobante");
}

async function confirmarPresupuesto(evento) {
  evento.preventDefault();
  const totales = calcularTotales();

  const { isConfirmed } = await Swal.fire({
    title: "¿Confirmar el presupuesto?",
    text: `Total a presupuestar: ${formatoMoneda.format(totales.total)}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Revisar"
  });
  if (!isConfirmed) return;

  const presupuesto = {
    numero: String(Date.now()).slice(-6),
    fecha: new Date().toLocaleDateString("es-AR"),
    cliente: leerDatosCliente(),
    lineas: [...lineas],
    totales
  };

  guardarEnStorage(CLAVES_STORAGE.ultimoPresupuesto, presupuesto);
  lineas = [];
  conInstalacion = false;
  borrarDeStorage(CLAVES_STORAGE.cotizacion);
  renderizarCotizacion();
  actualizarBotonUltimoPresupuesto();
  renderizarComprobante(presupuesto);
  Swal.fire({ title: "¡Presupuesto listo!", text: "Lo podés imprimir o armar otro.", icon: "success" });
}

function actualizarBotonUltimoPresupuesto() {
  porId("botonUltimoPresupuesto").hidden = !leerDeStorage(CLAVES_STORAGE.ultimoPresupuesto, null);
}

async function borrarDatosGuardados() {
  const { isConfirmed } = await Swal.fire({
    title: "¿Borrar todos los datos guardados?",
    text: "Se eliminan la cotización, tus datos de contacto y el último presupuesto.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, borrar todo",
    cancelButtonText: "Cancelar"
  });
  if (!isConfirmed) return;

  vaciarStorage();
  lineas = [];
  conInstalacion = false;
  porId("formularioCliente").reset();
  renderizarCotizacion();
  actualizarBotonUltimoPresupuesto();
  mostrarVista("catalogo");
  mostrarAviso("Datos guardados eliminados");
}

// ---------- Avisos ----------

function mostrarAviso(mensaje) {
  Toastify({
    text: mensaje,
    duration: 2200,
    gravity: "bottom",
    position: "right",
    style: { background: "#1f6f5c" }
  }).showToast();
}

// ---------- Eventos ----------

porId("catalogo").addEventListener("click", ({ target }) => {
  const botonAgregar = target.closest("[data-agregar]");
  if (botonAgregar) agregarDispositivo(Number(botonAgregar.dataset.agregar));
});

porId("listaCotizacion").addEventListener("click", ({ target }) => {
  const { sumar, restar, quitar } = target.closest("button")?.dataset || {};
  if (sumar) cambiarCantidad(sumar, 1);
  if (restar) cambiarCantidad(restar, -1);
  if (quitar) quitarLinea(quitar);
});

["campoBusqueda", "filtroCategoria", "selectorOrden"].forEach((id) => {
  porId(id).addEventListener("input", renderizarCatalogo);
});

porId("casillaInstalacion").addEventListener("change", ({ target }) => {
  conInstalacion = target.checked;
  actualizarCotizacion();
});

porId("botonVaciar").addEventListener("click", vaciarCotizacion);
porId("botonContinuar").addEventListener("click", irAlResumen);
porId("botonVolver").addEventListener("click", () => mostrarVista("catalogo"));
porId("botonReintentar").addEventListener("click", cargarCatalogo);
porId("botonBorrarDatos").addEventListener("click", borrarDatosGuardados);
porId("botonImprimir").addEventListener("click", () => window.print());
porId("botonNuevoPresupuesto").addEventListener("click", () => mostrarVista("catalogo"));
porId("botonUltimoPresupuesto").addEventListener("click", () => {
  renderizarComprobante(leerDeStorage(CLAVES_STORAGE.ultimoPresupuesto, null));
});

porId("formularioCliente").addEventListener("input", () => {
  guardarEnStorage(CLAVES_STORAGE.cliente, leerDatosCliente());
});
porId("formularioCliente").addEventListener("submit", confirmarPresupuesto);

// ---------- Inicio ----------

poblarAmbientes();
restaurarDatosCliente();
renderizarCotizacion();
actualizarBotonUltimoPresupuesto();
cargarCatalogo();
