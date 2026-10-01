import React, { useEffect } from "react";
import { Modal } from "react-bootstrap";
import Grid from "components/ui/Grid/Grid";
import Button from "components/ui/Button/Button";
import InputMaterial from "components/ui/Input/InputMaterial";
import CheckboxMaterial from "components/ui/Checkbox/CheckboxMaterial";
import UseKeyPress from "components/helpers/UseKeyPress";
import moment from "moment";
import classes from "./SeccionalesAutoridadesForm.module.css";
import SelectMaterial from "../../../../ui/Select/SelectMaterial";


const onChangeDef = (changes = {}) => {};
const onCloseDef = (confirm = false) => {};

const AutoridadesForm = ({
	data = {},
	title = "",
	disabled = {},
	hide = {},
	errors = {},
	cargos = [],
	loading = {},
	onChange = onChangeDef,
	onClose = onCloseDef,
}) => {
	data ??= {};
	cargos ??= [];

	disabled ??= {};
	hide ??= {};
	errors ??= {};

	onChange ??= onChangeDef;
	onClose ??= onCloseDef;

	const getValue = (v) => data[v] ?? "";

	useEffect(()=>{
		//format("YYYY-MM-DD")
		moment(getValue("fechaVigenciaDesde")).format("YYYY-MM-DD")
		onChange({fechaVigenciaDesde: moment(data.fechaVigenciaDesde).format("YYYY-MM-DD")});
		onChange({fechaVigenciaHasta: moment(data.fechaVigenciaHasta).format("YYYY-MM-DD")});
	},[]);

	const selectedCargo = (cargoId) =>{
		const cargo = cargos.find((c) => c.value === cargoId)
		return cargo;
	}

	UseKeyPress(["Escape"], () => onClose());
	UseKeyPress(["Enter"], () => onClose(true), "AltKey");

	return (
		<Modal size="lg" centered show >
			<Modal.Header closeButton>{title}</Modal.Header>
			<Modal.Body>
				<div className={classes.renglon}>
					<div className={classes.input33}>
					<InputMaterial
						id="afiliadoNumero"
						disabled={disabled.afiliadoNumero}
						value={getValue("afiliadoNumero")}
						error={!!errors.afiliadoNumero}
						helperText={errors.afiliadoNumero ?? ""}
						label="Numero Afiliado"
						onChange={(afiliadoNumero)=>onChange({afiliadoNumero})}
					/>
					</div>
					<Button id="validarAfiliadoNumero" className="botonAmarillo" width={20} onClick={()=>onChange({afiliadoNumero: getValue("afiliadoNumero")})}> {/*darle funcionalidad*/}
						Valida
					</Button>
					<div className={classes.input}>
						<InputMaterial
							id="afiliadoNombre"
							disabled={disabled.afiliadoNombre}
							value={ getValue("afiliadoNombre")}
							error={!!errors.afiliadoNombre}
							helperText={errors.afiliadoNombre ?? ""}
							label="Nombre"
							readOnly={true}
						/>
					</div>
				</div>
				<div className={classes.renglon}>
					<div className={classes.input}>
					<InputMaterial
						id="fechaVigenciaDesde"
						disabled={disabled.fechaVigenciaDesde}
						value={moment(getValue("fechaVigenciaDesde")).format("YYYY-MM-DD")}
						error={errors.fechaVigenciaDesde ?? false}
						helperText={errors.fechaVigenciaDesde ?? ""}
						label="Vigencia Desde"
						onChange={(fechaVigenciaDesde)=>onChange({fechaVigenciaDesde})}
						type="date"
					/>
					</div>
					<div className={classes.input}>
					<InputMaterial
						id="fechaVigenciaHasta"
						disabled={disabled.fechaVigenciaHasta}
						value={moment(getValue("fechaVigenciaHasta")).format("YYYY-MM-DD")}
						error={errors.fechaVigenciaHasta ?? false}
						helperText={errors.fechaVigenciaHasta ?? ""}
						label="Vigencia Hasta"
						onChange={(fechaVigenciaHasta)=>onChange({fechaVigenciaHasta})}
						type="date"
					/>
					</div>
					<div className={classes.input}>

						<SelectMaterial
							id="refCargosId"
							name="refCargosId"
							label="Cargo"
							error={errors.refCargosId ?? false}
							helperText={errors.refCargosId ?? ""}
							value={selectedCargo(data.refCargosId)?.value}
							disabled={disabled.refCargosId}
							onChange={(value) => onChange({ refCargosId: value })}
							
							options={cargos}
							required
						/>
					</div>
				</div>
				<div className={classes.renglon}>
					<div className={classes.input100}>
					<InputMaterial
						id="observaciones"
						disabled={disabled.observaciones}
						value={getValue("observaciones")}
						error={!!errors.observaciones}
						helperText={errors.observaciones ?? ""}
						label="Observaciones"
						onChange={(observaciones)=>onChange({observaciones})}
					/>
					</div>
				</div>

				{!hide.deletedObs &&
					<>
					<div className={classes.renglon}>
						<div className={classes.item6}>
							<InputMaterial
							id="deletedDate"
							label="Fecha Baja"
							error={!!errors.deletedDate}
							helperText={errors.deletedDate ?? ""}
							value={getValue("deletedDate")}
							disabled={disabled.deletedDate ?? false}
							onChange={(value, _id) => onChange({ deletedDate: value })}
							/>
						</div>
						<div className={classes.item7}>
							<InputMaterial
							id="deletedBy"
							label="Usuario Baja"
							error={!!errors.deletedBy}
							helperText={errors.deletedBy ?? ""}
							value={getValue("deletedBy")}
							disabled={disabled.deletedBy ?? false}
							onChange={(value, _id) => onChange({ deletedBy: value })}
							/>
						</div>
					</div>
					<div className={classes.item8}>
						<InputMaterial 
						id="deletedObs"
						label="Observaciones Baja"
						error={!!errors.deletedObs}
						helperText={errors.deletedObs ?? ""}
						value={getValue("deletedObs")}
						disabled={disabled.deletedObs ?? false}
						onChange={(value, _id) => onChange({ deletedObs: value })}
						/>
					</div>
					</>
				}

			</Modal.Body>
			<Modal.Footer>
				<Button  width={25} loading={loading != null} className="botonAzul" onClick={() => onClose(true)}>
					CONFIRMA
				</Button>
				<Button width={25} className="botonAmarillo" onClick={() => onClose()}>
					CANCELA
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default AutoridadesForm;
