import { useCallback, useEffect, useState } from "react";
import useQueryQueue from "components/hooks/useQueryQueue";
import AsArray from "components/helpers/AsArray";
import DenunciasTable from "./DenunciasTable";
import DenunciaDetails from "./DenunciaDetails";

const selectionDef = {
  action: "",
  request: "",
  index: null,
  record: null,
};

export const onLoadSelectFirst = ({ data, multi, record }) => {
  const dataArray = AsArray(data);
  if (multi) {
    record = AsArray(record);
    let retorno = dataArray.filter((d) => record.find((r) => r.id === d.id));
    if (retorno.length === 0) retorno = [dataArray.at(0)].filter((r) => r);
    return retorno.length ? retorno : null;
  }
  return dataArray.find((r) => r.id === record?.id) ?? dataArray.at(0);
};

export const onLoadSelectKeepOrFirst = ({ data, multi, record }) =>
  record ? record : onLoadSelectFirst({ data, multi, record });






const useDenuncias = ({
  remote = true,
  data: dataInit = [],
  loading,
  error,
  pagination: paginationInit = { index: 1, size: 10 },
  onLoadSelect = onLoadSelectFirst,
  columns,
  hideSelectColumn = true,
  filtroIds = [],
  hayFiltroActivo = false,
  filtroEstado = null,
  filtroFechaDesde = null,
  filtroFechaHasta = null,
  usuarioAmbito = null,
  applyAmbitoFilter = null,
  filtroTipoIngresoId = null,
  filtroSituacionId = null,
  filtroDerivadoATipo = null,
  filtroDerivadoAId = null,
  filtroDelegacionId = null,
  bloqueado = false,
  filtroDelegacionOrigenId = null,
  filtroSeccionalOrigenId = null,
  seccionalOrigenMap = null,
  localidadOrigenMap = null,
  filtroLocalidadId = null,
  filtroNumeroSeguimiento = null,
} = {}) => {







  
  

  const pushQuery = useQueryQueue((action) => {
    if (action === "GetList") {
      return {
        config: {
          baseURL: "App",
          method: "GET", 
          endpoint: "/AppDenuncias",
        },
      };
    }
    if (action === "GetTipoDenuncia") {
      return {
        config: {
          baseURL: "App",
          method: "GET",
          endpoint: "/DenunciaTipo",
        },
      };
    }
    return null;
  });

  const [list, setList] = useState({
    loading: remote ? "Cargando..." : null,
    remote,
    loadingOverride: loading,
    params: { sortBy: "-fecha" },
    pagination: { index: 1, size: 10, ...paginationInit },
    data: [...AsArray(dataInit, true)],
    error,
    selection: { ...selectionDef },
    onLoadSelect,
  });

  useEffect(() => {
    if (!list.loading) return;
    if (bloqueado) return; // esperar a que los filtros de ámbito estén listos
    const changes = { loading: null, error: null };

    if (!list.remote) {
      const data = list.data;
      const record = list.selection.record;
      changes.data = data;
      changes.selection = {
        ...list.selection,
        ...selectionDef,
        record: list.onLoadSelect({ data, multi: false, record }),
      };
      changes.selection.index = data.indexOf(changes.selection.record);
      setList((o) => ({ ...o, ...changes }));
      return;
    }

    changes.data = [];

    // Cargar todas las denuncias sin paginación para procesamiento client-side

    // � FUNCIÓN AUXILIAR PARA CARGAR DENUNCIAS (FLUJO NORMAL - TODAS SIN PAGINACIÓN)
    function cargarDenunciasConParametros(queryParams, totalFilteredCount) {
      //  Cargar todas las denuncias sin paginación del servidor
      const paramsFiltered = {
        ...queryParams,
        // Sin Page/PageSize para cargar TODOS los datos sin paginación del servidor
        // La paginación se hace client-side en DenunciasTable
      };
      

      
      pushQuery({
        action: "GetList",
        params: paramsFiltered,
        onOk: (response) => {
          
          let data = [];
          let paginationInfo = {};

          if (response && typeof response === "object") {
            data = response.data || [];
            // Para exportación: usamos el conteo total de lo que retorna el servidor
            const totalCount = response.count || response.totalCount || response.total || data.length;
            paginationInfo = {
              index: list.pagination.index,
              size: list.pagination.size,
              count: totalCount,
              pages: Math.ceil(totalCount / list.pagination.size)
            };
          } else if (Array.isArray(response)) {
            data = response;
            paginationInfo = {
              index: list.pagination.index,
              size: list.pagination.size,
              count: totalFilteredCount || response.length
            };
          } else {
            console.error("Formato de respuesta inesperado:", response);
            setList((o) => ({ 
              ...o, 
              loading: null,
              error: "Formato de respuesta inesperado",
              selection: { ...selectionDef }
            }));
            return;
          }

          if (!Array.isArray(data)) {
            console.error("Se esperaba un arreglo en data", { data, response });
            setList((o) => ({ 
              ...o, 
              loading: null,
              error: "Datos inválidos del servidor",
              selection: { ...selectionDef }
            }));
            return;
          }
          
          if (usuarioAmbito && usuarioAmbito.tipo && usuarioAmbito.id && applyAmbitoFilter && typeof applyAmbitoFilter === "function") {
            console.log(" Aplicando filtro por ámbito específico (flujo normal)...", {
              usuarioAmbito,
              totalDenunciasOriginales: data.length
            });
            try {
              applyAmbitoFilter(data, usuarioAmbito).then(filteredData => {
                console.log(" Filtro por ámbito aplicado (flujo normal) - RESULTADO:", {
                  totalOriginal: data.length,
                  totalFiltrado: filteredData.length,
                  ambitoTipo: usuarioAmbito.tipo,
                  ambitoId: usuarioAmbito.id
                });
                
                // Cargar estados después del filtro por ámbito
                cargarEstadosParaDenuncias(filteredData, paginationInfo);
              }).catch(error => {
                console.error(" Error aplicando filtro de ámbito:", error);
                // Cargar estados sin filtro por ámbito
                cargarEstadosParaDenuncias(data, paginationInfo);
              });
            } catch (error) {
              console.error(" Error aplicando filtro de ámbito:", error);
              // Cargar estados sin filtro por ámbito
              cargarEstadosParaDenuncias(data, paginationInfo);
            }
          } else {
            // Cargar estados para todas las denuncias
            cargarEstadosParaDenuncias(data, paginationInfo);
          }

          // 🔧 FUNCIÓN PARA CARGAR ESTADOS DE LAS DENUNCIAS
          function cargarEstadosParaDenuncias(denunciasData, paginationInfo) {
            let dataConEstados = denunciasData.map(denuncia => ({
                    ...denuncia,
              estado: denuncia.ultimoEstado,
            }));

                if (filtroDerivadoAId) {
                  const target = Number(filtroDerivadoAId);
                  dataConEstados = dataConEstados.filter(d => {
                    const derivTipo = String(d.derivadoATipo || d.derivadoA_Tipo || d.derivado_a_tipo || "").toLowerCase();
                    const derivId = Number(d.derivadoAId ?? d.derivadoA_Id ?? d.derivado_a_id ?? 0);
                    return derivId === target || (derivId === target && (derivTipo === 'delegacion' || derivTipo === 'seccional'));
                  });
                }

                // REQ-1118: el código de seccional es el origen asignado al registrar.
                // Las denuncias históricas sin código usan la relación de localidad como respaldo.
                if ((filtroDelegacionOrigenId || filtroSeccionalOrigenId) && (seccionalOrigenMap || localidadOrigenMap)) {
                  dataConEstados = dataConEstados.filter((d) => {
                    const seccionalCodigo = String(d.seccionalCodigo ?? d.SeccionalCodigo ?? "").trim().toUpperCase();
                    const localidadId = Number(d.localidadId ?? d.LocalidadId ?? 0);
                    const origen = seccionalOrigenMap?.get(seccionalCodigo)
                      || localidadOrigenMap?.get(localidadId);
                    if (filtroDelegacionOrigenId && !origen?.delegacionIds?.has(Number(filtroDelegacionOrigenId))) return false;
                    if (filtroSeccionalOrigenId && !origen?.seccionalIds?.has(Number(filtroSeccionalOrigenId))) return false;
                    return true;
                  });
                }

                // AF E1ulKugD: filtro por Localidad (comparación directa contra localidadId de la denuncia)
                if (filtroLocalidadId) {
                  const target = Number(filtroLocalidadId);
                  dataConEstados = dataConEstados.filter((d) => Number(d.localidadId ?? d.LocalidadId ?? 0) === target);
                }

                // AF E1ulKugD: filtro por Número de seguimiento de la denuncia.
                if (filtroNumeroSeguimiento) {
                  const target = Number(filtroNumeroSeguimiento);
                  dataConEstados = dataConEstados.filter((d) => Number(d.numeroSeguimiento) === target);
                }

                // ✅ ORDENAR POR FECHA DESCENDENTE (más nueva primero)
                const dataOrdenada = dataConEstados.sort((a, b) => {
                  const fechaA = new Date(a.fecha || a.fechaEstado || '1900-01-01');
                  const fechaB = new Date(b.fecha || b.fechaEstado || '1900-01-01');
                  return fechaB - fechaA; // Descendente
                });
                
                //  ACTUALIZAR ESTADO FINAL
                setList((o) => ({ 
                  ...o, 
                  loading: null,
                  data: dataOrdenada,
                  pagination: { ...o.pagination, ...paginationInfo },
                  selection: { 
                    ...selectionDef,
                    record: o.onLoadSelect({ data: dataOrdenada, multi: false, record: o.selection.record })
                  }
                }));
          }
        },
        onError: (error) => {
          console.error(" Error cargando denuncias:", error);
          setList((o) => ({ 
            ...o, 
            loading: null,
            error: error,
            selection: { ...o.selection, ...selectionDef }
          }));
        }
      });
    }

   const queryParams = {};
  if (filtroEstado) queryParams.UltimoEstado = filtroEstado;
   if (filtroFechaDesde) queryParams.fechaDesde = filtroFechaDesde;
   if (filtroFechaHasta) queryParams.fechaHasta = filtroFechaHasta;
   if (filtroTipoIngresoId) queryParams.denunciaTipoIngresoId = filtroTipoIngresoId;
   if (filtroSituacionId) queryParams.denunciaSituacionId = filtroSituacionId;
   if (filtroDelegacionId && !filtroDerivadoATipo) {
     queryParams.DelegacionId = filtroDelegacionId;
   } else {
     if (filtroDerivadoATipo) queryParams.derivadoATipo = filtroDerivadoATipo;
     if (filtroDerivadoAId) queryParams.derivadoAId = filtroDerivadoAId;
     if (filtroDerivadoATipo === 'Seccional' && !filtroDerivadoAId && filtroDelegacionId) {
       queryParams.DelegacionId = filtroDelegacionId;
     }
   }

   cargarDenunciasConParametros(queryParams, null);
   return;

  // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
    pushQuery,
    list.loading,
    bloqueado,
    filtroEstado,
    filtroFechaDesde,
    filtroFechaHasta,
    usuarioAmbito,
    applyAmbitoFilter,
    filtroTipoIngresoId,
    filtroSituacionId,
    filtroDerivadoATipo,
    filtroDerivadoAId,
    filtroDelegacionId,
    filtroDelegacionOrigenId,
    filtroSeccionalOrigenId,
    seccionalOrigenMap,
    localidadOrigenMap,
    filtroLocalidadId,
    filtroNumeroSeguimiento,
  ]);

  //  ACTIVAR LOADING CUANDO CAMBIEN LOS FILTROS
  useEffect(() => {
    
    // Siempre activar loading y resetear a página 1 cuando cambien filtros
    setList((o) => ({
      ...o,
      loading: "Cargando...",
      pagination: { ...o.pagination, index: 1 } // Resetear a página 1
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [    filtroEstado,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroTipoIngresoId,
    filtroSituacionId,
    filtroDerivadoATipo,
    filtroDerivadoAId,
    filtroDelegacionId,
    filtroDelegacionOrigenId,
    filtroSeccionalOrigenId,
    seccionalOrigenMap,
    localidadOrigenMap,
    filtroLocalidadId,
    filtroNumeroSeguimiento,
  ]);

  const request = useCallback((type, payload = {}) => {
    if (type === "list") {
      setList((o) => {
        const changes = {
          loading: null,
          data: "data" in payload && Array.isArray(payload.data) ? [...payload.data] : payload.clear ? [] : o.data,
          loadingOverride: payload.loading,
          error: payload.error,
          onLoadSelect: "onLoadSelect" in payload ? payload.onLoadSelect : o.onLoadSelect,
        };

        if (payload.params) changes.params = { ...o.params, ...payload.params };
        if (payload.pagination) changes.pagination = { ...o.pagination, ...payload.pagination };

        if (payload.clear) {
          const data = changes.data;
          const record = o.selection.record;
          changes.selection = {
            ...o.selection,
            ...selectionDef,
            record: changes.onLoadSelect({ data, multi: false, record }),
          };
          changes.selection.index = data.indexOf(changes.selection.record);
        } else {
          changes.loading = "Cargando...";
        }

        return { ...o, ...changes };
      });
    }
  }, []);

  const render = () => {




    const pagination = {
      count: list.pagination.count || list.data.length,
      index: list.pagination.index,
      size: list.pagination.size,
      onChange: ({ index, size }) => {

        request("list", {
          pagination: { index, size }
        });
      },
    };

    return (
      <>
        <DenunciasTable
          remote={false}
          data={list.data}
          loading={!!list.loading}
          noDataIndication={
            list.loading ?? list.loadingOverride ?? list.error?.message ?? (hayFiltroActivo && list.data.length === 0 ? "No hay denuncias que coincidan con los filtros aplicados" : "No existen datos para mostrar")
          }
          columns={columns}
          pagination={pagination}
          selection={{
            mode: "radio",
            hideSelectColumn,
            selected: list.selection.record ? [list.selection.record.id] : [],
            onSelect: (record) => {
              const index = list.data.findIndex((r) => r.id === record.id);
              setList((o) => ({
                ...o,
                selection: {
                  ...o.selection,
                  ...selectionDef,
                  index,
                  record,
                },
              }));
            },
          }}
          onTableChange={(type, newState) => {
            if (type === "sort") {
              const { sortField, sortOrder } = newState;
              setList((o) => ({
                ...o,
                loading: "Cargando...",
                params: {
                  ...o.params,
                  sortBy: `${sortOrder === "desc" ? "-" : "+"}${sortField}`,
                },
              }));
            }
          }}
        />
        {list.selection.record && list.data.length > 0 && (
          <DenunciaDetails
            config={{
              data: list.selection.record,
              tab: "denuncia",
            }}
          />
        )}
      </>
    );
  };

  return { render, request, selected: list.selection.record, data: list.data, loading: !!list.loading };
};

export default useDenuncias;
