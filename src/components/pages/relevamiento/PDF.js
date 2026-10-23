import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import Formato from "components/helpers/Formato";
import { cargoInspector, respuestaSiNo } from "./relevamientoFormatters";

// Estilos para el PDF
const styles = StyleSheet.create({
	page: {
		padding: 20,
		fontSize: 9,
		fontFamily: "Helvetica",
	},
	header: {
		marginBottom: 15,
		borderBottom: "2px solid #000",
		paddingBottom: 8,
	},
	title: {
		fontSize: 14,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 10,
		textAlign: "center",
		marginBottom: 3,
	},
	filtrosSection: {
		marginTop: 8,
		marginBottom: 10,
		padding: 5,
		backgroundColor: "#f0f0f0",
	},
	filtroText: {
		fontSize: 8,
		marginBottom: 2,
	},
	registroContainer: {
		marginBottom: 15,
		padding: 10,
		border: "1px solid #333",
		backgroundColor: "#fafafa",
	},
	registroHeader: {
		backgroundColor: "#4a90e2",
		color: "#fff",
		padding: 6,
		marginBottom: 8,
		fontSize: 10,
		fontWeight: "bold",
	},
	seccionTitulo: {
		fontSize: 9,
		fontWeight: "bold",
		backgroundColor: "#e0e0e0",
		padding: 4,
		marginTop: 6,
		marginBottom: 4,
	},
	detalleRow: {
		flexDirection: "row",
		marginBottom: 3,
		fontSize: 8,
	},
	detalleLabel: {
		width: "35%",
		fontWeight: "bold",
	},
	detalleValue: {
		width: "65%",
	},
	footer: {
		position: "absolute",
		bottom: 15,
		left: 20,
		right: 20,
		textAlign: "center",
		fontSize: 7,
		color: "#666",
		borderTop: "1px solid #ddd",
		paddingTop: 5,
	},
	pageNumber: {
		position: "absolute",
		bottom: 15,
		right: 20,
		fontSize: 7,
		color: "#666",
	},
});

const DetalleItem = ({ label, value }) => (
	<View style={styles.detalleRow}>
		<Text style={styles.detalleLabel}>{label}:</Text>
		<Text style={styles.detalleValue}>{value || "-"}</Text>
	</View>
);

