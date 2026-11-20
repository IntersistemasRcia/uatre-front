import React, { useEffect, useState } from "react";
import Formato from "components/helpers/Formato";
import Grid from "components/ui/Grid/Grid";
import IM from "components/ui/Input/InputMaterial";
import styles from "./EstablecimientoDetails.module.css";
import { respuestaAccesibilidad } from "../../relevamientoFormatters";

/** @type {IM} */
const InputMaterial = (p) => <IM variant="standard" size="small" {...p} />;

const EstablecimientoDetails = (props) => {

	console.log("config",props.config)
	const config = props.config;
	const data = config.data ?? {};
	const tab = config.tab ?? 0;
	const [hotField, setHotField] = useState();


	const _ = require('lodash');
 
	const validar = (value) =>{

		
		if (value === "Empresa no existente") return "EMPRESA NO REGISTRADA";

		if (!value) return "";

		if (_.includes(value, "-") && _.includes(value, ":")){ //SI ES UNA FECHA
			return Formato.Fecha(value);
		}

		if (_.isString(value)){
			if (value.trim() === "") {
				return " ";
			} else return value;
		} 
 
		return value;

	}

	useEffect(() => {
		switch (tab) {
			case 0:
				//#region  Tab 0 AFILIADOS
				setHotField(
					<Grid className={`${styles.fondo} ${styles.grupo}`} col>
						<Grid className={`${styles.contenido} ${styles.titulo}`} gap="1rem">
							<Grid>Condicion Laboral:</Grid>
							
						</Grid>
						<Grid className={styles.grupo} col full>
							<Grid className={styles.contenido} gap="1rem">
							
								<Grid width>
									
									<InputMaterial label="Botiquin"  value={validar(data.establecimientoBotiquin === "S" ? "SI" : "NO")}/>
									<InputMaterial label="Baño"  value={validar(
										data.establecimientoBanos === "S" 
											? `SI - ${data.establecimientoBanosUbicacion === "A" ? "Afuera" : data.establecimientoBanosUbicacion === "D" ? "Adentro" : ""}` 
											: "NO"
									)}/>
									<InputMaterial label="Accesibilidad" value={respuestaAccesibilidad(data.establecimientoAreaDescansoEquipada)}/>
									<InputMaterial label="Electricidad"  value={validar(
										data.establecimientoServiciosElectricidad === "S" 
											? `SI - ${data.establecimientoServiciosElectricidadTipo === "S" ? "Genset" : data.establecimientoServiciosElectricidadTipo === "N" ? "De red" : ""}` 
											: "NO"
									)}/>
									<InputMaterial label="Gas"  value={validar(
										`${data.establecimientoServiciosGas === "S" ? "SI" : "NO"} - ${data.establecimientoServiciosGasTipo === "X" ? "Garrafa" : "De red"}`
									)}/>
									{/* <InputMaterial label="Fecha de carga" width="8rem" value={validar(data.createdDate)}/> */}
									<InputMaterial label="Agua Potable"  value={validar(data.establecimientoServiciosAguaPotable === "S" ? "SI" : "NO")}/>
									<InputMaterial label="Internet"   value={validar(data.establecimientoServiciosInternet === "S" ? "SI" : "NO")}/>

								</Grid>		
							</Grid>
						</Grid>
						
					</Grid>
				);
				//#endregion
				break;
	
			default:
				setHotField()
			  break;
		}
	}, [config ]);

	
	return (
		<>
			{hotField}
		</>

	);
};

export default EstablecimientoDetails;
