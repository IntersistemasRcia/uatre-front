import React from "react";
import Table from "../ui/Table/Table";

const selectionOnSelectDef = (_row, _isSelect, _index, _e) => {};

const DocumentacionTable = ({
	tipoList = [],
	data: initData = [],
	selection: initSelection = { onSelect: selectionOnSelectDef },
	onDownload = null,
	disableDownload = false,
	formatDocumentType = null,
	...x
}) => {
	const data = [];
	initData.forEach((value, index) => {
		// console.log("value_row*",value)
		data.push({ index: index, value: value });
	});
	initSelection.onSelect ??= selectionOnSelectDef;
	const selection = {
		...initSelection,
		selected: initSelection.selected
			?.map((r) => data.find((d) => d.value.id === r)?.index)
			.filter((r) => r != null),
		onSelect: (row, isSelect, index, e) =>
			initSelection.onSelect(row.value, isSelect, index, e),
	};

	const cs = {
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	};
	const tipoDocumental = (value) =>
		tipoList.find((tipo) => String(tipo.id) === String(value.refTipoDocumentacionId))
			?.descripcion ?? value.refTipoDocumentacionDescripcion ?? value.refTipoDocumentacion ?? "";
	const columns = [
		{
			dataField: "refTipoDocumentacionId",
			isDummyField: true,
			text: "Tipo Documentación",
			headerStyle: (_colum, _colIndex) => ({ width: "100px" }),
			formatter: (_cell, row) => {
				const tipo = tipoDocumental(row.value);
				return formatDocumentType ? formatDocumentType(tipo, row.value) : tipo;
			},
			style: { ...cs },
		},
		{
			dataField: "value",
			text: "Nombre del Archivo",
			headerStyle: (_colum, _colIndex) => ({ width: "100px" }),
			formatter: (value) => {
				const nombreArchivo = value.nombreArchivo ?? "";
				if (!onDownload || !value.documentoId || disableDownload) return nombreArchivo;
				return (
					<a
						href="#descargar-documento"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							onDownload(value);
						}}
					>
						{nombreArchivo}
					</a>
				);
			},
			style: { ...cs },
		},
		/*{ se quita esta columna a pedido de Fer https://trello.com/c/GnQ8h9e6/763-uatregestion-osprera30-04-2025incidencia
			dataField: "value",
			text: "Fecha Baja",
			formatter: (v) => Formato.Fecha(v.deletedDate) ?? "",
			//formatter: (v) => Formato.FechaHora(v.nombreArchivo),
			headerStyle: { width: "50px" },
			style: (v) => {
				const r = { textAlign: "center" };
				if (v.deletedDate) {
					r.background = "#ff6464cc";
					r.color = "#FFF";
				}
				return r;
			},
			//sort: true,
		},*/
	];

	return (
		<Table
			keyField="index"
			data={data}
			columns={columns}
			selection={selection}
			mostrarBuscar={true}
			{...x}
		/>
	);
};

export default DocumentacionTable;
