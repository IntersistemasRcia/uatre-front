import React, { useEffect, useMemo, useRef, useState } from "react";
import { Accordion, Modal } from "react-bootstrap";
import { Tab, Tabs } from "@mui/material";
import Grid from "components/ui/Grid/Grid";
import Button from "components/ui/Button/Button";
import InputMaterial, { DNIMask, EnteroMask } from "components/ui/Input/InputMaterial";
import Formato from "components/helpers/Formato";
import SearchSelectMaterial, { mapOptions } from "components/ui/Select/SearchSelectMaterial";
import DateTimePicker from "components/ui/DateTimePicker/DateTimePicker";
import Table from "components/ui/Table/Table";
import Documentacion from "components/Documentacion/Documentacion";
import modalCss from "components/ui/Modal/Modal.module.css";
import css from "../app/Denuncias/DenunciasForm.module.css";
import { destinosEstado, ESTADOS_RELEVAMIENTO } from "./relevamientoGestionAdapter";
import RelevamientoGeoubicacion from "./RelevamientoGeoubicacion";

const estados = Object.values(ESTADOS_RELEVAMIENTO);
const tiposDocumentacionRelevamiento = [
  "Credencial",
  "Documento de Identidad",
  "Actas",
  "Documentos",
  "Recibos",
  "Fotos",
  "Otros",
];
const fecha = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value)) : "";
const fechaInput = (value) => value ? String(value).slice(0, 10) : "";
const documentoBase64 = (item) => String(item?.archivo ?? item?.archivoBase64 ?? item?.base64 ?? "").split(",").at(-1);
const documentoIdPersistido = (value) => {
  const match = String(value || "").match(/(?:^|-)documento-(\d+)$/i);
  return match ? Number(match[1]) : null;
};
const formatoArchivo = (nombreArchivo) => {
  const nombre = String(nombreArchivo || "").trim();
  const extension = nombre.split(".").pop()?.toLowerCase();
  if (!extension || extension === nombre.toLowerCase()) return "";
  if (extension === "pdf") return "PDF";
  if (["doc", "docx"].includes(extension)) return "Word";
  if (["xls", "xlsx"].includes(extension)) return "Excel";
  return extension.toUpperCase();
};
const tipoDocumentacionConFormato = (tipo, documento) => {
  if (String(tipo || "").toLowerCase() !== "otros") return tipo;
  const formato = formatoArchivo(documento?.nombreArchivo);
  return formato ? `${tipo} - ${formato}` : tipo;
};
const documentosDelRelevamiento = (record) => (record.novedades || []).filter((item) => item.tipo === "Documento").map((item) => ({ id: item.id, documentoId: documentoIdPersistido(item.id), nombreArchivo: item.nombreArchivo, observaciones: item.detalle, refTipoDocumentacion: item.tipoDocumental }));
const opcion = (value, label, aliases = []) => ({ value, label, aliases });
const sinDato = (value) => value == null || value === "" || value === 0;
const esSi = (value) => value === true || String(value || "").toUpperCase() === "S";
const mensajeError = (error, fallback) => String(error?.message || fallback);
const esErrorReintentable = (error) => {
  const codigo = Number(error?.code);
  const mensaje = mensajeError(error, "").toLowerCase();
  return !codigo || codigo >= 500 || mensaje.includes("actualizado por otro usuario");
};
const opcionesEstaticas = {
  tipoRelevamiento: [
    opcion("P", "Programado"),
    opcion("N", "No programado (denuncia)"),
    opcion("S", "Seguimiento (Nro. de referencia)"),
    opcion("R", "Rastrillaje"),
  ],
  organismo: [opcion("RENATRE", "RENATRE"), opcion("MINISTERIO", "Ministerio")],
  cargo: [
    opcion("G", "Secretaría General"), opcion("A", "Secretaría Adjunta"), opcion("C", "Secretaría de Actas"),
    opcion("S", "Secretaría de Acción Social"), opcion("T", "Tesorero"), opcion("D", "Delegado"),
    opcion("B", "Colaborador gremial"), opcion("SD", "Subdelegado"),
  ],
  siNo: [opcion("S", "Sí"), opcion("N", "No")],
  sexo: [opcion("F", "Femenino"), opcion("M", "Masculino"), opcion("O", "Otro")],
  estadoVivienda: [opcion("B", "Buena"), opcion("M", "Mala"), opcion("A", "Aceptable")],
  banosUbicacion: [opcion("D", "Dentro"), opcion("A", "Afuera")],
  tipoElectricidad: [opcion("S", "Genset", ["Genset"]), opcion("N", "De red", ["De red"])],
  tipoGas: [opcion("Garrafa", "Garrafa"), opcion("De red", "De red")],
  categorizacion: [opcion("B", "Bien categorizado"), opcion("M", "Mal categorizado")],
  acuerdo: [opcion(true, "Sí"), opcion(false, "No")],
};
const opcionSeleccionada = (opciones, value) => {
  if (value == null || value === "") return null;
  return opciones.find((item) => String(item.value) === String(value) || item.aliases?.some((alias) => String(alias) === String(value))) || null;
};