const PDF = ({ data = [], filtros = {} }) => {
	const now = new Date();
	const fechaImpresion = Formato.Fecha(now);
	const horaImpresion = now.toLocaleTimeString("es-AR");

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Encabezado */}
				<View style={styles.header} fixed>
					<Text style={styles.title}>RELEVAMIENTO DE TRABAJADORES - REPORTE COMPLETO</Text>
					<Text style={styles.subtitle}>
						Fecha: {fechaImpresion} - Hora: {horaImpresion}
					</Text>
				</View>

				{/* Filtros aplicados */}
				{(filtros.delegacion || filtros.seccional || filtros.empleador || filtros.fechaDesde || filtros.fechaHasta) && (
					<View style={styles.filtrosSection}>
						<Text style={{ ...styles.filtroText, fontWeight: "bold" }}>Filtros aplicados:</Text>
						{filtros.delegacion && filtros.delegacion !== "Elige..." && (
							<Text style={styles.filtroText}>• Delegación: {filtros.delegacion}</Text>
						)}
						{filtros.seccional && filtros.seccional !== "Todas" && (
							<Text style={styles.filtroText}>• Seccional: {filtros.seccional}</Text>
						)}
						{filtros.empleador && (
							<Text style={styles.filtroText}>• Empleador: {filtros.empleador}</Text>
						)}
						{filtros.fechaDesde && (
							<Text style={styles.filtroText}>• Desde: {Formato.Fecha(filtros.fechaDesde)}</Text>
						)}
						{filtros.fechaHasta && (
							<Text style={styles.filtroText}>• Hasta: {Formato.Fecha(filtros.fechaHasta)}</Text>
						)}
					</View>
				)}

				{/* Registros detallados */}
				{data.map((item, index) => (
					<View key={index} style={styles.registroContainer} wrap={false}>
						<View style={styles.registroHeader}>
							<Text>
								Relevamiento #{item.id} - {item.fecha ? Formato.Fecha(item.fecha) : "Sin fecha"}
							</Text>
						</View>

						{/* Identificación del Responsable */}
						<Text style={styles.seccionTitulo}>IDENTIFICACIÓN DEL RESPONSABLE DE RELEVAMIENTO</Text>
						<DetalleItem label="Nro. Acta Ministerio" value={item.actaMinisterio} />
						<DetalleItem label="Nro. Acta RENATRE" value={item.actaRenatre} />
						<DetalleItem label="Inspector RENATRE" value={item.inspectorRenatre} />
						<DetalleItem label="DNI Inspector RENATRE" value={item.inspectorRenatreDNI ? Formato.DNI(item.inspectorRenatreDNI) : "-"} />
						<DetalleItem label="Inspector UATRE" value={item.inspectorApellidoUATRE || item.inspector} />
						<DetalleItem label="DNI Inspector UATRE" value={item.inspectorDNI ? Formato.DNI(item.inspectorDNI) : "-"} />
						<DetalleItem label="Cargo Inspector" value={cargoInspector(item.inspectorCargo)} />
						<DetalleItem label="Acta RESERVIN" value={item.actaReservin} />

						{/* Datos del Establecimiento */}
						<Text style={styles.seccionTitulo}>DATOS DEL ESTABLECIMIENTO</Text>
						<DetalleItem label="Razón Social" value={item.establecimientoRazonSocial} />
						<DetalleItem label="CUIT" value={item.establecimientoCUIT ? Formato.Cuit(item.establecimientoCUIT) : "-"} />
						<DetalleItem label="Domicilio" value={item.establecimientoDomicilio} />
						<DetalleItem label="Localidad" value={item.establecimientoLocalidad} />
						<DetalleItem label="Botiquín" value={item.establecimientoBotiquin === "S" ? "SI" : "NO"} />
						<DetalleItem label="Baños" value={item.establecimientoBanos === "S" ? `SI - ${item.establecimientoBanosUbicacion === "A" ? "Afuera" : "Adentro"}` : "NO"} />
						<DetalleItem label="Área Descanso" value={item.establecimientoAreaDescansoEquipada === "S" ? "SI" : "NO"} />
						<DetalleItem label="Electricidad" value={item.establecimientoServiciosElectricidad === "S" ? `SI - ${item.establecimientoServiciosElectricidadTipo === "S" ? "Genset" : "De red"}` : "NO"} />
						<DetalleItem label="Gas" value={`${item.establecimientoServiciosGas === "S" ? "SI" : "NO"} - ${item.establecimientoServiciosGasTipo === "X" ? "Garrafa" : "De red"}`} />
						<DetalleItem label="Agua Potable" value={item.establecimientoServiciosAguaPotable === "S" ? "SI" : "NO"} />
						<DetalleItem label="Internet" value={item.establecimientoServiciosInternet === "S" ? "SI" : "NO"} />

						{/* Condición Laboral */}
						<Text style={styles.seccionTitulo}>CONDICIÓN LABORAL</Text>
						<DetalleItem label="Registrado" value={item.registrado === "S" ? "SI" : "NO"} />
						<DetalleItem label="Bien Categorizado" value={item.bienCategorizado === "S" ? "SI" : "NO"} />
						<DetalleItem label="Equipamiento" value={item.equipamiento === "S" ? "SI" : "NO"} />
						<DetalleItem label="Indumentaria" value={item.indumentariaTrab === "S" ? "SI" : "NO"} />
						<DetalleItem label="Jornada Horario" value={item.jornadaHorarioDescripcion} />
						<DetalleItem label="Observaciones" value={item.observacionCondicionLaboral} />
						
						{/* Condiciones Habitacionales */}
						<Text style={styles.seccionTitulo}>CONDICIONES HABITACIONALES DEL TRABAJADOR</Text>
						<DetalleItem label="¿Vive en el lugar?" value={respuestaSiNo(item.viveEnElLugar)} />
						<DetalleItem label="Estado Vivienda" value={item.estadoVivienda === "B" ? "BUENA" : item.estadoVivienda === "M" ? "MALA" : "ACEPTABLE"} />
						<DetalleItem label="Cantidad Integrantes" value={item.cantidadIntegrantesVivienda} />
						<DetalleItem label="Electricidad" value={item.serviciosElectricidad === "S" ? "SI" : "NO"} />
						<DetalleItem label="Gas" value={item.serviciosGas === "S" ? "SI" : "NO"} />
						<DetalleItem label="Agua Potable" value={item.serviciosAguaPotable === "S" ? "SI" : "NO"} />
						<DetalleItem label="Internet" value={item.serviciosInternet === "S" ? "SI" : "NO"} />
						<DetalleItem label="Pareja" value={item.pareja === "s" ? "SI" : "NO"} />
						<DetalleItem label="Pareja Trabaja" value={item.parejaTrabaja === "s" ? "SI" : item.pareja === "s" ? "NO" : "-"} />
						<DetalleItem label="Hijos" value={item.hijos === "s" ? "SI" : "NO"} />
						<DetalleItem label="Hijos Mayores" value={item.hijosMayores === "s" ? "SI" : item.hijos === "s" ? "NO" : "-"} />
						<DetalleItem label="Hijos Mayores Trabajan" value={item.hijosMayoresTrabajan === "s" ? "SI" : item.hijosMayores === "s" ? "NO" : "-"} />
						<DetalleItem label="Hijos Menores Escolarizados" value={item.hijosMenoresEscolarizados === "s" ? "SI" : "-"} />
						<DetalleItem label="Observaciones" value={item.observacionesCondicionHabitacional} />
					</View>
				))}

				{/* Pie de página */}
				<Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
					`Página ${pageNumber} de ${totalPages}`
				)} fixed />
				
				<View style={styles.footer} fixed>
					<Text>Total de registros: {data.length}</Text>
				</View>
			</Page>
		</Document>
	);
};

export default PDF;
