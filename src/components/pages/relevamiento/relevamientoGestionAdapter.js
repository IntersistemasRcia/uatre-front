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

const adaptarTrabajador = (trabajador) => ({
  ...trabajador,
  observacionesCondicionLaboral: primerValorInformado(
    trabajador?.observacionesCondicionLaboral,
    trabajador?.observacionCondicionLaboral,
  ),
});

export const adaptarGestionRelevamiento = (gestion, trabajadores = null) => {
  const relevamiento = { ...(gestion?.relevamiento || {}) };
  if (Array.isArray(trabajadores)) relevamiento.trabajadores = trabajadores;
  const trabajadoresAdaptados = (relevamiento.trabajadores || []).map(adaptarTrabajador);
  const seguimientoNovedades = (gestion?.seguimientos || []).flatMap((seguimiento) => [
    ...(seguimiento.observaciones || []).map((observacion) => ({
      id: `legado-observacion-${observacion.id}`,
      tipo: "Observacion",
      detalle: observacion.texto,
      fecha: observacion.creadoUtc,
      usuario: observacion.usuario,
    })),
    ...(seguimiento.documentos || []).map((documento) => ({
      id: `legado-documento-${documento.id}`,
      tipo: "Documento",
      detalle: documento.observaciones,
      nombreArchivo: documento.nombreArchivo,
      tipoDocumental: documento.tipoDocumental,
      fecha: documento.fechaUtc,
      usuario: documento.usuario,
    })),
  ]);
  const novedades = [...(gestion?.novedades || []), ...seguimientoNovedades]
    .reduce((items, item) => (items.some((actual) => actual.id === item.id) ? items : [...items, item]), [])
    .sort((first, second) => Date.parse(second.fechaUtc || second.fecha || 0) - Date.parse(first.fechaUtc || first.fecha || 0));

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
      accesibilidad: relevamiento.establecimientoAccesibilidad ?? null,
      areaDescansoEquipada: relevamiento.establecimientoAreaDescansoEquipada ?? null,
      serviciosElectricidad: relevamiento.establecimientoServiciosElectricidad ?? null,
      serviciosElectricidadTipo: relevamiento.establecimientoServiciosElectricidadTipo ?? null,
      serviciosGas: relevamiento.establecimientoServiciosGas ?? null,
      serviciosGasTipo: relevamiento.establecimientoServiciosGasTipo ?? null,
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