const datosActa = [
  { key: "fecha", label: "Fecha", type: "date" },
  { key: "seccionalId", label: "Seccional", catalogo: "seccionales" },
  { key: "actaRenatre", label: "RENATRE N° Acta", mask: EnteroMask, formatear: Formato.Numero },
  { key: "tipo", label: "Tipo", catalogo: "tipoRelevamiento" },
];

const responsableOrganismo = [
  { key: "organismoRenatre", label: "De", catalogo: "organismo" },
  { key: "inspectorRenatre", label: "Apellido y nombre del responsable" },
  { key: "inspectorRenatreDNI", label: "DNI", mask: DNIMask, formatear: Formato.DNI },
];

const responsableUatre = [
  { key: "inspector", label: "Apellido y nombre del responsable" },
  { key: "inspectorDNI", label: "DNI", mask: DNIMask, formatear: Formato.DNI },
  { key: "inspectorCargo", label: "Cargo", catalogo: "cargo" },
];

const actasRelacionadas = [
  { key: "actaMinisterio", label: "Ministerio N° Acta", mask: EnteroMask, formatear: Formato.Numero },
  { key: "actaReservin", label: "RESERVIN N° Acta", mask: EnteroMask, formatear: Formato.Numero },
];

const empleador = [
  { key: "razonSocial", label: "Nombre o Razón Social" },
  { key: "cuit", label: "CUIT", type: "number" },
];

const datosEstablecimiento = [
  { key: "sector", label: "Sector" },
  { key: "actividad", label: "Actividad" },
  { key: "lugar", label: "Geoubicación", tipo: "geoubicacion" },
];

const personaRecibe = [
  { key: "responsable", label: "Quién recibe en el establecimiento" },
  { key: "responsableDNI", label: "DNI", type: "number" },
  { key: "contactoCelular", label: "Celular", type: "number" },
  { key: "contactoEmail", label: "Mail" },
];

const infraestructuraEstablecimiento = [
  { key: "botiquin", label: "Botiquín", catalogo: "siNo" },
  { key: "banos", label: "Baños", catalogo: "siNo" },
  { key: "banosUbicacion", label: "Ubicación de baños", catalogo: "banosUbicacion", dependeDe: "banos" },
  { key: "accesibilidad", label: "Accesibilidad", catalogo: "siNo" },
  { key: "serviciosElectricidad", label: "Electricidad", catalogo: "siNo" },
  { key: "serviciosElectricidadTipo", label: "Tipo de electricidad", catalogo: "tipoElectricidad", dependeDe: "serviciosElectricidad" },
  { key: "serviciosGas", label: "Gas", catalogo: "siNo" },
  { key: "serviciosGasTipo", label: "Tipo de gas", catalogo: "tipoGas", dependeDe: "serviciosGas" },
  { key: "serviciosAguaPotable", label: "Agua potable", catalogo: "siNo" },
  { key: "serviciosInternet", label: "Internet", catalogo: "siNo" },
];

const trabajadorPersonal = [
  { key: "consentimientoTrabajador", label: "Consentimiento", catalogo: "siNo" }, { key: "dni", label: "DNI", type: "number" }, { key: "apellido", label: "Apellido" }, { key: "nombre", label: "Nombre" },
  { key: "inicioActividad", label: "Inicio de actividad", type: "date" }, { key: "actividad", label: "Actividad" }, { key: "tareaQueRealizaTrab", label: "Tarea que realiza" }, { key: "afiliado", label: "Afiliado", catalogo: "siNo" }, { key: "reciboDeSueldo", label: "Recibo de sueldo", catalogo: "siNo" }, { key: "sexo", label: "Sexo", catalogo: "sexo" },
];

const trabajadorContacto = [
  { key: "contacto", label: "Contacto" }, { key: "celular", label: "Celular", type: "number" }, { key: "email", label: "Mail" },
];

