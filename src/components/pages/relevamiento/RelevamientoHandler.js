import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { handleModuloSeleccionar } from "redux/actions";
import { Tabs, Tab } from "@mui/material";
import useTrabajador from "./datosTrabajador/useTrabajador";
import useTareasUsuario from "components/hooks/useTareasUsuario";
import KeyPress from "components/keyPress/KeyPress";
import useEstablecimiento from "./datosEstablecimiento/useEstablecimiento";
import Grid from "components/ui/Grid/Grid";
import Button from "components/ui/Button/Button";
import useRelevamiento, { onLoadSelectKeepOrFirst } from "./useRelevamiento";
import InputMaterial from "components/ui/Input/InputMaterial";
import SearchSelectMaterial, {
  includeSearch,
  mapOptions,
} from "components/ui/Select/SearchSelectMaterial";
import useQueryState from "components/hooks/useQueryState";
import useQueryQueue from "components/hooks/useQueryQueue";
import Action from "components/helpers/Action";
import PDFViewer from "./PDFViewer";
import RelevamientoForm from "./RelevamientoForm";
import {
  adaptarGestionRelevamiento,
  crearIdempotencyKey,
  cuitNumerico,
  ESTADOS_RELEVAMIENTO,
} from "./relevamientoGestionAdapter";

const camposRelevamientoEditables = [
  "actaNro", "fecha", "tipo", "localidadesId", "lugar", "seccionalId", "inspector", "inspectorDNI", "inspectorCargo",
  "inspectorRenatre", "inspectorRenatreDNI", "organismoRenatre", "actaMinisterio", "actaRenatre", "actaReservin",
];
const camposTrabajadorEditables = [
  "cuil", "dni", "apellido", "nombre", "inicioActividad", "actividad", "sexo", "contacto", "celular", "email",
  "registrado", "equipamiento", "bienCategorizado", "jornadaHorarioId", "observacionesCondicionLaboral", "estadoVivienda",
  "viveEnElLugar", "cantidadIntegrantesVivienda", "areaDescansoEquipada", "serviciosElectricidad", "serviciosGas",
  "serviciosAguaPotable", "serviciosInternet", "hijos", "pareja", "parejaTrabaja", "parejaTrabajaIr", "hijosMayores",
  "hijosMayoresTrabajan", "hijosMayoresTrabajanIr", "hijosMenoresEscolarizados", "jornadaHorarioDescripcion",
  "observacionesCondicionHabitacional", "afiliado", "reciboDeSueldo", "indumentariaTrab", "tareaQueRealizaTrab", "consentimientoTrabajador",
];
const seleccionarCampos = (origen, campos) => Object.fromEntries(campos.filter((campo) => Object.prototype.hasOwnProperty.call(origen || {}, campo)).map((campo) => [campo, origen[campo]]));
const entero = (valor) => Number(String(valor ?? "").replace(/\D/g, "")) || 0;
const camposTrabajadorNumericos = new Set(["cuil", "dni", "celular", "jornadaHorarioId", "cantidadIntegrantesVivienda"]);
const normalizarTrabajador = (trabajador) => Object.fromEntries(
  Object.entries(seleccionarCampos(trabajador, camposTrabajadorEditables)).map(([campo, valor]) => [
    campo,
    camposTrabajadorNumericos.has(campo) ? entero(valor) : campo === "inicioActividad" ? valor || null : valor,
  ])
);
const datosCatalogo = (respuesta) => Array.isArray(respuesta) ? respuesta : Array.isArray(respuesta?.data) ? respuesta.data : [];

const delegacionSelectDef = { label: "Todas" };
const delegacionesSelectOptions = ({ data = [], ...x }) =>
  mapOptions({
    data,
    map: (r) => ({
      value: r.id,
      label: [r.codigoDelegacion, r.nombre].join(" - "),
      record: r,
    }),
    start: data.length === 1 ? [] : [delegacionSelectDef],
    ...x,
  });

const seccionalSelectDef = { label: "Todas" };
const seccionalesSelectOptions = ({ data = [], ...x }) =>
  mapOptions({
    data,
    map: (r) => ({
      value: r.id,
      label: [r.codigo, r.descripcion].join(" - "),
      record: r,
    }),
    start: data.length === 1 ? [] : [seccionalSelectDef],
    ...x,
  });

