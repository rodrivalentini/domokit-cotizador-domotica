const CLAVES_STORAGE = {
  cotizacion: "domokit_cotizacion",
  cliente: "domokit_cliente",
  ultimoPresupuesto: "domokit_ultimo_presupuesto"
};

function guardarEnStorage(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

function leerDeStorage(clave, valorPorDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function borrarDeStorage(clave) {
  localStorage.removeItem(clave);
}

function vaciarStorage() {
  Object.values(CLAVES_STORAGE).forEach(clave => {
    localStorage.removeItem(clave);
  });
}