const trabajadorLaboral = [
  { key: "registrado", label: "Registrado", catalogo: "siNo" }, { key: "bienCategorizado", label: "Categorizado", catalogo: "categorizacion" }, { key: "equipamiento", label: "Equipamiento", catalogo: "siNo" }, { key: "indumentariaTrab", label: "Indumentaria", catalogo: "siNo" }, { key: "jornadaHorarioId", label: "Jornada/Horario", catalogo: "jornadas", descripcionCampo: "jornadaHorarioDescripcion" }, { key: "observacionesCondicionLaboral", label: "Observaciones", multiline: true },
];

const trabajadorHabitacional = [
  { key: "viveEnElLugar", label: "¿Vive en el lugar?", catalogo: "siNo" }, { key: "estadoVivienda", label: "Estado de vivienda", catalogo: "estadoVivienda", dependeDe: "viveEnElLugar" }, { key: "cantidadIntegrantesVivienda", label: "Cantidad de integrantes", type: "number", dependeDe: "viveEnElLugar" },
];

const trabajadorServicios = [
  { key: "serviciosElectricidad", label: "Electricidad", catalogo: "siNo" }, { key: "serviciosGas", label: "Gas", catalogo: "siNo" }, { key: "serviciosAguaPotable", label: "Agua potable", catalogo: "siNo" }, { key: "serviciosInternet", label: "Internet", catalogo: "siNo" },
];

const trabajadorPareja = [
  { key: "pareja", label: "Pareja", catalogo: "siNo" }, { key: "parejaTrabaja", label: "Trabaja", catalogo: "siNo", dependeDe: "pareja" }, { key: "parejaTrabajaIr", label: "Permite identificar y condición laboral", catalogo: "siNo", dependeDe: "parejaTrabaja" },
];

const trabajadorHijos = [
  { key: "hijos", label: "Hijos", catalogo: "siNo" }, { key: "hijosMayores", label: "Mayores", catalogo: "siNo", dependeDe: "hijos" }, { key: "hijosMayoresTrabajan", label: "Trabaja", catalogo: "siNo", dependeDe: "hijosMayores" }, { key: "hijosMayoresTrabajanIr", label: "Permite identificar y condición laboral", catalogo: "siNo", dependeDe: "hijosMayoresTrabajan" },
];

const trabajadorObservacionesHabitacionales = [
  { key: "observacionesCondicionHabitacional", label: "Observaciones", multiline: true },
];