const detalleToPdfRows = (relevamiento = {}, trabajadores = []) => {
  return trabajadores.length
    ? trabajadores.map((trabajador) => ({ ...relevamiento, ...trabajador, id: relevamiento.id }))
    : [relevamiento];
};

/* =============== Componente =============== */
const RelevamientoHandler = () => {
  const dispatch = useDispatch();
  const tabs = [];
  const [tab, setTab] = useState(0);

  const tarea = useTareasUsuario();
  const disableTabAutoridades = !tarea.hasTarea("Datos_SeccionalAutoridades");
  const puedeConsultar = tarea.hasTarea("Relevamiento_Consulta", "Administrador Relevamiento") || tarea.hasTarea("Relevamiento_Modifica", "Administrador Relevamiento") || tarea.hasTarea("Relevamiento_Tabla", "Administrador Relevamiento");
  const puedeModificar = tarea.hasTarea("Relevamiento_Modifica", "Administrador Relevamiento") || tarea.hasTarea("Relevamiento_Tabla", "Administrador Relevamiento");
  const [modalMode, setModalMode] = useState(null);
  const [gestiones, setGestiones] = useState({});
  const [gestionLoading, setGestionLoading] = useState(false);
  const [gestionError, setGestionError] = useState(null);
  const [catalogosEdicion, setCatalogosEdicion] = useState({
    loading: true,
    seccionales: [],
    localidades: [],
    jornadas: [],
    errores: [],
  });
  const idempotencyKeysRef = React.useRef(new Map());

  const pushTrabajadoresQuery = useQueryQueue((action, params = {}) => {
    switch (action) {
      case "GetTrabajadores":
        return {
          config: { baseURL: "App", endpoint: "/FiscalizacionesTrabajador", method: "GET" },
          params,
        };
      default:
        return null;
    }
  });

  const pushGestionQuery = useQueryQueue((action, params = {}) => {
    switch (action) {
      case "GetGestion":
        return {
          config: { baseURL: "App", endpoint: `/Fiscalizaciones/${params.id}/gestion`, method: "GET" },
          params: {},
        };
      case "GetTrabajadores":
        return {
          config: { baseURL: "App", endpoint: "/FiscalizacionesTrabajador", method: "GET" },
          params,
        };
      case "OperacionGestion":
        return {
          config: {
            baseURL: "App",
            endpoint: `/Fiscalizaciones/${params.id}/operaciones`,
            method: "POST",
            headers: { "Idempotency-Key": params.idempotencyKey },
            body: params.body,
          },
          params: {},
        };
      case "ActualizarTrabajador":
        return {
          config: { baseURL: "App", endpoint: `/FiscalizacionesTrabajador/${params.id}`, method: "PUT", body: params.body, okType: "response" },
          params: {},
        };
      case "ActualizarFiscalizacion":
        return {
          config: {
            baseURL: "App",
            endpoint: `/Fiscalizaciones/${params.id}`,
            method: "PUT",
            body: params.body,
          },
          params: {},
        };
      case "GetJornadas":
        return {
          config: { baseURL: "App", endpoint: "/JornadaHorario", method: "GET" },
          params: { deleted: false, page: "1,1000" },
        };
      case "GetLocalidadesCatalogo":
        return {
          config: { baseURL: "Afiliaciones", endpoint: "/RefLocalidad", method: "GET" },
          params: {},
        };
      case "GetSeccionalesCatalogo":
        return {
          config: {
            baseURL: "Afiliaciones",
            endpoint: "/Seccional/GetSeccionalesSpecs",
            method: "POST",
            body: { soloActivos: true, pageIndex: params.pageIndex || 1, pageSize: 50 },
          },
          params: {},
        };
      default:
        return null;
    }
  });

  const requestGestion = useCallback(
    (action, params = {}) => new Promise((resolve, reject) => {
      pushGestionQuery({ action, params, onOk: resolve, onError: reject });
    }),
    [pushGestionQuery]
  );

  useEffect(() => {
    let activo = true;

    const cargarSeccionalesCatalogo = async () => {
      const seccionales = [];
      let pagina = 1;
      let totalPaginas = 1;

      do {
        const respuesta = await requestGestion("GetSeccionalesCatalogo", { pageIndex: pagina });
        seccionales.push(...datosCatalogo(respuesta));
        totalPaginas = Number(respuesta?.pages) || 1;
        pagina += 1;
      } while (pagina <= totalPaginas);

      return seccionales;
    };

    Promise.allSettled([
      requestGestion("GetJornadas"),
      requestGestion("GetLocalidadesCatalogo"),
      cargarSeccionalesCatalogo(),
    ]).then(([jornadas, localidades, seccionales]) => {
      if (!activo) return;
      const resultados = [jornadas, localidades, seccionales];
      setCatalogosEdicion({
        loading: false,
        jornadas: jornadas.status === "fulfilled" ? datosCatalogo(jornadas.value) : [],
        localidades: localidades.status === "fulfilled" ? datosCatalogo(localidades.value) : [],
        seccionales: seccionales.status === "fulfilled" ? datosCatalogo(seccionales.value) : [],
        errores: resultados.filter((resultado) => resultado.status === "rejected").map((resultado) => resultado.reason?.message || "No se pudo cargar un catálogo."),
      });
    });

    return () => {
      activo = false;
    };
  }, [requestGestion]);

  /* ---------- Selects: Delegación / Seccional ---------- */
  const [delegacionSelect, setDelegacionSelect] = useState({
    reload: false,
    loading: "Cargando...",
    buscar: "",
    data: [],
    error: null,
    optionsSrc: [],
    options: [],
    selected: delegacionSelectDef,
    selectedDef: delegacionSelectDef,
    ambito: null,
    origen: "",
  });

  const [seccionalSelect, setSeccionalSelect] = useState({
    reload: false,
    loading: null,
    buscar: "",
    data: [],
    error: null,
    optionsSrc: [],
    options: [],
    selected: seccionalSelectDef,
    selectedDef: seccionalSelectDef,
    refDelegacionId: 0,
    ambito: null,
    origen: "",
  });

  // Empleador
  const [empleadorUI, setEmpleadorUI] = useState("");


  // Filtro de fecha
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);

  /* ---------- Buscador interno de selects ---------- */
  useEffect(() => {
    setDelegacionSelect((o) => ({
      ...o,
      options: o.optionsSrc.filter((r) => includeSearch(r, delegacionSelect.buscar)),
    }));
  }, [delegacionSelect.buscar, delegacionSelect.optionsSrc]);

  useEffect(() => {
    setSeccionalSelect((o) => ({
      ...o,
      options: o.optionsSrc.filter((r) => includeSearch(r, seccionalSelect.buscar)),
    }));
  }, [seccionalSelect.buscar, seccionalSelect.optionsSrc]);

  /* ---------- APIs para selects ---------- */
  const { setState: setDelegacionesQuery } = useQueryState(
    () => ({
      config: {
        baseURL: "Comunes",
        endpoint: `/RefDelegacion/GetAll`,
        method: "GET",
      },
    }),
    {
      query: {
        config: { errorType: "response" },
        params: { soloActivos: true },
      },
    }
  );

  const { setState: setSeccionalesQuery } = useQueryState(
    () => ({
      config: {
        baseURL: "Afiliaciones",
        endpoint: `/Seccional/GetSeccionalesSpecs`,
        method: "POST",
      },
    }),
    {
      query: { config: { errorType: "response" }, body: { soloActivos: true } },
    }
  );

  // Carga inicial de Delegaciones
  useEffect(() => {
    if (!delegacionSelect.reload) return;
    setDelegacionSelect((o) => ({
      ...o,
      reload: false,
      loading: "Cargando...",
      data: [],
      options: [],
      optionsSrc: [],
      selected: delegacionSelectDef,
      selectedDef: delegacionSelectDef,
      buscar: "",
    }));

    setDelegacionesQuery((o) => ({
      ...o,
      onLoad: ({ ok, error }) => {
        let data = [];
        if (Array.isArray(ok)) data = ok;

        setDelegacionSelect((old) => {
          if (old.data.length > 0) return old; // ya cargado, no resetear
          const n = {
            ...old,
            loading: null,
            data,
            error: error?.toString(),
          };
          n.optionsSrc = delegacionesSelectOptions(n);
          n.selectedDef = n.optionsSrc.length === 1 ? n.optionsSrc[0] : delegacionSelectDef;
          n.selected = n.selectedDef;
          return n;
        });
      },
    }));
  }, [delegacionSelect.reload, setDelegacionesQuery]);

  // Carga de Seccionales (depende de la delegación)
  useEffect(() => {
    if (!seccionalSelect.reload) return;

    const changes = {
      reload: false,
      loading: "Cargando...",
      error: null,
      options: [],
      optionsSrc: [],
      selected: seccionalSelectDef,
      selectedDef: seccionalSelectDef,
      buscar: "",
    };

    const data = [];
    if (!seccionalSelect.refDelegacionId) {
      changes.loading = null;
      changes.data = data;
      setSeccionalSelect((o) => ({ ...o, ...changes }));
      return;
    }

    // Paginado del endpoint de seccionales
    const onLoad = ({ query, ok, error }) => {
      let pages = 0;
      let pageIndex = query.config.body.pageIndex;
      if (ok) {
        pages = ok.pages;
        if (Array.isArray(ok.data)) data.push(...ok.data);
        else console.error("Se esperaba un arreglo", ok.data);
      }
      if (error) changes.error = error.toString();

      if (pageIndex < pages) {
        pageIndex += 1;
        changes.loading = `Cargando bloque ${pageIndex} de ${pages}...`;
        setSeccionalesQuery((o) => ({
          ...o,
          query: {
            ...o.query,
            config: {
              ...o.query.config,
              body: {
                ...o.query.config.body,
                pageIndex,
              },
            },
          },
          onLoad,
        }));
      } else {
        changes.loading = null;
        changes.data = data;
        changes.optionsSrc = seccionalesSelectOptions(changes);
        changes.selectedDef =
          changes.optionsSrc.length === 1 ? changes.optionsSrc[0] : seccionalSelectDef;
        changes.selected = changes.selectedDef;
      }

      setSeccionalSelect((o) => ({ ...o, ...changes }));
    };

    setSeccionalesQuery((o) => ({
      ...o,
      query: {
        ...o.query,
        config: {
          ...o.query.config,
          body: {
            ...o.query.params,
            refDelegacionId: seccionalSelect.refDelegacionId,
            pageIndex: 1,
          },
        },
      },
      onLoad,
    }));
  }, [seccionalSelect.reload, seccionalSelect.refDelegacionId, setSeccionalesQuery]);

  // Al cambiar delegación, preparo carga de seccionales
  useEffect(() => {
    if (delegacionSelect.loading) return;
    const selected = delegacionSelect.selected;

    setSeccionalSelect((o) => ({
      ...o,
      reload: true,
      refDelegacionId: selected === delegacionSelectDef ? 0 : selected?.value,
      selected: o.selectedDef,
    }));
  }, [delegacionSelect.loading, delegacionSelect.selected]);


  const {
    render: relevamientoTab,
    request: relevamientoChanger,
    selected: relevamientoSelected,
    list: relevamientoList,
  } = useRelevamiento({
    columns: (columns) => columns.map((column) => column.dataField === "estado"
      ? { ...column, formatter: (estado, record) => gestiones[record.id]?.estado || record.estadoRelevamiento || estado || ESTADOS_RELEVAMIENTO.REGISTRADA }
      : column),
    onEditComplete: ({ request, response }) => {
      if (request === "A" && response?.id) {
        relevamientoChanger("list", {
          pagination: { index: 1, size: 10 },
          onLoadSelect: () => response,
        });
      }
    },
  });

  const relevamientoGestion = useMemo(
    () => relevamientoSelected
      ? gestiones[relevamientoSelected.id] || adaptarGestionRelevamiento({
        relevamiento: relevamientoSelected,
        estado: relevamientoSelected.estadoRelevamiento,
      })
      : null,
    [gestiones, relevamientoSelected]
  );

  const obtenerGestion = useCallback(async (id, relevamientoAlternativo = null) => {
    let gestion;

    try {
      gestion = await requestGestion("GetGestion", { id });
    } catch (error) {
      if (!relevamientoAlternativo) throw error;
      gestion = {
        relevamiento: relevamientoAlternativo,
        estado: relevamientoAlternativo.estadoRelevamiento,
      };
    }

    let trabajadores = null;

    try {
      const respuestaTrabajadores = await requestGestion("GetTrabajadores", {
        fiscalizacionesId: id,
        deleted: false,
        pageIndex: 1,
        pageSize: 500,
      });
      trabajadores = Array.isArray(respuestaTrabajadores) ? respuestaTrabajadores : respuestaTrabajadores?.data;
    } catch {
      trabajadores = null;
    }

    return adaptarGestionRelevamiento(gestion, Array.isArray(trabajadores) ? trabajadores : null);
  }, [requestGestion]);

  const recargarListado = useCallback(() => {
    relevamientoChanger("list", { onLoadSelect: onLoadSelectKeepOrFirst });
  }, [relevamientoChanger]);

  const abrirSeguimiento = useCallback(async (mode) => {
    if (!relevamientoSelected) return;
    setModalMode(mode);
    setGestionLoading(true);
    setGestionError(null);
    try {
      const gestion = await obtenerGestion(relevamientoSelected.id, relevamientoSelected);
      setGestiones((actuales) => ({ ...actuales, [relevamientoSelected.id]: gestion }));
    } catch (error) {
      setGestionError(error?.message || "No fue posible obtener el seguimiento del relevamiento.");
    } finally {
      setGestionLoading(false);
    }
  }, [obtenerGestion, relevamientoSelected]);

  const guardarGestion = useCallback((actualizado) => {
    setGestiones((actuales) => ({ ...actuales, [actualizado.id]: actualizado }));
    recargarListado();
  }, [recargarListado]);

  const operarGestion = useCallback(async (tipo, datos = {}, versionActual = null) => {
    if (!relevamientoSelected) throw new Error("Seleccioná un relevamiento.");
    setGestionLoading(true);
    setGestionError(null);
    const version = versionActual || gestiones[relevamientoSelected.id]?.version || "";
    const operationId = JSON.stringify({ id: relevamientoSelected.id, tipo, version, datos });
    const idempotencyKey = idempotencyKeysRef.current.get(operationId) || crearIdempotencyKey();
    idempotencyKeysRef.current.set(operationId, idempotencyKey);
    try {
      const gestion = await requestGestion("OperacionGestion", {
        id: relevamientoSelected.id,
        idempotencyKey,
        body: { tipo, version, ...datos },
      });
      const actualizado = adaptarGestionRelevamiento(gestion);
      setGestiones((actuales) => ({ ...actuales, [relevamientoSelected.id]: actualizado }));
      idempotencyKeysRef.current.delete(operationId);
      return actualizado;
    } finally {
      setGestionLoading(false);
    }
  }, [gestiones, relevamientoSelected, requestGestion]);

  const guardarDatosPrincipales = useCallback(async (editado) => {
    if (!relevamientoSelected) throw new Error("Seleccioná un relevamiento.");
    const establecimiento = editado.establecimiento || {};
    return operarGestion("ACTUALIZAR_DATOS_PRINCIPALES", {
      datosPrincipales: {
        ...seleccionarCampos(editado, camposRelevamientoEditables),
          actaNro: entero(editado.actaNro),
          localidadesId: entero(editado.localidadesId),
          lugar: entero(editado.lugar),
          seccionalId: entero(editado.seccionalId),
          inspectorDNI: entero(editado.inspectorDNI),
          inspectorRenatreDNI: entero(editado.inspectorRenatreDNI),
          actaMinisterio: entero(editado.actaMinisterio),
          actaRenatre: entero(editado.actaRenatre),
          actaReservin: entero(editado.actaReservin),
          establecimientoRazonSocial: editado.empleador?.razonSocial || null,
          establecimientoCUIT: cuitNumerico(editado.empleador?.cuit),
          establecimientoActividad: establecimiento.actividad || null,
          establecimientoSector: establecimiento.sector || null,
          establecimientoLocalidadesId: entero(establecimiento.localidadesId),
          establecimientoLugar: establecimiento.lugar || null,
          establecimientoResponsable: establecimiento.responsable || null,
          establecimientoResponsableDNI: entero(establecimiento.responsableDNI),
          establecimientoContacto: establecimiento.contacto || null,
          establecimientoContactoCelular: entero(establecimiento.contactoCelular),
          establecimientoContactoEmail: establecimiento.contactoEmail || null,
          establecimientoBotiquin: establecimiento.botiquin || null,
          establecimientoBanos: establecimiento.banos || null,
          establecimientoBanosUbicacion: establecimiento.banosUbicacion || null,
          establecimientoAccesibilidad: establecimiento.accesibilidad || null,
          establecimientoAreaDescansoEquipada: establecimiento.areaDescansoEquipada || null,
          establecimientoServiciosElectricidad: establecimiento.serviciosElectricidad || null,
          establecimientoServiciosElectricidadTipo: establecimiento.serviciosElectricidadTipo || null,
          establecimientoServiciosGas: establecimiento.serviciosGas || null,
          establecimientoServiciosGasTipo: establecimiento.serviciosGasTipo || null,
          establecimientoServiciosAguaPotable: establecimiento.serviciosAguaPotable || null,
          establecimientoServiciosAguaPotableTipo: establecimiento.serviciosAguaPotableTipo || null,
          establecimientoServiciosInternet: establecimiento.serviciosInternet || null,
      },
    }, editado.version);
  }, [operarGestion, relevamientoSelected]);

  const guardarTrabajador = useCallback(async (trabajador) => {
    if (!relevamientoSelected || !trabajador?.id) throw new Error("No se encontró el trabajador a actualizar.");
    setGestionLoading(true);
    setGestionError(null);
    try {
      await requestGestion("ActualizarTrabajador", { id: trabajador.id, body: normalizarTrabajador(trabajador) });
      const actualizado = await obtenerGestion(relevamientoSelected.id, relevamientoSelected);
      setGestiones((actuales) => ({ ...actuales, [relevamientoSelected.id]: actualizado }));
      recargarListado();
      return actualizado;
    } finally {
      setGestionLoading(false);
    }
  }, [obtenerGestion, recargarListado, relevamientoSelected, requestGestion]);

  // Activa la carga de delegaciones solo la primera vez que Fiscalizaciones termina
  const delegacionesLoadedRef = React.useRef(false);
  useEffect(() => {
    if (relevamientoList.loading !== null) return;
    if (delegacionesLoadedRef.current) return;
    delegacionesLoadedRef.current = true;
    setDelegacionSelect((o) => ({ ...o, reload: true }));
  }, [relevamientoList.loading]);


  const [pdf, setPdf] = useState({
    loading: null,
    data: [],
    error: null,
    despliega: false,
  });

  const onCargaPDF = useCallback(() => {
    if (!relevamientoSelected) {
      setPdf((actual) => ({ ...actual, error: "Seleccioná un registro para imprimir.", despliega: false }));
      return;
    }
    setPdf((o) => ({ ...o, loading: "Preparando impresión...", error: null, despliega: false }));
    const trabajadores = [];
    const loadPage = (pageIndex) => {
      pushTrabajadoresQuery({
        action: "GetTrabajadores",
        params: {
          fiscalizacionesId: relevamientoSelected.id,
          deleted: false,
          pageIndex,
          pageSize: 100,
        },
        onOk: async (response) => {
          const pageData = Array.isArray(response) ? response : response?.data;
          if (!Array.isArray(pageData)) {
            setPdf((o) => ({
              ...o,
              loading: null,
              error: "No fue posible leer los trabajadores para imprimir.",
            }));
            return;
          }

          trabajadores.push(...pageData);
          const pages = Number(response?.pages ?? 1) || 1;
          if (pageIndex < pages) {
            loadPage(pageIndex + 1);
            return;
          }

          setPdf((o) => ({
            ...o,
            data: detalleToPdfRows(relevamientoSelected, trabajadores),
            despliega: true,
            loading: null,
            error: null,
          }));
        },
        onError: async (error) =>
          setPdf((o) => ({
            ...o,
            loading: null,
            despliega: false,
            error: error?.message ?? "No fue posible obtener los trabajadores para imprimir.",
          })),
      });
    };

    loadPage(1);
  }, [pushTrabajadoresQuery, relevamientoSelected]);

  const encuestaActions = useMemo(() => {
    const createAction = ({ action, onExecute, ...props }) => new Action({ name: action, onExecute, combination: "AltKey", ...props });
    const descripcion = relevamientoSelected?.id || "";
    return [
      createAction({ action: `Consulta Relevamiento nro. ${descripcion}`, onExecute: () => abrirSeguimiento("view"), keys: "o", underlineindex: 1, disabled: !relevamientoSelected || !puedeConsultar }),
      createAction({ action: `Modifica Relevamiento nro. ${descripcion}`, onExecute: () => abrirSeguimiento("modify"), keys: "m", underlineindex: 0, disabled: !relevamientoSelected || !puedeModificar }),
      createAction({ action: "Imprime", onExecute: onCargaPDF, keys: "i", underlineindex: 0, disabled: !relevamientoSelected || !!pdf.loading }),
    ];
  }, [abrirSeguimiento, onCargaPDF, pdf.loading, puedeConsultar, puedeModificar, relevamientoSelected]);

  tabs.push({
    header: () => <Tab label="RELEVAMIENTOS" />,
    body: () => (
      <Grid col gap="inherit">
        <Grid width gap="inherit">{relevamientoTab()}</Grid>
      </Grid>
    ),
    actions: encuestaActions,
  });


  /* ---------- ESTABLECIMIENTO ---------- */
  const [establecimientoTab, establecimientoChanger, establecimientoSelected] =
    useEstablecimiento({
      relevamientoId: relevamientoSelected?.id,
    });
  const [establecimientoActions, setEstablecimientoActions] = useState([]);

  useEffect(() => {
    const secc = relevamientoSelected?.id ?? "";
    const actions = [];
    if (!secc) return setEstablecimientoActions([]);
    setEstablecimientoActions(actions);
  }, [establecimientoChanger, establecimientoSelected, relevamientoSelected]);

  tabs.push({
    header: () => (
      <Tab
        label="DATOS DEL ESTABLECIMIENTO"
        disabled={
          !relevamientoSelected?.id ||
          relevamientoSelected.deletedDate ||
          disableTabAutoridades
        }
      />
    ),
    body: establecimientoTab,
    actions: establecimientoActions,
  });

  /* ---------- TRABAJADOR ---------- */
  const [trabajadorxTab, trabajadorxChanger] = useTrabajador({
    relevamientoId: relevamientoSelected?.id,
  });
  const [trabajadorxActions] = useState([]);

  useEffect(() => {
    if (!relevamientoSelected?.id) return;

    trabajadorxChanger("list", {
      clear: !establecimientoSelected?.id,
      data: establecimientoSelected,
      params: {
        relevamientoId: relevamientoSelected.id,
      },
      trabajadorx: Array.isArray(establecimientoSelected?.id)
        ? establecimientoSelected.trabajadorx
        : [],
    });
  }, [establecimientoSelected, relevamientoSelected, trabajadorxChanger]);

  tabs.push({
    header: () => (
      <Tab
        label="DATOS DEL TRABAJADOR"
        disabled={
          !relevamientoSelected?.id ||
          relevamientoSelected.deletedDate ||
          disableTabAutoridades
        }
      />
    ),
    body: trabajadorxTab,
    actions: trabajadorxActions,
  });

  /* ---------- MODULO + ACCIONES ---------- */
  const acciones = tabs[tab].actions;
  useEffect(() => {
    dispatch(handleModuloSeleccionar({ nombre: "Relevamiento", acciones }));
  }, [dispatch, acciones, tab]);

  /* ---------- Aplicar / Limpiar filtros ---------- */
  const onAplicaFiltros = () => {
    const params = {};
    const delegSel = delegacionSelect.selected;
    const seccSel = seccionalSelect.selected;

    const delegId = delegSel && delegSel !== delegacionSelectDef ? Number(delegSel.value) : null;
    const seccId = seccSel && seccSel !== seccionalSelectDef ? Number(seccSel.value) : null;

    if (delegId != null) params.delegacionId = delegId;
    if (seccId != null) params.seccionalId = seccId;
    // El empleador se filtra en frontend para soportar tanto razón social
    // como CUIT sin requerir cambios en el endpoint Fiscalizaciones.
    params.filtroEmpleador = empleadorUI?.trim() || "";
    if (fechaDesde) params.FechaDesde = fechaDesde;
    if (fechaHasta) params.FechaHasta = fechaHasta;

    relevamientoChanger("list", {
      params,
      pagination: { index: 1, size: 10 },
      onLoadSelect: onLoadSelectKeepOrFirst,
    });
  };

  const onLimpiaFiltros = () => {
    setDelegacionSelect((o) => ({ ...o, selected: o.selectedDef }));
    setSeccionalSelect((o) => ({
      ...o,
      selected: o.selectedDef,
      refDelegacionId: 0,
      optionsSrc: [],
      options: [],
      data: [],
    }));
    setEmpleadorUI("");
    setFechaDesde(null);
    setFechaHasta(null);

    relevamientoChanger("list", {
      params: {},
      replaceParams: true,
      pagination: { index: 1, size: 10 },
      onLoadSelect: onLoadSelectKeepOrFirst,
    });
  };

  const pdfRender = !pdf.despliega ? null : (
    <PDFViewer
      data={pdf.data}
      filtros={{
        delegacion: delegacionSelect.selected?.label,
        seccional: seccionalSelect.selected?.label,
        empleador: empleadorUI,
        fechaDesde,
        fechaHasta,
      }}
      onClose={() => setPdf((actual) => ({ ...actual, despliega: false }))}
    />
  );

  return (
    <Grid full col gap="10px">
      <Grid className="titulo">
        <h1>RELEVAMIENTO DE TRABAJADORES</h1>
      </Grid>

      <Grid className="tabs">
        <Tabs value={tab} onChange={(_, v) => {
          setTab(v);
          setDelegacionSelect((o) => ({ ...o, buscar: "", options: o.optionsSrc }));
          setSeccionalSelect((o) => ({ ...o, buscar: "", options: o.optionsSrc }));
        }}>
          {tabs.map((r) => r.header())}
        </Tabs>
      </Grid>

      {tab === 0 && (
        <Grid grid="auto / 1fr 1fr 1fr 1fr 1fr 160px 140px" gap="10px" align="center">
          {/* Delegación */}
          <SearchSelectMaterial
            id="delegacionSelect"
            label="Delegación"
            error={!!delegacionSelect.error}
            helperText={delegacionSelect.loading ?? delegacionSelect?.error}
            value={delegacionSelect.selected}
            onChange={(selected) => setDelegacionSelect((o) => ({ ...o, selected, buscar: "", options: o.optionsSrc }))}
            options={delegacionSelect.optionsSrc}
            onTextChange={(buscar) => setDelegacionSelect((o) => ({ ...o, buscar }))}
          />

          {/* Seccional */}
          <SearchSelectMaterial
            id="seccionalSelect"
            label="Seccional"
            error={!!seccionalSelect.error}
            helperText={seccionalSelect.loading ?? seccionalSelect?.error}
            value={seccionalSelect.selected}
            onChange={(selected) => setSeccionalSelect((o) => ({ ...o, selected }))}
            options={seccionalSelect.optionsSrc}
            onTextChange={(buscar) => setSeccionalSelect((o) => ({ ...o, buscar }))}
          />

          {/* Empleador: búsqueda local por razón social o CUIT */}
          <InputMaterial
            label="Empleador (nombre o CUIT)"
            placeholder="Razón social o CUIT"
            value={empleadorUI}
            onChange={(v) => setEmpleadorUI(v && v.target ? v.target.value : v)}
          />

          {/* Desde fecha */}
          <InputMaterial
            type="date"
            label="Desde fecha"
            value={fechaDesde}
            maxDate={fechaHasta}
            onChange={(v) => {
              const fecha = v?.format("YYYY-MM-DD");
              setFechaDesde(fecha);
            }}
          />

          {/* Hasta fecha */}
          <InputMaterial
            type="date"
            label="Hasta fecha"
            value={fechaHasta}
            minDate={fechaDesde}
            onChange={(v) => {
              const fecha = v?.format("YYYY-MM-DD");
              setFechaHasta(fecha);
            }}
          />

          <Button className="botonAzul" onClick={onAplicaFiltros}>
            Aplica filtros
          </Button>

          <Button className="botonAzul" onClick={onLimpiaFiltros}>
            Limpiar
          </Button>
        </Grid>
      )}

      <Grid className="contenido" col gap="10px">
        {tabs.map(({ body }, i) => (
          <Grid col gap="inherit" hidden={i !== tab} key={i}>
            {body()}
          </Grid>
        ))}
      </Grid>

      {modalMode && relevamientoGestion && (
        <RelevamientoForm
          record={relevamientoGestion}
          mode={modalMode === "modify" ? "M" : "C"}
          canModify={puedeModificar}
          loading={gestionLoading}
          externalError={gestionError}
          onClose={() => setModalMode(null)}
          onOperation={operarGestion}
          onSave={guardarGestion}
          onSaveData={guardarDatosPrincipales}
          onSaveWorker={guardarTrabajador}
          catalogos={catalogosEdicion}
        />
      )}
      {pdfRender}
      <KeyPress items={acciones} />
    </Grid>
  );
};

export default RelevamientoHandler;
