import React, { useEffect, useState } from "react";
import Formato from "components/helpers/Formato";
import Grid from "components/ui/Grid/Grid";
import IM from "components/ui/Input/InputMaterial";
import styles from "./TrabajadorDetails.module.css";
import { respuestaSiNo } from "../../relevamientoFormatters";

/** @type {IM} */
const InputMaterial = (p) => <IM variant="standard" size="small" {...p} />;

const TrabajadorDetails = (props) => {

	const config = props.config;
	const data = config.data ?? {};
	const tab = config.tab ?? 0;
	const [hotField, setHotField] = useState();
	const viveEnElLugar = String(data.viveEnElLugar ?? "").trim().toUpperCase() === "S";
	const condicionHabitacional = (value) => viveEnElLugar ? value : "";
	const respuestaHabitacionalSiNo = (value) => {
		const codigo = String(value ?? "").trim().toUpperCase();
		if (codigo === "S") return "SI";
		if (codigo === "N") return "NO";
		return "";
	};
	const estadoVivienda = (value) => ({ B: "BUENA", M: "MALA", A: "ACEPTABLE" }[String(value ?? "").trim().toUpperCase()] ?? "");


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
									
									<InputMaterial label="Registrado"  value={validar(String(data.registrado ?? "").toUpperCase() === "S" ? "SI" : "NO")}/>
									<InputMaterial label="Categorizado"  value={validar(String(data.bienCategorizado ?? "").toUpperCase() === "B" ? "BIEN" : String(data.bienCategorizado ?? "").toUpperCase() === "M" ? "MAL" : "NO")}/>
									<InputMaterial label="Equipamiento"  value={validar(String(data.equipamiento ?? "").toUpperCase() === "S" ? "SI" : "NO")}/>
									<InputMaterial label="Indumentaria"  value={validar(String(data.indumentariaTrab ?? "").toUpperCase() === "S" ? "SI" : "NO")}/> 
									{/* <InputMaterial label="Fecha de carga" width="8rem" value={validar(data.createdDate)}/> */}
									<InputMaterial label="Jornada Horario"  value={validar(data.jornadaHorarioDescripcion)}/>
									<InputMaterial label="Observaciones" value={validar(data.observacionesCondicionLaboral ?? data.observacionCondicionLaboral ?? "-")}/>

								</Grid>		
							</Grid>
						</Grid>
						{/* ----------------------------------------- */}
						<Grid className={`${styles.contenido} ${styles.titulo}`} gap="1rem">
							<Grid>Condiciones Habitacionales del Trabajador:</Grid>
							
						</Grid>
						<Grid className={styles.grupo} col full>
							{/* Primera fila */}
							<Grid className={styles.contenido} gap="1rem"> 
								<Grid width> 
									<InputMaterial label="¿Vive en el lugar?" value={validar(respuestaSiNo(data.viveEnElLugar))}/>
									<InputMaterial label="EstadoVivienda" value={validar(condicionHabitacional(estadoVivienda(data.estadoVivienda)))}/>
									<InputMaterial label="CantidadIntegrantes" value={validar(condicionHabitacional(data.cantidadIntegrantesVivienda))}/>
									<InputMaterial label="Electricidad" value={validar(condicionHabitacional(respuestaHabitacionalSiNo(data.serviciosElectricidad)))}/>
									<InputMaterial label="Gas" value={validar(condicionHabitacional(respuestaHabitacionalSiNo(data.serviciosGas)))}/>
									<InputMaterial label="Agua Potable" value={validar(condicionHabitacional(respuestaHabitacionalSiNo(data.serviciosAguaPotable)))}/>
									<InputMaterial label="Internet" value={validar(condicionHabitacional(respuestaHabitacionalSiNo(data.serviciosInternet)))}/>
								</Grid>
							</Grid>

							{/* Segunda fila */}
							<Grid className={styles.contenido} gap="1rem">
							<Grid width>
							<InputMaterial 
								label="Pareja" 
								value={condicionHabitacional(
									(() => {
										if (String(data.pareja ?? "").toUpperCase() === "S") {
											if (String(data.parejaTrabaja ?? "").toUpperCase() === "S") {
												return validar("SI - Trabaja (SI) - Permite(Si)");
											} else {
												return validar("SI - Trabaja (NO)");
											}
										} else {
											return validar("NO");
										}
									})()
								)}
								title={viveEnElLugar ? `${String(data.pareja ?? "").toUpperCase() === "S" ? "SI" : "NO"} - ${String(data.pareja ?? "").toUpperCase() === "S" ? (String(data.parejaTrabaja ?? "").toUpperCase() === "S" ? "Trabaja (SI) - Permite la opción de ir a identificar y condición laboral de pareja" : "Trabaja (NO)") : ""}` : ""}
							/>
									<InputMaterial 
										label="Hijos" 
									value={condicionHabitacional(
											(() => {
												let texto = "";
												
												if (String(data.hijos ?? "").toUpperCase() === "S") {
													texto = "SI - Mayores (";

													// Verificar HijosMayores
													if (String(data.hijosMayores ?? "").toUpperCase() === "S") {
														texto += "SI) - Trabajan (";

												// Verificar HijosMayoresTrabajan
												if (String(data.hijosMayoresTrabajan ?? "").toUpperCase() === "S") {
													texto += "SI) - Permite(Si)";
												} else {
													texto += "NO)";
												}
											} else if (String(data.hijosMayores ?? "").toUpperCase() === "N") {
											texto += "NO) - Escolarizados (";														// Verificar HijosMenoresEscolarizados
													if (String(data.hijosMenoresEscolarizados ?? "").toUpperCase() === "S") {
														texto += "SI)";
													} else {
														texto += "NO)";
													}
												}
											} else {
												texto = "NO";
											}
											
										return validar(texto);
										})()
									)}
									title={viveEnElLugar ?
											(() => {
												let texto = "";
												
												if (String(data.hijos ?? "").toUpperCase() === "S") {
													texto = "SI - Mayores (";

												if (String(data.hijosMayores ?? "").toUpperCase() === "S") {
													texto += "SI) - Trabajan (";

													if (String(data.hijosMayoresTrabajan ?? "").toUpperCase() === "S") {
														texto += "SI) - Permite la opción de ir a identificar y condición laboral de los hijos";
													} else {
														texto += "NO)";
													}
												} else if (String(data.hijosMayores ?? "").toUpperCase() === "N") {
													texto += "NO) - Escolarizados (";

													if (String(data.hijosMenoresEscolarizados ?? "").toUpperCase() === "S") {
														texto += "SI)";
													} else {
														texto += "NO)";
													}
												}
												} else {
													texto = "NO";
												}
												
												return texto;
										})() : ""}
							/>
								<InputMaterial label="Observaciones" value={validar(condicionHabitacional(data.observacionesCondicionHabitacional || ""))}/>
							</Grid>
						</Grid>
					</Grid>					</Grid>
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

export default TrabajadorDetails;
