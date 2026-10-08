import React, { useCallback, useEffect, useState,useContext } from "react";
import useQueryQueue from "components/hooks/useQueryQueue";
import AutoridadesTable from "./AutoridadesTable";
import AutoridadesForm from "./AutoridadesForm";
import AuthContext from "../../../../../store/authContext";
import moment from "moment";
import { FormControlLabel, Switch } from "@mui/material";
import validarAutoridad, { validarAfiliadoAutoridad } from "./validarAutoridad";


const vigenteHasta = new Date(2099, 11, 31);
const vigenteDesde = new Date();

const selectionDef = {
	action: "",
	request: "",
	index: null,
	record: null,
	edit: null,
	errors: null,
};
 
const useAutoridades = () => {

	const Usuario = useContext(AuthContext).usuario;
	
	const [checked, setChecked] = React.useState(true);

	//#region Trato queries a APIs
 
	const pushQuery = useQueryQueue((action, params) => {
		//console.log('pushQuery_action',action);
		switch (action) {
			case "GetList": {
				return {
					config: {
						baseURL: "Afiliaciones",
						endpoint: `/SeccionalAutoridad/GetSeccionalAutoridadBySeccional`,
						method: "GET",
					},
				};
			}
			case "Create": {
				return {
					config: {
						baseURL: "Afiliaciones",
						endpoint: `/SeccionalAutoridad`,
						method: "POST",
					},
				};
			}
			case "Update": {
				return {
					config: {
						baseURL: "Afiliaciones",
						endpoint: `/SeccionalAutoridad`,
						method: "PUT",
					},
				};
			}
			case "Delete": {
				return {
					config: {
						baseURL: "Afiliaciones",
						endpoint: `/SeccionalAutoridad/DarDeBaja`,
						method: "PATCH",
					},
				};
			}
			case "Reactiva": {
				return {
					config: {
						baseURL: "Afiliaciones",
						endpoint: `/SeccionalAutoridad/Reactivar`,
						method: "PATCH",
					},
				};
			}
			case "GetAfiliado": {
				return {
					config: {
						baseURL: "Afiliaciones",
						method: "POST",
						endpoint: `/Afiliado/GetAfiliadosWithSpec`,
					},
				};
			} 
			case "GetAllCargos": {
				return {
					config: {
						baseURL: "Comunes",
						endpoint: "/RefCargo/GetAll",
						method: "GET",
					},
				};
			}
			default:
				return null;
		}
	});
	//#endregion

	//#region declaracion y carga list y selected
	const [list, setList] = useState({
		loading: null,
		params: {},
		cargos: [],
		data: [],
		error: null,
		selection: {...selectionDef},
	});

	useEffect(() => {
		if (!list.loading) return;
		pushQuery(
			{
			action: "GetList",
			params: {
				...list.params,
				SoloActivos: false
				//pageIndex: list.pagination.index,
				//pageSize: list.pagination.size,
			},
			onOk: async (data) =>
				setList((o) => {
					console.log('data_UseAutoridades:',data)
					const selection = {
						...selectionDef,
						record:
							data?.find((r) => r.id === o.selection.record?.id) ?? data?.at(0),
					};
					if (selection.record)
						selection.index = data.indexOf(selection.record);
					return {
						...o,
						loading: null,
						//pagination: { index, size, count },
						data: data.sort((a,b)=> a.refCargoJerarquia - b.refCargoJerarquia),
						error: null,
						selection,
					};
				}),
			onError: async (err) =>
				setList((o) => ({
					...o,
					loading: null,
					data: [],
					error: err.code === 404 ? null : err,
					selection: { ...selectionDef },
				})),
		});
	}, [pushQuery, list]);




	useEffect(() => {
		console.log('useAutoridades_list:',list);
		if (!list.loading) return;
		pushQuery({
			action: "GetAllCargos",

			onOk: async (data) =>
				setList((o) => {
					const cargos = data.map((refCargo) => {
						return { value: refCargo.id, label: refCargo.cargo };
					 });	

					//if (selection.cargos.length >= 1) selection.index = data.indexOf(selection.record);
					return {
						...o,
						loading: null,
						//pagination: { index, size, count },
						cargos,
						error: null,
					};
				}),
			onError: async (err) =>
				setList((o) => ({
					...o,
					loading: null,
					cargos: [],
					error: err.code === 404 ? null : err,
				})),
		});
	}, [pushQuery, list]);

	//#endregion

	const requestChanges = useCallback((type, payload = {}) => {
		
		switch (type) {
			case "selected": {
				return setList((o) => ({
					...o,
					selection: {
						...o.selection,
						request: payload.request,
						action: payload.action,
						edit: {
							...(payload.request === "A" ? {} : o.selection.record),
							...payload.record,
						},
					},
				}));
			}
			case "list": {
				if (payload.clear)
					return setList((o) => ({
						...o,
						loading: null,
						data: [],
						error: null,
						selection: {...selectionDef},
					}));
				return setList((o) => ({
					...o,
					loading: "Cargando...",
					params: { ...payload.params },
					data: [],
				}));
			}
			default:
				return;
		}
	}, []);

	let form = null;
	if (list.selection.edit) {
		form = (
			<AutoridadesForm
				///data={list.selection.edit}
				data={(() => { 
					//console.log('list.selection',list.selection)
					//INIT DE DATOS DEL FORM
					const data =
					//seccionalId = list.selection.edit.refSeccionalId,
					["A"].includes(list.selection.request) ?  //INIT PARA ALTA
						{
							fechaVigenciaDesde: list.selection.edit.fechaVigenciaDesde ?? vigenteDesde,
							fechaVigenciaHasta: list.selection.edit.fechaVigenciaHasta ?? vigenteHasta,							

						}:
						["B"].includes(list.selection.request) ? //INIT PARA BAJA
							{
								deletedDate: moment(vigenteDesde).format("YYYY-MM-DD"),
								deletedBy: Usuario.nombre,
							}:
							{}

						return {...list.selection.edit, ...data}; //le paso el registro entero  y modifico los campos necesarios segun el request que se está haciendo
					})()
				}
				cargos={list.cargos}
				title={list.selection.action}
				loading={list.loading}
				errors={list.selection.errors}
				disabled={(() => {


					const r = ["A", "M"].includes(list.selection.request)
						? { estado: true }
						: {
							afiliadoId	: true,
							afiliadoNombre	: true,
							afiliadoNumero	: true,
							createdBy	: true,
							createdDate	: true,
							deletedBy	: true,
							deletedDate	: true,
							fechaVigenciaDesde	: true,
							fechaVigenciaHasta	: true,
							id	: true,
							lastModifiedBy	: true,
							lastModifiedDate	: true,
							observaciones	: true,
							refCargosDescripcion	: true,
							refCargosId	: true,
							seccionalDescripcion	: true,
							seccionalId	: true,
	
						  };
					if (list.selection.request !== "B")
					
					r.deletedObs = true;
					r.deletedBy=true;
					r.deletedDate=true;

					return r;

				})()}
				hide={(() => {
					const r = ["A", "M"].includes(list.selection.request)
						? { deletedObs: true }
						: {};
					if (list.selection.request !== "R") r.obs = true;
					return r;
				})()}
				onChange={(edit) => { //solo entra el campo que se está editando
					const changes = { edit: { ...edit }, errors: {} };
					const authorityValidationFields = [
						"afiliadoNumero",
						"refCargosId",
						"fechaVigenciaDesde",
						"fechaVigenciaHasta",
					];
					if (Object.keys(edit).some((field) => authorityValidationFields.includes(field))) {
						authorityValidationFields.forEach((field) => {
							changes.errors[field] = "";
						});
					}
					const applyChanges = ({ edit, errors } = changes) =>
						setList((o) => ({
							...o,
							selection: {
								...o.selection,
								edit: { ...o.selection.edit, ...edit },
								errors: { ...o.selection.errors, ...errors },
							},
						}));
						//VALIDO EL NRO DEL AFILIADO
					//console.log('numero afil:',changes.edit.afiliadoNumero);
					if ("afiliadoNumero" in edit) {
						changes.edit.afiliadoId = 0;
						changes.edit.afiliadoValidado = false;
						changes.errors.afiliadoNumero = "";

						if (changes.edit.afiliadoNumero >= 1) {
							changes.errors.afiliadoNombre = "";
							changes.edit.afiliadoId = 0;
						    changes.edit.afiliadoNombre = "";
							changes.errors.afiliadoNombre = "Cargando...";
						}else{ changes.errors.afiliadoNombre = ""; }
							applyChanges();
						

						if (changes.errors.afiliadoNombre === "Cargando...") {
							pushQuery({
								action: "GetAfiliado",
								config:{
									body:{
										nroAfiliado:changes.edit.afiliadoNumero,
										ambitoTodos: Usuario.ambitoTodos,
										ambitoSeccionales: Usuario.ambitoSeccionales,
										ambitoDelegaciones: Usuario.ambitoDelegaciones,
										ambitoProvincias: Usuario.ambitoProvincias,	
									}
								},
								onOk: async (ok) => {
									const affiliate = ok?.data?.[0];
									const authoritySeccionalId =
										list.params.seccionalId ?? changes.edit.seccionalId;
									const validationError = validarAfiliadoAutoridad(
										affiliate,
										authoritySeccionalId
									);
									changes.edit.afiliadoId = validationError ? 0 : affiliate.id;
									changes.edit.afiliadoValidado = !validationError;
									changes.edit.afiliadoNombre = affiliate?.nombre ?? "Afiliado no disponible";
									changes.errors.afiliadoNumero = validationError;
									changes.errors.afiliadoNombre = '';
									
									//changes.errors.afiliadoNombre = "";
								},
								onError: async (error) => {
									changes.edit.afiliadoId = 0;
									changes.edit.afiliadoValidado = false;
									changes.errors.afiliadoNumero =
										error.message ?? "Error obteniendo datos del afiliado";
									changes.errors.afiliadoNombre = "";
								},
								onFinally: async () => applyChanges(),
							});
						}
					} else {
						if (Object.keys(edit).length) {
							Object.keys(edit).forEach((field) => {
								changes.errors[field] = "";
							});
						}
						applyChanges();
					}
				}}
				onClose={(confirm) => {
					if (!["A", "B", "M", "R"].includes(list.selection.request))
						confirm = false;
					if (!confirm) {
						setList((o) => ({
							...o,
							selection: {
								...selectionDef,
								index: o.selection.index,
								record: o.data.at(o.selection.index),
							},
						}));
						return;
					}

					const record = list.selection.edit;

					console.log('useAutoridades_onClose_record',record);
					//Validaciones
					const errors = {};
					if (list.selection.request === "B") {
						if (!record.deletedObs)
						 	errors.deletedObs = "Dato requerido";
					} else {
						if (record.afiliadoId === 0) errors.afiliadoNumero = "Debe ingresar afiliado valido";
						if (!record.afiliadoId) errors.afiliadoNumero = "Debe VALIDAR el afiliado";
						if (record.afiliadoValidado === false && !errors.afiliadoNumero) {
							errors.afiliadoNumero = "Debe VALIDAR el afiliado";
						}
						if (!record.afiliadoNumero) errors.afiliadoNumero = "Debe ingresar un Numero de Afiliado existente";
						if (!record.refCargosId) errors.refCargosId = "Debe seleccionar un Cargo";
						Object.assign(
							errors,
							validarAutoridad({
								record,
								authorities: list.data,
								request: list.selection.request,
							})
						);
					}


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

					const query = {
						config: {},
						onOk: (res) =>
							setList((old) => ({ ...old, loading: "Cargando..." })),
								onError: (err) => {
										const serverMessage =
										typeof err?.message === "string"
											? err.message
											: "No se pudo guardar la autoridad";
										const message = `Respuesta del servidor (HTTP ${err?.code ?? "desconocido"}): ${serverMessage}`;
										const source = `${err?.data?.field ?? ""} ${serverMessage}`.toLowerCase();
									const field = source.includes("cargo") || source.includes("refcargos")
										? "refCargosId"
										: source.includes("afiliado")
											? "afiliadoNumero"
											: source.includes("desde")
												? "fechaVigenciaDesde"
												: source.includes("hasta")
													? "fechaVigenciaHasta"
													: null;

									if (field) {
										setList((old) => ({
											...old,
											selection: {
												...old.selection,
												errors: { ...old.selection.errors, [field]: message },
											},
										}));
									} else {
										alert(message);
									}
								},
					};


					switch (list.selection.request) {
						case "A":
							query.action = "Create";
							query.config.body = record;
							break;
						case "M":
							query.action = "Update";
							//query.params = { id: record.id };
							query.config.body = {
								id: record.id,
								seccionalId: record.seccionalId,
								afiliadoId: record.afiliadoId,
								refCargosId: record.refCargosId,
								observaciones: record.observaciones,
								fechaVigenciaDesde: record.fechaVigenciaDesde,
								fechaVigenciaHasta: record.fechaVigenciaHasta,
							}	
							break;
						case "B":
							query.action = "Delete";
							//query.params = { id: record.id };
							query.config.body = { id: record.id, deletedObs: record.deletedObs };
							break;
						case "R":
							query.action = "Reactiva";
							//query.params = { id: record.id };
							query.config.body = { id: record.id }
							break; 
						default:
							break;
					}

//					console.log('query',query);
					pushQuery(query);

				}}
			/>
		);
	}

	const handleChange = (event) => {
	  setChecked(event.target.checked);
	  setList((o) => ({
		...o,
		loading: "Cargando...",
		params: { ...list.params, soloVigentes: event.target.checked },
		data: [],
	}));
	};
	

	const render = () => (
		<div>
			<FormControlLabel className="position-absolute" style={{marginTop: '-2.5em'}}
				control={
				<Switch checked={checked} onChange={handleChange} label="Solo vigentes" />
				}
				label="Solo vigentes"
			/>
			<AutoridadesTable
				data={list.data}
				loading={!!list.loading}
				noDataIndication={
					list.loading ?? list.error?.message ?? "No existen datos para mostrar"
				}
				pagination={{
					...list.pagination,
					onChange: ({ index, size }) =>
						setList((o) => ({
							...o,
							loading: "Cargando...",
							pagination: { index, size },
							data: [],
						})),
				}}
				selection={{
					selected: [list.selection.record?.id].filter((r) => r),
					onSelect: (record, isSelect, index, e) =>
						setList((o) => ({
							...o,
							selection: {
								...selectionDef,
								index,
								record,
							},
						})),
				}}
			/>
			{form}
		</div>
	);

	return [render, requestChanges, list.selection.record];
};

export default useAutoridades;