const RelevamientoForm = ({ record, mode, canModify, loading, externalError, onClose, onOperation, onSave, onSaveData, onSaveWorker, onDownloadDocument, catalogos }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [edit, setEdit] = useState(record);
  const [trabajadorEdit, setTrabajadorEdit] = useState({});
  const [estadoDestino, setEstadoDestino] = useState(null);
  const [acuerdoSeleccionado, setAcuerdoSeleccionado] = useState(null);
  const [fechaAudiencia, setFechaAudiencia] = useState(null);
  const [audienciaRealizadaSeleccionada, setAudienciaRealizadaSeleccionada] = useState(null);
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documentosPendientes, setDocumentosPendientes] = useState([]);
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState({ label: "Todos los estados" });
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const recordIdRef = useRef(record.id);

  const editable = mode === "M" && canModify && record.estado === ESTADOS_RELEVAMIENTO.REGISTRADA;
  const puedeGestionarEstados = mode === "M" && canModify && record.estado !== ESTADOS_RELEVAMIENTO.FINALIZADA;
  const puedeGestionarAnexos = mode === "M" && canModify;
  const puedeRegistrarAcuerdo = [ESTADOS_RELEVAMIENTO.COMPLETADA, ESTADOS_RELEVAMIENTO.INCOMPLETA].includes(record.estado);
  const destinos = useMemo(() => destinosEstado(record.estado, record.huboAcuerdo), [record.estado, record.huboAcuerdo]);
  const puedeCambiarEstado = puedeGestionarEstados && destinos.length > 0;
  const opcionesDestino = useMemo(() => mapOptions({ data: destinos, map: (item) => ({ value: item, label: item }) }), [destinos]);
  const estadoActualOpcion = useMemo(() => opcion(record.estado || ESTADOS_RELEVAMIENTO.REGISTRADA, record.estado || ESTADOS_RELEVAMIENTO.REGISTRADA), [record.estado]);
  const opcionesEstado = useMemo(() => [estadoActualOpcion, ...opcionesDestino], [estadoActualOpcion, opcionesDestino]);
  const estadoSeleccionado = estadoDestino || estadoActualOpcion;
  const opcionesFiltro = useMemo(() => mapOptions({ data: estados, map: (item) => ({ value: item, label: item }), start: [{ label: "Todos los estados" }] }), []);
  const documentacion = useMemo(
    () => [...documentosDelRelevamiento(record), ...documentosPendientes],
    [record, documentosPendientes]
  );

  useEffect(() => {
    setEdit(record);
  }, [record]);

  useEffect(() => {
    if (recordIdRef.current === record.id) return;
    recordIdRef.current = record.id;
    setSelectedTab(0);
    setEdit(record);
    setTrabajadorEdit({});
    setEstadoDestino(null);
    setObservacion("");
    setError("");
    setSuccess("");
    setNovedadSeleccionada(null);
    setDocumentosPendientes([]);
  }, [record]);

  useEffect(() => {
    setEstadoDestino(null);
  }, [record.estado]);

  useEffect(() => {
    setAcuerdoSeleccionado(record.huboAcuerdo == null ? null : opcionesEstaticas.acuerdo.find((opcionAcuerdo) => opcionAcuerdo.value === record.huboAcuerdo) || null);
  }, [record.estado, record.huboAcuerdo]);

  useEffect(() => {
    setFechaAudiencia(fechaInput(record.fechaAudiencia) || null);
    setAudienciaRealizadaSeleccionada(record.audienciaSeRealizo == null ? null : opcionesEstaticas.acuerdo.find((opcionAudiencia) => opcionAudiencia.value === record.audienciaSeRealizo) || null);
  }, [record.estado, record.fechaAudiencia, record.audienciaSeRealizo]);

  const ejecutar = async (accion, mensaje) => {
    try {
      const actualizado = await accion();
      if (actualizado) onSave(actualizado);
      setError("");
      setSuccess(mensaje);
      return actualizado;
    } catch (exception) {
      setSuccess("");
      setError(exception?.message || "No se pudo completar la operación.");
      return null;
    }
  };
  const actualizar = (grupo, campo, valor) => setEdit((actual) => grupo ? { ...actual, [grupo]: { ...actual[grupo], [campo]: valor } } : { ...actual, [campo]: valor });
  const actualizarTrabajador = (id, campo, valor) => setTrabajadorEdit((actual) => ({ ...actual, [id]: { ...(actual[id] || record.trabajadores.find((item) => item.id === id)), [campo]: valor } }));
  const guardarTrabajador = async (trabajador) => {
    const actualizado = await ejecutar(() => onSaveWorker(trabajadorEdit[trabajador.id] || trabajador), "El trabajador se actualizó correctamente.");
    if (actualizado) setTrabajadorEdit((actual) => ({ ...actual, [trabajador.id]: undefined }));
  };
  const guardarDatos = async () => {
    await ejecutar(() => onSaveData(edit), "Los datos del relevamiento se actualizaron correctamente.");
  };
  const cambiarEstado = async () => {
    if (!estadoDestino?.value) {
      setError("Seleccioná el nuevo estado antes de confirmarlo.");
      return;
    }
    const actualizado = await ejecutar(() => onOperation("TRANSICIONAR_ESTADO", { estadoDestino: estadoDestino.value }), `El relevamiento pasó a ${estadoDestino.value}.`);
    if (actualizado) setEstadoDestino(null);
  };
  const seleccionarEstado = (seleccion) => setEstadoDestino(
    seleccion?.value && seleccion.value !== estadoActualOpcion.value ? seleccion : null
  );
  const confirmarAcuerdo = async () => {
    if (typeof acuerdoSeleccionado?.value !== "boolean") {
      setError("Indicá si hubo acuerdo antes de continuar.");
      return;
    }
    await ejecutar(() => onOperation("REGISTRAR_ACUERDO", { huboAcuerdo: acuerdoSeleccionado.value }), `Se registró que ${acuerdoSeleccionado.value ? "hubo" : "no hubo"} acuerdo.`);
  };
  const guardarDatosAudiencia = async () => {
    if (!fechaAudiencia) {
      setError("Indicá la fecha de audiencia antes de guardar.");
      return;
    }
    if (typeof audienciaRealizadaSeleccionada?.value !== "boolean") {
      setError("Indicá si la audiencia se realizó antes de guardar.");
      return;
    }
    await ejecutar(
      () => onOperation("REGISTRAR_DATOS_AUDIENCIA", { fechaAudiencia, audienciaSeRealizo: audienciaRealizadaSeleccionada.value }),
      "Los datos de la audiencia se registraron correctamente."
    );
  };
  const agregarObservacion = () => ejecutar(() => onOperation("AGREGAR_OBSERVACION", { observaciones: [observacion.trim()] }), "La observación se registró correctamente.").then((actualizado) => { if (actualizado) setObservacion(""); });
  const cambiarDocumentacion = ({ index, item }) => {
    if (index != null) {
      setError("La documentación de Relevamientos es trazable y no puede modificarse ni eliminarse.");
      return;
    }
    const archivo = documentoBase64(item);
    if (!archivo || !item?.nombreArchivo) {
      setError("Debe seleccionar un archivo válido.");
      return;
    }
    setDocumentosPendientes((actual) => [...actual, { ...item, archivo, id: `pendiente-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
    setError("");
    setSuccess("El documento quedó pendiente. Confirmá la documentación para registrarlo.");
  };
  const confirmarDocumentacion = async () => {
    if (!documentosPendientes.length) {
      setError("Agregá al menos un documento antes de confirmar.");
      return;
    }

    let gestionActual = record;
    let documentosConfirmados = 0;
    const errores = [];
    setError("");
    setSuccess("");
    for (const documento of documentosPendientes) {
      const refTipoDocumentacionId = Number(documento.refTipoDocumentacionId);
      if (!Number.isInteger(refTipoDocumentacionId) || refTipoDocumentacionId <= 0) {
        errores.push(`${documento.nombreArchivo || "El documento"}: seleccioná un tipo de documentación válido.`);
        setDocumentosPendientes((actual) => actual.filter((item) => item.id !== documento.id));
        continue;
      }
      try {
        const actualizado = await onOperation("ADJUNTAR_DOCUMENTO", {
          documento: {
            refTipoDocumentacionId,
            archivo: documentoBase64(documento),
            nombreArchivo: documento.nombreArchivo,
            observaciones: documento.observaciones,
          },
        }, gestionActual.version);
        gestionActual = actualizado;
        documentosConfirmados += 1;
        setDocumentosPendientes((actual) => actual.filter((item) => item.id !== documento.id));
        onSave(actualizado);
      } catch (exception) {
        const mensaje = mensajeError(exception, "No se pudo registrar la documentación.");
        errores.push(`${documento.nombreArchivo || "El documento"}: ${mensaje}`);
        if (esErrorReintentable(exception)) break;
        setDocumentosPendientes((actual) => actual.filter((item) => item.id !== documento.id));
      }
    }
    if (documentosConfirmados) {
      setSuccess(`${documentosConfirmados === 1 ? "El documento se registró" : `Se registraron ${documentosConfirmados} documentos`} correctamente.`);
    }
    if (errores.length) setError(errores.join(" "));
  };

  const opcionesPorCatalogo = useMemo(() => ({
    ...opcionesEstaticas,
    seccionales: mapOptions({ data: catalogos?.seccionales || [], map: (item) => opcion(item.id, [item.codigo, item.descripcion].filter(Boolean).join(" - ") || `Seccional ${item.id}`) }),
    localidades: mapOptions({ data: catalogos?.localidades || [], map: (item) => opcion(item.id, [item.codPostal, item.nombre].filter(Boolean).join(" - ") || `Localidad ${item.id}`) }),
    jornadas: mapOptions({ data: catalogos?.jornadas || [], map: (item) => opcion(item.id, item.descripcion || `Jornada ${item.id}`) }),
  }), [catalogos]);
  const campo = (definicion, value, onChange, readOnly = !editable) => {
    if (definicion.tipo === "geoubicacion") return <RelevamientoGeoubicacion key={definicion.key} value={value} onChange={(valor) => onChange(definicion.key, valor)} readOnly={readOnly} disabled={loading} />;
    if (!definicion.catalogo) {
      const valorVisible = readOnly && sinDato(value)
        ? "Sin dato"
        : definicion.type === "date"
          ? fechaInput(value)
          : readOnly && definicion.formatear
            ? definicion.formatear(value)
            : value ?? "";
      return <InputMaterial key={definicion.key} type={definicion.type || "text"} mask={readOnly ? null : definicion.mask} label={definicion.label} multiline={definicion.multiline} rows={definicion.multiline ? 3 : undefined} value={valorVisible} readOnly={readOnly} onChange={(valor) => onChange(definicion.key, valor)} />;
    }
    const opciones = opcionesPorCatalogo[definicion.catalogo] || [];
    const selected = opcionSeleccionada(opciones, value);
    if (readOnly && (sinDato(value) || !selected)) return <InputMaterial key={definicion.key} label={definicion.label} value="Sin dato" readOnly />;
    return <SearchSelectMaterial key={definicion.key} label={definicion.label} value={selected} options={opciones} readOnly={readOnly} disabled={loading || (catalogos?.loading && !selected)} freeSolo={false} onChange={(seleccion) => { onChange(definicion.key, seleccion?.value ?? ""); if (definicion.descripcionCampo) onChange(definicion.descripcionCampo, seleccion?.label || ""); }} />;
  };
  const bloque = (titulo, campos, data, onChange) => {
    const visibles = campos.filter((definicion) => !definicion.dependeDe || esSi(data?.[definicion.dependeDe]));
    return <Grid className={css.group} col gap="10px">{titulo && <Grid className={css.titulo}>{titulo}</Grid>}<Grid grid="auto / 1fr 1fr" gap="10px">{visibles.map((definicion) => campo(definicion, data?.[definicion.key], onChange))}</Grid></Grid>;
  };
  const seccion = (eventKey, titulo, contenido) => <Accordion><Accordion.Item eventKey={eventKey}><Accordion.Header>{titulo}</Accordion.Header><Accordion.Body><Grid col gap="10px">{contenido}</Grid></Accordion.Body></Accordion.Item></Accordion>;

  const novedades = useMemo(() => (record.novedades || []).filter((item) => {
    if (filtroEstado?.value && item.estado !== filtroEstado.value) return false;
    const value = item.fecha ? new Date(item.fecha) : null;
    if (fechaDesde && (!value || value < new Date(fechaDesde))) return false;
    if (fechaHasta && (!value || value > new Date(`${fechaHasta}T23:59:59`))) return false;
    return true;
  }).map((item) => ({ ...item, rowKey: item.id, estado: item.estado || record.estado, observaciones: item.detalle || "", createdDate: item.fecha, createdBy: item.usuario || "" })), [record.novedades, record.estado, filtroEstado, fechaDesde, fechaHasta]);

  const formularioPanel = <Grid full col gap="10px">
    {seccion("acta", "1. Identificación de Acta · Datos del Acta", bloque(null, datosActa, edit, (campoEditado, valor) => actualizar(null, campoEditado, valor)))}
    {seccion("responsables", "2. Identificación de Responsable de Relevamiento", <>
      {bloque("Responsable del Organismo", responsableOrganismo, edit, (campoEditado, valor) => actualizar(null, campoEditado, valor))}
      {bloque("Responsable de UATRE", responsableUatre, edit, (campoEditado, valor) => actualizar(null, campoEditado, valor))}
      {bloque("Realiza el Relevamiento Con", actasRelacionadas, edit, (campoEditado, valor) => actualizar(null, campoEditado, valor))}
    </>)}
    {seccion("establecimiento", "3. Identificación de Establecimiento", <>
      <Grid className={css.titulo}>Datos del Establecimiento</Grid>
      <Grid grid="auto / 1fr 1fr" gap="10px">
        {empleador.map((definicion) => campo(definicion, edit.empleador?.[definicion.key], (campoEditado, valor) => actualizar("empleador", campoEditado, valor)))}
        {datosEstablecimiento.map((definicion) => campo(definicion, edit.establecimiento?.[definicion.key], (campoEditado, valor) => actualizar("establecimiento", campoEditado, valor)))}
      </Grid>
      {bloque("Persona que Recibe en el Establecimiento", personaRecibe, edit.establecimiento, (campoEditado, valor) => actualizar("establecimiento", campoEditado, valor))}
    </>)}
    {seccion("infraestructura", "4. Condición Laboral Establecimiento · Infraestructura y Servicios", bloque(null, infraestructuraEstablecimiento, edit.establecimiento, (campoEditado, valor) => actualizar("establecimiento", campoEditado, valor)))}
    {seccion("trabajadores", "5. Identificación del Trabajador", <>
      {!record.trabajadores?.length && <div>No hay trabajadores asociados al relevamiento.</div>}
      {(record.trabajadores || []).map((trabajador) => {
        const actual = trabajadorEdit[trabajador.id] || trabajador;
        const cambiar = (campoEditado, valor) => actualizarTrabajador(trabajador.id, campoEditado, valor);
        const identificacion = [actual.apellido, actual.nombre].filter(Boolean).join(", ") || "Trabajador sin identificar";
        const cuil = sinDato(actual.cuil) ? "" : Formato.Cuit(actual.cuil);
        const tituloTrabajador = cuil ? `${identificacion} · ${cuil}` : identificacion;
        return <Accordion key={trabajador.id}><Accordion.Item eventKey={String(trabajador.id)}><Accordion.Header>{tituloTrabajador}</Accordion.Header><Accordion.Body><Grid col gap="10px">
          {bloque("Datos Personales", trabajadorPersonal, actual, cambiar)}
          {bloque("Datos de Contacto", trabajadorContacto, actual, cambiar)}
          {bloque("6. Condición Laboral del Trabajador · Situación Laboral", trabajadorLaboral, actual, cambiar)}
          {bloque("7. Condición Habitacional · Situación Habitacional", trabajadorHabitacional, actual, cambiar)}
          {esSi(actual.viveEnElLugar) && bloque("Servicios de la Vivienda", trabajadorServicios, actual, cambiar)}
          {esSi(actual.viveEnElLugar) && bloque("Pareja", trabajadorPareja, actual, cambiar)}
          {esSi(actual.viveEnElLugar) && bloque("Hijos", trabajadorHijos, actual, cambiar)}
          {bloque("Observaciones", trabajadorObservacionesHabitacionales, actual, cambiar)}
          {editable && <Button className="botonAmarillo" marginTop={3} disabled={loading} onClick={() => guardarTrabajador(trabajador)}>GUARDAR TRABAJADOR</Button>}
        </Grid></Accordion.Body></Accordion.Item></Accordion>;
      })}
    </>)}
    {puedeGestionarAnexos && <Grid className={css.group} col gap="10px">
      <Grid className={css.titulo}>Cambio de estado</Grid>
      <SearchSelectMaterial label="Estado" value={estadoSeleccionado} options={opcionesEstado} onChange={seleccionarEstado} readOnly={loading || !puedeGestionarEstados || (record.estado === ESTADOS_RELEVAMIENTO.COMPLETADA && record.huboAcuerdo == null)} freeSolo={false} autocompleteProps={{ isOptionEqualToValue: (option, value) => String(option?.value) === String(value?.value) }} />
      {puedeRegistrarAcuerdo && <>
        <SearchSelectMaterial label="¿Hubo acuerdo?" value={acuerdoSeleccionado} options={opcionesEstaticas.acuerdo} onChange={setAcuerdoSeleccionado} readOnly={loading || !puedeGestionarEstados} freeSolo={false} autocompleteProps={{ isOptionEqualToValue: (option, value) => option?.value === value?.value }} />
        <Button className="botonAmarillo" width={50} disabled={loading || typeof acuerdoSeleccionado?.value !== "boolean" || acuerdoSeleccionado?.value === record.huboAcuerdo} onClick={confirmarAcuerdo}>CONFIRMAR ACUERDO</Button>
      </>}
      {record.estado === ESTADOS_RELEVAMIENTO.AUDIENCIA && <>
        <Grid className={css.titulo}>Seguimiento de audiencia</Grid>
        <Grid grid="auto / 1fr 1fr" gap="10px">
          <DateTimePicker type="date" label="Fecha de audiencia" value={fechaAudiencia} onChange={setFechaAudiencia} format="YYYY-MM-DD" readOnly={loading} />
          <SearchSelectMaterial label="¿La audiencia se realizó?" value={audienciaRealizadaSeleccionada} options={opcionesEstaticas.acuerdo} onChange={setAudienciaRealizadaSeleccionada} readOnly={loading} freeSolo={false} autocompleteProps={{ isOptionEqualToValue: (option, value) => option?.value === value?.value }} />
        </Grid>
        <Button className="botonAmarillo" width={50} disabled={loading || !fechaAudiencia || typeof audienciaRealizadaSeleccionada?.value !== "boolean"} onClick={guardarDatosAudiencia}>GUARDAR AUDIENCIA</Button>
      </>}
      <div>{estadoDestino?.label ? `Cambio pendiente: ${estadoDestino.label}. Confirmalo con el botón correspondiente.` : record.estado === ESTADOS_RELEVAMIENTO.COMPLETADA && record.huboAcuerdo == null ? "Informá si hubo acuerdo para habilitar los estados de destino." : puedeGestionarEstados && destinos.length ? "Seleccioná un nuevo estado para confirmarlo." : "No hay transiciones disponibles para el estado actual."}</div>
    </Grid>}
    {puedeGestionarAnexos && record.estado !== ESTADOS_RELEVAMIENTO.FINALIZADA && <Grid className={css.group} col gap="10px"><Grid className={css.titulo}>Observaciones</Grid><InputMaterial label="Observación opcional" multiline rows={3} value={observacion} onChange={setObservacion} /><Button className="botonAmarillo" width={50} disabled={loading || !observacion.trim()} onClick={agregarObservacion}>AGREGA OBSERVACIÓN</Button></Grid>}
  </Grid>;

  const documentacionPanel = <Grid full col gap="10px"><Documentacion data={documentacion} tipoDocumentacion={tiposDocumentacionRelevamiento} showAvailableDocumentTypes disabled={!puedeGestionarAnexos || loading} allowUpdate={false} allowDelete={false} onChange={cambiarDocumentacion} onDownload={onDownloadDocument} disableDownload={loading} formatDocumentType={tipoDocumentacionConFormato} />{puedeGestionarAnexos && <Button className="botonAmarillo" width={50} disabled={loading || !documentosPendientes.length} onClick={confirmarDocumentacion}>CONFIRMA DOCUMENTACIÓN</Button>}</Grid>;
  const novedadesPanel = <Grid full col gap="10px">
    <Grid grid="auto / 1fr 180px 180px 150px" gap="inherit"><SearchSelectMaterial label="Estado de Relevamiento" value={filtroEstado} options={opcionesFiltro} onChange={setFiltroEstado} inputReadOnly /><DateTimePicker type="date" label="Fecha Desde" value={fechaDesde} onChange={setFechaDesde} format="YYYY-MM-DD" /><DateTimePicker type="date" label="Fecha Hasta" value={fechaHasta} onChange={setFechaHasta} format="YYYY-MM-DD" /><Button className="botonAzul" disabled={!filtroEstado?.value && !fechaDesde && !fechaHasta} onClick={() => { setFiltroEstado({ label: "Todos los estados" }); setFechaDesde(null); setFechaHasta(null); }}>Limpia filtros</Button></Grid>
    <Table keyField="rowKey" data={novedades} mostrarBuscar={false} pagination={{ size: 10 }} noDataIndication="No existen novedades para mostrar" selection={{ mode: "radio", clickToSelect: true, hideSelectColumn: true, selected: novedadSeleccionada ? [novedadSeleccionada.rowKey] : [], onSelect: setNovedadSeleccionada }} columns={[{ dataField: "createdDate", text: "Fecha", formatter: fecha }, { dataField: "estado", text: "Estado", sort: true }, { dataField: "tipo", text: "Tipo" }, { dataField: "observaciones", text: "Observaciones" }, { dataField: "createdBy", text: "Usuario" }]} />
  </Grid>;
  const estadoActual = record.estado || ESTADOS_RELEVAMIENTO.REGISTRADA;
  const encabezado = `${mode === "M" ? "Edita" : "Consulta"} Relevamiento Nro: ${record.actaMinisterio || record.id} · ${estadoActual}`;

  return <Modal size="xl" centered show><Modal.Header className={modalCss.modalCabecera}>{encabezado}</Modal.Header><Modal.Body>{(externalError || error) && <div className="alert alert-danger">{externalError || error}</div>}{success && <div className="alert alert-success">{success}</div>}<Tabs value={selectedTab} onChange={(_, value) => setSelectedTab(value)}><Tab label="Datos" /><Tab label="Documentación" /><Tab label="Novedades" /></Tabs><div className={css.tabsContent}>{selectedTab === 0 ? formularioPanel : selectedTab === 1 ? documentacionPanel : novedadesPanel}</div>{selectedTab === 2 && novedadSeleccionada && <div className={css.novedadDetalle}><Grid col gap="6px"><Grid className={css.novedadTitulo}>Detalle de la Novedad</Grid><Grid grid="auto / 7fr 1fr" gap="20px" className={css.novedadGrid}><Grid col gap="4px"><div className={css.fieldLabel}>Observaciones:</div><div className={css.observacionesContenido}>{novedadSeleccionada.observaciones || <i>Sin observaciones</i>}</div></Grid><Grid col gap="4px"><div className={css.fieldLabel}>Documento:</div><div className={css.documentoContenido}>{novedadSeleccionada.nombreArchivo || <i>Sin documentos</i>}</div></Grid></Grid></Grid></div>}</Modal.Body><Modal.Footer><Grid grid="auto / 1fr 150px 150px 150px" width col gap="20px"><div />{editable && selectedTab === 0 && <Button className="botonAmarillo" disabled={loading} onClick={guardarDatos}>GUARDAR CAMBIOS</Button>}{puedeCambiarEstado && selectedTab === 0 && <Button className="botonAmarillo" disabled={loading || !estadoDestino?.value} onClick={cambiarEstado}>CAMBIAR ESTADO</Button>}<Button className="botonAmarillo" onClick={onClose}>FINALIZA</Button></Grid></Modal.Footer></Modal>;
};

export default RelevamientoForm;
