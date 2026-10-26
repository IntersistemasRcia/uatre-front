import React, { useEffect, useState } from "react";
import Formato from "components/helpers/Formato";
import Grid from "components/ui/Grid/Grid";
import IM from "components/ui/Input/InputMaterial";
import styles from "./RelevamientoDetails.module.css";
import { cargoInspector } from "../relevamientoFormatters";

/** @type {IM} */
const InputMaterial = (p) => <IM variant="standard" size="small" {...p} />;

const RelevamientoDetails = (props) => {
 
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
							<Grid>Identificacion del Responsable de Relevamiento:</Grid>
							
						</Grid>
						<Grid className={styles.grupo} col full>
							<Grid className={styles.contenido} gap="1rem">
								<Grid className={styles.label}>Indentificacion de Acta:</Grid>
								<Grid width>
									<InputMaterial label="Nro.Acta" width="10rem" value={validar(data.actaMinisterio)}/>
									<InputMaterial label="Renatre Nro.Acta" width="10rem" value={validar(!data.actaRenatre ? "-" : data.actaRenatre)}/>
									<InputMaterial label="DE RENATRE Apellido y Nombre" width="15rem" value={validar(data.inspectorRenatre)}/>
									<InputMaterial label="Dni" width="10rem" value={validar(Formato.DNI(data.inspectorRenatreDNI))} />
									{/* <InputMaterial label="Fecha de carga" width="8rem" value={validar(data.createdDate)}/> */}
									<InputMaterial label="DE UATRE Apellido y Nombre" width="15rem" value={validar(!data.inspectorApellidoUATRE ? "-" : data.inspectorApellidoUATRE)}/>
									<Grid grow><InputMaterial label="Dni"  width="10rem" value={validar(Formato.DNI(data.inspectorDNI))}/></Grid>
									<Grid grow><InputMaterial label="Cargo"  width="10rem" value={cargoInspector(data.inspectorCargo)}/></Grid>
									
								</Grid>		
							</Grid>
						</Grid>
						<Grid className={styles.grupo} col full>
							<Grid className={styles.contenido} col>
								<Grid className={styles.titulo}>Realiza el Relevamiento con:</Grid>
								<Grid>
									<InputMaterial label="Renatre Nro.Acta"  value={validar(!data.actaRenatre ? "-" : data.actaRenatre)}/> 
									<InputMaterial label="Reservin Nro.Acta"  value={validar(!data.actaReservin ? "-" : data.actaReservin)}/> 													
									
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

export default RelevamientoDetails;
