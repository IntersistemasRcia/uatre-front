import React from "react";
import { Modal } from "react-bootstrap";
import { PDFViewer as ReactPDFViewer } from "@react-pdf/renderer";
import Button from "components/ui/Button/Button";
import Grid from "components/ui/Grid/Grid";
import modalCss from "components/ui/Modal/Modal.module.css";
import PDF from "./PDF";

const onCloseDef = () => {};

/**
 * @param {object} props
 * @param {Array} props.data Datos de relevamientos a imprimir
 * @param {object} props.filtros Filtros aplicados para mostrar en el PDF
 * @param {Function} props.onClose Handler al cerrar el modal
 */
const PDFViewer = ({ data, filtros = {}, onClose = onCloseDef }) => {
	return (
		<Modal size="xl" centered show>
			<Modal.Header className={modalCss.modalCabecera}>
				Relevamiento de Trabajadores
			</Modal.Header>
			<Modal.Body style={{ height: "70vh" }}>
				<Grid col full gap="15px">
					<ReactPDFViewer style={{ flexGrow: "1" }}>
						<PDF data={data} filtros={filtros} />
					</ReactPDFViewer>
				</Grid>
			</Modal.Body>
			<Modal.Footer>
				<Grid col gap="5px">
					<Grid gap="20px" justify="end">
						<Grid width="150px">
							<Button className="botonAmarillo" onClick={onClose}>
								FINALIZA
							</Button>
						</Grid>
					</Grid>
				</Grid>
			</Modal.Footer>
		</Modal>
	);
};

export default PDFViewer;
