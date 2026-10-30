import Table, { asColumnArray } from "components/ui/Table/Table";
import React from "react";
import FormatearFecha from "../../helpers/FormatearFecha"
import Formato from "components/helpers/Formato";

//#region declaracion de columnas
const columnsDef = [
	{
		headerTitle: () => `Id`,
		dataField: "id",
		text: "Id",
		sort: true,
		hidden: true,
		headerStyle: () => ({ textAlign: "center" }),
	},
	{
		headerTitle: () => `Seccional`,
		dataField: "seccionalCodigo",
		text: "Seccional",
		sort: true,
		headerStyle: () => ({ textAlign: "center", width: "8rem" }),
	},
	{
		headerTitle: () => `Nombre de Seccional`,
		dataField: "seccionalDesc",
		text: "Nombre de Seccional",
		sort: true,
		headerStyle: () => ({ textAlign: "center" }),
	},
	{
		headerTitle: () => `Empleador`,
		dataField: "establecimientoRazonSocial",
		text: "Empleador",
		sort: true,
		headerStyle: () => ({ textAlign: "center" }),
	},
	{
		headerTitle: () => `Cuit`,
		dataField: "establecimientoCUIT",
		text: "Cuit",
		sort: true,
		formatter: (cell) => Formato.Cuit(cell),
		headerStyle: () => ({ textAlign: "center", width: "10rem" }),
	},
	{
		headerTitle: () => `Fecha`,
		dataField: "fecha",
		text: "Fecha",
		sort: true,
		formatter: FormatearFecha,
		headerStyle: { textAlign: "center", width: "8rem" },
	},
	{
		headerTitle: () => `Usuario`,
		dataField: "inspector",
		text: "Usuario",
		sort: true,
		headerStyle: () => ({ textAlign: "center" }),
	},
	{
		headerTitle: () => `Delegacion`,
		dataField: "delegacionDesc",
		text: "Delegacion",
		sort: true,
		headerStyle: () => ({ textAlign: "center" }),
	},
	{
		headerTitle: () => `Provincia`,
		dataField: "provinciaDesc",
		text: "Provincia",
		sort: true,
		headerStyle: () => ({ textAlign: "center" }),
	},
	{
		headerTitle: () => `Estado`,
		dataField: "estado",
		text: "Estado",
		sort: true,
		formatter: (estado) => estado || "Registrada",
		headerStyle: () => ({ textAlign: "center", width: "9rem" }),
	},
].map((r) => ({
	searchable: false,
	headerTitle: () => r.text,
	headerStyle: { textAlign: "center", ...r.headerStyle },
	style: (value, row) => ({
		textAlign: "left",
		...(row.deletedDate ? { color: "red" } : {}),
	}),
	...r,
}));
//#endregion

const RelevamientoTable = ({ columns, ...x } = {}) => {
	return (
		<Table
			keyField="id"
			columns={asColumnArray(columns, columnsDef)}
			mostrarBuscar={false}
			{...x}
		/>
	);
};

export default RelevamientoTable;
