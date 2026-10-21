const RUTA_DISPOSITIVOS = "./data/dispositivos.json";

async function obtenerDispositivos() {
  const respuesta = await fetch(RUTA_DISPOSITIVOS);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar el catálogo (error ${respuesta.status}).`);
  }
  return respuesta.json();
}
