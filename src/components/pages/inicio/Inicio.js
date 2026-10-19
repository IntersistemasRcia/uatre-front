
import React, { useState } from "react";
import Button from "../../ui/Button/Button";
import Grid from "../../ui/Grid/Grid"; 
import { useNavigate } from "react-router-dom";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import { useEffect } from "react";
import UseKeyPress from '../../helpers/UseKeyPress';
import useTareasUsuario from "components/hooks/useTareasUsuario";
import { useSelector } from "react-redux";
import UsuarioPerfilHandler from "../administracion/usuarioPerfil/usuarioPerfilHandler";

const Inicio = () => {
	const navigate = useNavigate();	

	const tareas = useTareasUsuario();
	const usuarioLogueado = useSelector((state) => state.usuarioLogueado);

	const usuarioConSeccionalInactiva = usuarioLogueado.ambitosDescripciones[0]?.seccionalEstado && !["NORMALIZADA", "TRANSITORIA", "SIN COMISION"].includes(usuarioLogueado.ambitosDescripciones[0]?.seccionalEstado);
	
	const accesos = [];
		
	tareas.hasTarea("Afiliaciones_Tabla", "Administrador Afiliados") && !usuarioConSeccionalInactiva && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Afiliaciones")}  ><><text className="underline">A</text>filiaciones</></Button>); 
	tareas.hasTarea("Siaru_Tabla", "Administrador SIARU") && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Empresas")}      ><><text className="underline">S</text>istema de Aportes Rurales</></Button>);
	tareas.hasTarea("Datos_Tabla", "Administrador Datos") && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Administracion")}><>Administración de Da<text className="underline">t</text>os</></Button>);
	tareas.hasTarea("Expedientes_Tabla", "Administrador Expedientes") &&   accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Expedientes")}   ><><text className="underline">E</text>xpedientes</></Button>);
	tareas.hasTarea("Informes_Tabla", "Administrador Informes") && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Informes")}      ><><text className="underline">I</text>nformes</></Button>);
	tareas.hasTarea("Consultas_Tabla", "Administrador Consultas") && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Consultas")}     ><>Co<text className="underline">n</text>sultas</></Button>);
	tareas.hasTarea("GestionOsprera_Tabla", "Administrador OS")  &&  accesos.push(<Button className="botonAmarillo" onClick={() => navigate("GestionOS")}     ><>Gestión de <text className="underline">O</text>bra Social</></Button>);
	tareas.hasTarea("App_Tabla", "Administrador App")  &&   accesos.push(<Button className="botonAmarillo" onClick={() => navigate("App")}     ><>Administración A<text className="underline">p</text>p</></Button>);
	tareas.hasTarea("Denuncias_Tabla")  && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Denuncias")}><text className="underline">D</text>enuncias</Button>);
	tareas.hasTarea("Relevamiento_Tabla", "Administrador Relevamiento") && accesos.push(<Button className="botonAmarillo" onClick={() => navigate("Relevamiento")}     ><><text className="underline">R</text>elevamiento de Trabajadores</></Button>);

	console.log("accesos",accesos)
	const [botonesAccesos, setBotonesAccesos] = useState(accesos)

	UseKeyPress(['a'], ()=>navigate("Afiliaciones"), 'AltKey');
	UseKeyPress(['s'], ()=>navigate("Empresas"), 'AltKey');
	UseKeyPress(['t'], ()=>navigate("Administracion"), 'AltKey');
	UseKeyPress(['i'], ()=>navigate("Informes"), 'AltKey');
	UseKeyPress(['n'], ()=>navigate("Consultas"), 'AltKey');
	UseKeyPress(['o'], ()=>navigate("GestionOS"), 'AltKey');
	UseKeyPress(['p'], ()=>navigate("App"), 'AltKey');
	UseKeyPress(['r'], ()=>navigate("Relevamiento"), 'AltKey');
	UseKeyPress(['d'], ()=>navigate("Denuncias"), 'AltKey');
		
	
	useEffect(() => {
		
		if (botonesAccesos.length === 1) botonesAccesos[0].props.onClick();

	}, []);

	return (
		<>	
			<div className="titulo">
				<h1 >Sistema Integral de UATRE</h1>
			</div>
			<Grid col gap="20px" style={{ margin: "10px" }}>
				{botonesAccesos}
			</Grid>			
		</>
	);
};

export default Inicio;