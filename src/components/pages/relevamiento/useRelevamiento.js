import React, { useCallback, useEffect, useState, useContext } from "react";
import dayjs from "dayjs";
import AsArray from "components/helpers/AsArray";
import JoinOjects from "components/helpers/JoinObjects";
import useQueryQueue from "components/hooks/useQueryQueue";
import AuthContext from "store/authContext";
import RelevamientoTable from "./RelevamientoTable";
import EncuestasForm from "./RelevamientoForm";
import RelevamientoDetails from "./detallesRelevamiento/RelevamientoDetails";

const selectionDef = {
  action: "",
  request: "",
  index: null,
  record: null,
  edit: null,
  errors: null,
};

export const onLoadSelectFirst = ({ data, multi }) => {
  const dataArray = AsArray(data);
  if (multi) return dataArray.length ? [dataArray[0]] : null;
  return dataArray.length ? dataArray[0] : null;
};

export const onLoadSelectSame = ({ data, multi, record }) => {
  const dataArray = AsArray(data);
  if (multi) {
    record = AsArray(record);
    let retorno = dataArray.filter((d) => record.find((r) => r.id === d.id));
    return retorno.length ? retorno : null;
  }
  return dataArray.find((r) => r.id === record?.id) ?? dataArray.at(0);
};

export const onLoadSelectKeep = ({ record }) => record;
export const onLoadSelectKeepOrFirst = ({ data, multi, record }) =>
  record ?? onLoadSelectFirst({ data, multi, record });

export const onDataChangeDef = (data = []) => {};
const onEditChangeDef = ({ edit = {}, changes = {}, request = "" } = {}) => true;
const onEditValidateDef = ({ edit = {}, errors = {}, request = "" } = {}) => {};
const onEditCompleteDef = ({ edit = {}, response = null, request = "" } = {}) => {};

const normalizeSearch = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

const matchesEmployer = (record, value) => {
  const search = normalizeSearch(value);
  if (!search) return true;

  const razonSocial = normalizeSearch(
    record?.establecimientoRazonSocial ??
      record?.EstablecimientoRazonSocial ??
      record?.establecimientoNombre ??
      record?.EstablecimientoNombre
  );
  const searchDigits = digitsOnly(value);
  const cuit = digitsOnly(
    record?.establecimientoCUIT ??
      record?.EstablecimientoCUIT ??
      record?.establecimientoCuit ??
      record?.EstablecimientoCuit
  );

  return razonSocial.includes(search) || (searchDigits.length > 0 && cuit.includes(searchDigits));
};

