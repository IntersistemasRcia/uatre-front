export const ESTADOS_RELEVAMIENTO = {
  REGISTRADA: "Registrada",
  COMPLETADA: "Completada",
  AUDIENCIA: "Audiencia",
  INCOMPLETA: "Incompleta",
  FINALIZADA: "Finalizada",
};

export const destinosEstado = (estado, huboAcuerdo = null) => ({
  [ESTADOS_RELEVAMIENTO.REGISTRADA]: [ESTADOS_RELEVAMIENTO.COMPLETADA],
  [ESTADOS_RELEVAMIENTO.COMPLETADA]: huboAcuerdo === true ? [ESTADOS_RELEVAMIENTO.FINALIZADA] : huboAcuerdo === false ? [ESTADOS_RELEVAMIENTO.AUDIENCIA, ESTADOS_RELEVAMIENTO.INCOMPLETA] : [],
  [ESTADOS_RELEVAMIENTO.AUDIENCIA]: [ESTADOS_RELEVAMIENTO.INCOMPLETA, ESTADOS_RELEVAMIENTO.FINALIZADA],
  [ESTADOS_RELEVAMIENTO.INCOMPLETA]: [ESTADOS_RELEVAMIENTO.FINALIZADA],
}[estado] || []);

const primerValorInformado = (...valores) => valores.find((valor) => valor != null && valor !== "") ?? null;
const normalizarSiNo = (valor) => {
  if (valor == null || valor === "") return null;
  if (valor === true || ["S", "SI", "SÍ", "TRUE", "1"].includes(String(valor).trim().toUpperCase())) return "S";
  if (valor === false || ["N", "NO", "FALSE", "0"].includes(String(valor).trim().toUpperCase())) return "N";
  return valor;
};
const normalizarTipoGas = (valor) => {
  if (valor == null || valor === "") return null;
  return ["X", "GARRAFA"].includes(String(valor).trim().toUpperCase()) ? "X" : "R";
};

const adaptarTrabajador = (trabajador) => ({
  ...trabajador,
  observacionesCondicionLaboral: primerValorInformado(
    trabajador?.observacionesCondicionLaboral,
    trabajador?.observacionCondicionLaboral,
  ),
});

export const adaptarGestionRelevamiento = (gestion, trabajadores = null) => {
  const relevamiento = { ...(gestion?.relevamiento || {}) };
  const establecimiento = relevamiento.establecimiento || {};
  if (Array.isArray(trabajadores)) relevamiento.trabajadores = trabajadores;
  const trabajadoresAdaptados = (relevamiento.trabajadores || []).map(adaptarTrabajador);
  const fechaOrden = (item) => {
    const valor = Date.parse(item?.fechaUtc || item?.fecha || "");
    return Number.isFinite(valor) ? valor : Number.NEGATIVE_INFINITY;
  };
  // La API ya entrega una proyección completa y trazable de Novedades. Volver a
  // construir documentos desde seguimientos elimina su estado y genera duplicados.
  const novedades = [...(gestion?.novedades || [])]
    .sort((first, second) => fechaOrden(second) - fechaOrden(first) || String(second.id || "").localeCompare(String(first.id || "")));

  return {
    ...relevamiento,
    inspector: primerValorInformado(relevamiento.inspector, relevamiento.inspectorApellidoUATRE),
    estado: gestion?.estado || ESTADOS_RELEVAMIENTO.REGISTRADA,
    version: gestion?.version || "",
    huboAcuerdo: gestion?.huboAcuerdo ?? null,
    fechaAudiencia: relevamiento.fechaAudiencia ?? null,
    audienciaSeRealizo: relevamiento.audienciaSeRealizo ?? null,
    fechaFinalizacion: gestion?.fechaFinalizacionUtc || null,
    empleador: {
      razonSocial: relevamiento.establecimientoRazonSocial ?? null,
      cuit: relevamiento.establecimientoCUIT == null || relevamiento.establecimientoCUIT === 0 ? null : String(relevamiento.establecimientoCUIT),
    },
    establecimiento: {
      actividad: relevamiento.establecimientoActividad ?? null,
      sector: relevamiento.establecimientoSector ?? null,
      localidadesId: relevamiento.establecimientoLocalidadesId || null,
      lugar: relevamiento.establecimientoLugar ?? null,
      responsable: relevamiento.establecimientoResponsable ?? null,
      responsableDNI: relevamiento.establecimientoResponsableDNI || null,
      contacto: relevamiento.establecimientoContacto ?? null,
      contactoCelular: relevamiento.establecimientoContactoCelular || null,
      contactoEmail: relevamiento.establecimientoContactoEmail ?? null,
      botiquin: relevamiento.establecimientoBotiquin ?? null,
      banos: relevamiento.establecimientoBanos ?? null,
      banosUbicacion: relevamiento.establecimientoBanosUbicacion ?? null,
      accesibilidad: normalizarSiNo(primerValorInformado(
        relevamiento.establecimientoAccesibilidad,
        relevamiento.accesibilidad,
        establecimiento.accesibilidad,
        relevamiento.establecimientoAreaDescansoEquipada,
      )),
      areaDescansoEquipada: relevamiento.establecimientoAreaDescansoEquipada ?? null,
      serviciosElectricidad: relevamiento.establecimientoServiciosElectricidad ?? null,
      serviciosElectricidadTipo: relevamiento.establecimientoServiciosElectricidadTipo ?? null,
      serviciosGas: relevamiento.establecimientoServiciosGas ?? null,
      serviciosGasTipo: normalizarTipoGas(relevamiento.establecimientoServiciosGasTipo),
      serviciosAguaPotable: relevamiento.establecimientoServiciosAguaPotable ?? null,
      serviciosAguaPotableTipo: relevamiento.establecimientoServiciosAguaPotableTipo ?? null,
      serviciosInternet: relevamiento.establecimientoServiciosInternet ?? null,
    },
    trabajadores: trabajadoresAdaptados,
    historial: (gestion?.historial || []).map((item) => ({
      id: item.id,
      fecha: item.fechaUtc,
      usuario: item.usuario || "",
      estadoAnterior: item.estadoAnterior,
      estadoNuevo: item.estadoNuevo,
      detalle: item.motivo || "",
    })),
    novedades: novedades.map((item) => ({ ...item, fecha: item.fechaUtc || item.fecha })),
  };
};

export const crearIdempotencyKey = () => typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const cuitNumerico = (valor) => {
  const normalizado = String(valor || "").replace(/\D/g, "");
  return normalizado ? Number(normalizado) : 0;
};
