import React, { useEffect, useState, useCallback } from "react";
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
import PDFViewer from "./PDFViewer";

/* ================= Helpers ================= */ 
const norm = (v) => 
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

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
    onEditComplete: ({ request, response }) => {
      if (request === "A" && response?.id) {
        relevamientoChanger("list", {
          pagination: { index: 1, size: 10 },
          onLoadSelect: () => response,
        });
      }
    },
    renderExtraActions: () => (
      <>
        <Button
          className="botonAmarillo"
          loading={!!pdf.loading}
          onClick={onCargaPDF}
          disabled={!relevamientoList?.data || relevamientoList.data.length === 0 || !!pdf.loading}
          title="Generar PDF con el detalle del relevamiento seleccionado"
          style={{ width: "200px", height: "45px", fontSize: "14px" }}
        >
          IMPRIME
        </Button>
        {pdf.loading && <div style={{ color: "green", marginTop: "10px" }}>{pdf.loading}</div>}
        {pdf.error && <div style={{ color: "red", marginTop: "10px" }}>{pdf.error}</div>}
      </>
    ),
  });

  // Activa la carga de delegaciones solo la primera vez que Fiscalizaciones termina
  const delegacionesLoadedRef = React.useRef(false);
  useEffect(() => {
    if (relevamientoList.loading !== null) return;
    if (delegacionesLoadedRef.current) return;
    delegacionesLoadedRef.current = true;
    setDelegacionSelect((o) => ({ ...o, reload: true }));
  }, [relevamientoList.loading]);


  /* ---------- PDF ---------- */
  const [pdf, setPdf] = useState({
    loading: null,
    data: [],
    error: null,
    despliega: false,
  });

  const onCargaPDF = useCallback(() => {
    if (!relevamientoSelected) {
      setPdf((o) => ({ ...o, error: "Selecciona un registro para imprimir.", despliega: false }));
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

  /* ---------- Tabs ---------- */
  const [encuestaActions] = useState([]);

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
    dispatch(handleModuloSeleccionar({ nombre: "Seccionales", acciones }));
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

  /* ------------------- UI ------------------- */
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
      onClose={() => setPdf((o) => ({ ...o, despliega: false }))}
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

      {pdfRender}
      <KeyPress items={acciones} />
    </Grid>
  );
};

export default RelevamientoHandler;
