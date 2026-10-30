import React, { useRef } from "react";
import Button from "../ui/Button/Button";
import Grid from "../ui/Grid/Grid";
import InputMaterial from "../ui/Input/InputMaterial";
import SelectMaterial from "../ui/Select/SelectMaterial";
// import InputMaterialMask from "../ui/Input/InputMaterialMask";

const DocumentacionForm = ({
	record = {},
	tipoList = [],
	disabled = false,
	loading = false,
	onChange = (changes) => {},
	onCancel = () => {},
	onConfirm = () => {},
	request,
}) => {

	const archivoRef = useRef(null);
	const [archivoCargando, setArchivoCargando] = React.useState(false);
	const [archivoProcesado, setArchivoProcesado] = React.useState(null);
	const [errors, setErrors] = React.useState({
		refTipoDocumentacionId: false,
		archivo: false,
	});

	React.useEffect(() => {
		setArchivoProcesado(null);
	}, [request]);

	const getValue = (v) => archivoProcesado?.[v] ?? record[v] ?? "";
	const getArchivoProcesado = () => {
		const archivo = getValue("archivo");
		const nombreArchivo = getValue("nombreArchivo");
		return archivo && nombreArchivo ? { archivo, nombreArchivo, contentType: getValue("contentType") } : null;
	};

	const tipoListData = tipoList.map((r) => ({
		value: r.id,
		label: r.descripcion,
	}));

	const procesarArchivo = (archivo, confirmarAlFinalizar = false) => {
		const reader = new FileReader();
		setArchivoCargando(true);
		reader.readAsDataURL(archivo);
		reader.onload = () => {
			const contenido = String(reader.result || "").replace(/^data:[^;]+;base64,/, "");
			if (!contenido) {
				setErrors((o) => ({ ...o, archivo: true }));
				setArchivoCargando(false);
				return;
			}

			const cambios = {
				archivo: contenido,
				nombreArchivo: archivo.name,
				contentType: archivo.type,
			};
			setArchivoProcesado(cambios);
			setErrors((o) => ({ ...o, archivo: false }));
			onChange(cambios);
			setArchivoCargando(false);
			if (confirmarAlFinalizar) onConfirm(cambios);
		};
		reader.onerror = () => {
			setErrors((o) => ({ ...o, archivo: true }));
			setArchivoCargando(false);
		};
	};

	const confirmaHandle = () => {
		if (getValue("refTipoDocumentacionId") === "") {
			setErrors((o) => ({
				...o,
				refTipoDocumentacionId: true,
			}));
			return;
		}

		const archivoProcesadoActual = getArchivoProcesado();
		if (request === 1 && !archivoProcesadoActual) {
			const archivoSeleccionado = archivoRef.current?.files?.[0];
			if (!archivoSeleccionado) {
				setErrors((o) => ({
					...o,
					archivo: true,
				}));
				return;
			}
			if (!archivoCargando) procesarArchivo(archivoSeleccionado, true);
			return;
		}
		onConfirm(archivoProcesadoActual ?? {})
	}

	return (
		<Grid col full gap="10px">
			<Grid full="width" gap="10px">
				<Grid width="50%">
					<SelectMaterial
						name="refTipoDocumentacionId"
						label="Tipo de documentacion"
						disabled={disabled}
						options={tipoListData}
						value={getValue("refTipoDocumentacionId")}
						defaultValue={tipoListData[0]}
						displayEmpty
						renderValue={(value) => value === "" || value == null
							? "Seleccioná un tipo de documentación"
							: tipoListData.find((tipo) => String(tipo.value) === String(value))?.label || "Seleccioná un tipo de documentación"}
						onChange={(v) =>
							(setErrors((o) => ({
								...o,
								refTipoDocumentacionId: false,
							})),
							 onChange({ refTipoDocumentacionId: v, refTipoDocumentacionDescripcion: tipoListData.find((r) => r.value === v)?.label }))
							}
						requered
						error={errors?.refTipoDocumentacionId ? "Dato Requerido" : ""}
						helperText={errors?.refTipoDocumentacionId ? "Dato Requerido" : ""}
					/>
				</Grid>
				<Grid grow>{getArchivoProcesado()?.nombreArchivo && <a download={getArchivoProcesado().nombreArchivo} href={`data:image/*;base64,${getArchivoProcesado().archivo}`}>{getArchivoProcesado().nombreArchivo}</a>}</Grid>
				<Grid width="150px">
					<input
						ref={archivoRef}
						type="file"
						hidden
						disabled={disabled}
						onChange={(e) => {
							setErrors((o) => ({
								...o,
								archivo: false,
							}));
							if (e.target.files.length === 0) return;
							const archivo = e.target.files[0];
							procesarArchivo(archivo);
						}}
						onClick={(e) => {
							e.target.value = null;
						}}
					/>
					
					<Button
						className="botonAmarillo"
						onClick={() => archivoRef.current?.click()}
						disabled={disabled || archivoCargando}
					>
						{archivoCargando ? "Procesando archivo..." : "Subir archivo"}
					</Button>
					
				</Grid>
				<div hidden={!errors?.archivo} style={{ color: "red" }}>Debe subir un archivo</div>
			</Grid> 
			<Grid full="width">
				{/* <InputMaterialMask
					id="observaciones"
					label="Observaciones"
					disabled={disabled}
					value={getValue("observaciones")}
					onChange={(v) => onChange({ observaciones: v })}
					width={100}
				/> */}
				<InputMaterial
					id="observaciones"
					label="Observaciones"
					disabled={disabled}
					value={getValue("observaciones")}
					onChange={(v) => onChange({ observaciones: v })}
					width={100}
				/>
			</Grid>
			<Grid full="width" justify="center" gap="50px">
				<Grid>
					<Button className="botonAmarillo" onClick={() => confirmaHandle()} disabled={disabled || archivoCargando}>
						{(() => {
							switch (request) {
								case 1:
									return "Agrega";
								case 2:
									return "Modifica";
								case 3:
									return "Borra";
								default:
									return "Confirma";
							}
						})()}
					</Button>
				</Grid>
				<Grid>
					<Button className="botonAmarillo" onClick={() => onCancel()} disabled={disabled}>
						Cancela
					</Button>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DocumentacionForm;