const useRelevamiento = ({
  remote: remoteInit = true,
  data: dataInit = [],
  loading,
  error,
  multi: multiInit = false,
  params: paramsInit = {
    sort: "-fecha",
    soloActivos: false,
  },
  onLoadSelect: onLoadSelectInit = onLoadSelectFirst,
  onDataChange: onDataChangeInit = onDataChangeDef,
  onEditChange: onEditChangeInit = onEditChangeDef,
  onEditValidate: onEditValidateInit = onEditValidateDef,
  onEditComplete: onEditCompleteInit = onEditCompleteDef,
  columns,
  hideSelectColumn = true,
  mostrarBuscar = false,
  filtroEstado = null,
  renderExtraActions = null,
} = {}) => {
  const Usuario = useContext(AuthContext).usuario;

  const pushQuery = useQueryQueue((action) => {
    switch (action) {
      case "GetList": {
        return {
          config: {
            baseURL: "App",
            endpoint: `/Fiscalizaciones`,
            method: "GET",
          },
        };
      }
      default:
        return null;
    }
  });

  const fetchingRef = React.useRef(false);

  const [list, setList] = useState({
    loading: "Cargando...",
    remote: remoteInit,
    loadingOverride: loading,
    params: { ...paramsInit, filtro: "" },
    paramsDef: {
      ambitoTodos: Usuario.ambitoTodos,
      ambitoProvincias: Usuario.ambitoProvincias,
      ambitoDelegaciones: Usuario.ambitoDelegaciones,
      ambitoSeccionales: Usuario.ambitoSeccionales,
    },
    delegaciones: [],
    pagination: { index: 1, size: 10 },
    data: [...AsArray(dataInit, true)],
    allData: [...AsArray(dataInit, true)],
    error,
    selection: {
      ...selectionDef,
      multi: multiInit,
    },
    onLoadSelect: onLoadSelectInit === onLoadSelectFirst && multiInit ? onLoadSelectSame : onLoadSelectInit,
    onDataChange: onDataChangeInit ?? onDataChangeDef,
    onEditChange: onEditChangeInit ?? onEditChangeDef,
    onEditValidate: onEditValidateInit ?? onEditValidateDef,
    onEditComplete: onEditCompleteInit ?? onEditCompleteDef,
  });


  useEffect(() => {
    if (!list.loading) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!list.remote) {
      const data = list.data;
      const multi = list.selection.multi;
      const record = list.selection.record;
      const selection = {
        ...list.selection,
        ...selectionDef,
        record: list.onLoadSelect({ data, multi, record }),
      };
      selection.index = multi
        ? selection.record?.map((r) => data.indexOf(r))
        : data.indexOf(selection.record);
      fetchingRef.current = false;
      setList((o) => ({ ...o, loading: null, allData: data, selection }));
      return;
    }

    // Se cargan todos los bloques para que el filtro local por CUIT/nombre
    // pueda buscar sobre el conjunto completo de inspecciones.
    const pageSizeRequest = 100;
    const paramsApi = { ...list.paramsDef, ...list.params };
    const filtroEmpleador = String(paramsApi.filtroEmpleador ?? "").trim();
    delete paramsApi.filtroEmpleador;
    delete paramsApi.filtro;

    const accumulated = [];
    let finished = false;

    const finish = ({ data = [], pagination = {}, error: requestError = null } = {}) => {
      if (finished) return;
      finished = true;
      const filtered = filtroEmpleador
        ? data.filter((record) => matchesEmployer(record, filtroEmpleador))
        : data;
      const pageSize = Number(list.pagination.size) || 10;
      const requestedIndex = Number(list.pagination.index) || 1;
      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const index = Math.min(requestedIndex, pages);
      const start = (index - 1) * pageSize;
      const pageData = filtered.slice(start, start + pageSize);
      const multi = list.selection.multi;
      const record = list.selection.record;
      const selection = {
        ...list.selection,
        ...selectionDef,
        record: list.onLoadSelect({ data: pageData, multi, record }),
      };
      selection.index = multi
        ? selection.record?.map((r) => pageData.indexOf(r))
        : pageData.indexOf(selection.record);

      list.onDataChange(pageData);
      fetchingRef.current = false;
      setList((o) => ({
        ...o,
        loading: null,
        error: requestError,
        data: pageData,
        allData: filtered,
        pagination: {
          ...o.pagination,
          ...pagination,
          index,
          size: pageSize,
          count: filtered.length,
          total: filtered.length,
          pages,
        },
        selection,
      }));
    };

    const loadPage = (pageIndex) => {
      pushQuery({
        action: "GetList",
        params: {
          ...paramsApi,
          pageIndex,
          pageSize: pageSizeRequest,
        },
        onOk: async (response) => {
          const responseData = Array.isArray(response) ? response : response?.data;
          if (!Array.isArray(responseData)) {
            finish({ error: new Error("Respuesta inválida del endpoint Fiscalizaciones") });
            return;
          }
          accumulated.push(...responseData);

          const total = Number(response?.total ?? response?.totalCount ?? response?.count ?? 0);
          const responseSize = Number(response?.size ?? response?.pageSize ?? pageSizeRequest) || pageSizeRequest;
          const serverPages = Number(response?.pages ?? response?.pageCount ?? 0);
          const totalPages = serverPages || (total > 0 ? Math.ceil(total / responseSize) : responseData.length < responseSize ? pageIndex : pageIndex + 1);

          if (pageIndex < totalPages && responseData.length > 0) {
            loadPage(pageIndex + 1);
            return;
          }

          finish({
            data: accumulated,
            pagination: {
              count: accumulated.length,
              total: accumulated.length,
              pages: Math.max(1, Math.ceil(accumulated.length / (Number(list.pagination.size) || 10))),
            },
          });
        },
        onError: async (requestError) => finish({ error: requestError }),
      });
    };

    loadPage(1);
  }, [pushQuery, list]);

  // ====== Datos visibles en la tabla ======
  const visibleData = React.useMemo(() => {
    const base = filtroEstado ? filtroEstado([...list.allData]) : [...list.allData];
    const size = Number(list.pagination.size) || 10;
    const index = Number(list.pagination.index) || 1;
    const start = (index - 1) * size;
    return base.slice(start, start + size);
  }, [list.allData, list.pagination.index, list.pagination.size, filtroEstado]);

  // ====== Asegurar que el PRIMER visible quede seleccionado ======
  useEffect(() => {
    if (list.loading) return; // no tocar mientras está cargando
    if (list.selection.multi) return;
    const currentId = list.selection.record?.id;
    const isCurrentVisible = currentId && visibleData.some((r) => r.id === currentId);
    const first = visibleData[0] ?? null;

    // Si no hay seleccionado, o lo seleccionado ya no está visible -> selecciono el primero visible
    if (!isCurrentVisible) {
      setList((o) => ({
        ...o,
        selection: {
          ...o.selection,
          ...selectionDef,
          index: first ? o.data.indexOf(first) : null,
          record: first,
        },
      }));
    }
  }, [visibleData, list.loading, list.selection.multi, list.selection.record?.id]);

  // ================= RENDER =================
  // (igual que antes, pero usando visibleData para no recalcular)
  const request = useCallback((type, payload = {}) => {
    switch (type) {
      case "selected": {
        return setList((o) => {
          const apply = [];
          if (payload.request !== "A") {
            apply.push(
              ...AsArray("record" in payload ? payload.record : o.selection.record, true)
                .map(({ id }) => id)
                .filter((r) => r)
            );
          }
          return {
            ...o,
            selection: {
              ...o.selection,
              request: payload.request,
              action: payload.action,
              edit: {
                ...(payload.request === "A" ? {} : JoinOjects(o.selection.record)),
                ...JoinOjects(payload.record),
              },
              apply,
            },
          };
        });
      }
      case "list": {
        return setList((o) => {
          const nextParams = payload.replaceParams
            ? { ...paramsInit, ...(payload.params || {}) }
            : { ...o.params, ...(payload.params || {}) };
          const changes = {
            loading: null,
            data:
              "data" in payload && Array.isArray(payload.data)
                ? [...payload.data]
                : payload.clear
                ? []
                : o.data,
            allData:
              "data" in payload && Array.isArray(payload.data)
                ? [...payload.data]
                : payload.clear
                ? []
                : o.allData,
            loadingOverride: payload.loading,
            error: payload.error,
            onLoadSelect: "onLoadSelect" in payload ? payload.onLoadSelect : o.onLoadSelect,
            selection: {
              ...o.selection,
              multi: "multi" in payload ? !!payload.multi : o.selection.multi,
            },
          };
          if (payload.params || payload.replaceParams) changes.params = nextParams;
          if (payload.pagination) changes.pagination = { ...o.pagination, ...payload.pagination };
          if (payload.clear) {
            const data = changes.data;
            const multi = changes.selection.multi;
            const record = o.selection.record;
            changes.selection = {
              ...o.selection,
              ...selectionDef,
              record: changes.onLoadSelect({ data, multi, record }),
            };
            changes.selection.index = multi
              ? changes.selection.record?.map((r) => changes.data.indexOf(r))
              : changes.data.indexOf(changes.selection.record);
          } else {
            changes.loading = "Cargando...";
          }
          return { ...o, ...changes };
        });
      }
      default:
        return;
    }
  }, []);

  let form = null;
  if (list.selection.edit) {
    form = (
      <EncuestasForm
        request={list.selection.request}
        data={(() => {
          var data =
            list.selection.request === "C"
              ? {
                  deletedDate: dayjs().format("DD-MM-YYYY"),
                  deletedBy: Usuario.nombre,
                }
              : {};
          return { ...list.selection.edit, ...data };
        })()}
        title={list.selection.action}
        errors={list.selection.errors}
        loading={!!list.loading}
        disabled={(() => {
          const r = ["C"].includes(list.selection.request)
            ? {
                deletedDate: dayjs().format("DD-MM-YYYY"),
                deletedBy: true,
                tema: true,
                fecha: true,
                fechaFinalizacion: true,
                observaciones: true,
              }
            : {};
          return r;
        })()}
        hide={
          list.selection.request === "C"
            ? {
                deletedObs: !list.selection.record?.deletedDate ? true : false,
                deletedBy: !list.selection.record?.deletedDate ? true : false,
                deletedDate: !list.selection.record?.deletedDate ? true : false,
              }
            : {}
        }
        onChange={(edit) => {
          if (
            !list.onEditChange({
              edit: { ...list.selection.edit },
              changes: edit,
              request: list.selection.request,
            })
          )
            return;
          const changes = { edit: { ...edit }, errors: {} };
          const applyChanges = ({ edit, errors } = changes) =>
            setList((o) => ({
              ...o,
              selection: {
                ...o.selection,
                edit: { ...o.selection.edit, ...edit },
                errors: { ...o.selection.errors, ...errors },
              },
            }));
          applyChanges();
        }}
        onClose={(confirm) => {
          if (!["C"].includes(list.selection.request)) {
            confirm = false;
          }
          if (!confirm) {
            setList((o) => ({
              ...o,
              selection: {
                ...o.selection,
                ...selectionDef,
                index: o.selection.index,
                record:
                  !o.selection.multi && o.selection.index > -1
                    ? o.data.at(o.selection.index)
                    : o.selection.record,
              },
            }));
            return;
          }
          const record = { ...list.selection.edit };
          const errors = {};
          list.onEditValidate({
            edit: record,
            errors,
            request: list.selection.request,
          });
          if (Object.keys(errors).length) {
            setList((o) => ({
              ...o,
              selection: {
                ...o.selection,
                errors,
              },
            }));
            return;
          }
          console.log("⚠️ Operación no soportada:", list.selection.request);
        }}
      />
    );
  }

  const render = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: "20px",
        padding: "20px",
      }}
    >
      <div style={{ flex: "0 0 auto", minHeight: "0" }}>
        <RelevamientoTable
          remote={list.remote}
          data={visibleData}
          loading={!!list.loading}
          noDataIndication={
            list.loading ?? list.loadingOverride ?? list.error?.message ?? "No existen datos para mostrar"
          }
          columns={columns}
          pagination={{
            ...list.pagination,
            count: filtroEstado ? filtroEstado([...list.allData]).length : list.allData.length,
            showSizeChanger: false,
            hideOnSinglePage: true,
            onChange: ({ index, size }) => {
              setList((o) => {
                const base = filtroEstado ? filtroEstado([...o.allData]) : [...o.allData];
                const start = (index - 1) * size;
                const pageData = base.slice(start, start + size);
                const selection = {
                  ...o.selection,
                  ...selectionDef,
                  record: o.onLoadSelect({ data: pageData, multi: o.selection.multi, record: o.selection.record }),
                };
                selection.index = o.selection.multi
                  ? selection.record?.map((r) => pageData.indexOf(r))
                  : pageData.indexOf(selection.record);
                return {
                  ...o,
                  data: pageData,
                  pagination: { ...o.pagination, index, size },
                  selection,
                };
              });
            },
          }}
          selection={{
            mode: list.selection.multi ? "checkbox" : "radio",
            hideSelectColumn: hideSelectColumn,
            selected: AsArray(list.selection.record, !list.selection.multi)
              .filter((r) => r)
              .map((r) => r.id),
            onSelect: (record, isSelect, rowIndex, e) => {
              if (rowIndex == null) return;
              setList((o) => {
                let index = o.data.findIndex((r) => r.id === record.id);
                if (o.selection.multi) {
                  const newIndex = [];
                  const newRecord = [];
                  o.selection.record?.forEach((r, i) => {
                    if (!isSelect && r.id === record.id) return;
                    newIndex.push(o.selection.index[i]);
                    newRecord.push(r);
                  });
                  if (isSelect && !newIndex.includes(index)) {
                    newIndex.push(index);
                    newRecord.push(record);
                  }
                  if (newIndex.length) {
                    index = newIndex;
                    record = newRecord;
                  } else {
                    index = null;
                    record = null;
                  }
                }
                return {
                  ...o,
                  selection: {
                    ...o.selection,
                    ...selectionDef,
                    index,
                    record,
                  },
                };
              });
            },
            onSelectAll: (isSelect, rows, e) => {
              if (!list.selection.multi) return;
              setList((o) => {
                let index = [];
                let record = [];
                if (isSelect) {
                  o.data.forEach((r, i) => {
                    record.push(r);
                    index.push(i);
                  });
                } else {
                  index = null;
                  record = null;
                }
                return {
                  ...o,
                  selection: {
                    ...o.selection,
                    ...selectionDef,
                    index,
                    record,
                  },
                };
              });
            },
          }}
          onTableChange={(type, newState) => {
            switch (type) {
              case "sort": {
                const { sortField, sortOrder } = newState;
                return setList((o) => ({
                  ...o,
                  loading: "Cargando...",
                  params: {
                    ...o.params,
                    sort: `${sortOrder === "desc" ? "-" : "+"}${{ descripcion: "nombre" }[sortField] ?? sortField}`,
                  },
                }));
              }
              default:
                return;
            }
          }}
        />
      </div>

      {list.selection.record && !list.selection.edit && (
        <div
          style={{
            flex: "0 1 auto",
            maxHeight: "60vh",
            minHeight: "300px",
            overflow: "auto",
            borderTop: "1px solid #e0e0e0",
            paddingTop: "auto",
          }}
        >
          <RelevamientoDetails
            config={{
              data: list.selection.record,
              tab: 0,
            }}
            loading={!!list.loading}
          />
          {renderExtraActions && (
            <div style={{ padding: "15px", textAlign: "center", borderTop: "1px solid #e0e0e0" }}>
              {renderExtraActions()}
            </div>
          )}
        </div>
      )}

      {form && (
        <div style={{ flex: "1", minHeight: "0", overflow: "auto" }}>
          {form}
        </div>
      )}
    </div>
  );

  return {
    render,
    request,
    selected: list.selection.record,
    list,
  };
};

export default useRelevamiento;
