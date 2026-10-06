import { useEffect, useState } from "react";
import overlayFactory from "react-bootstrap-table2-overlay";
import FormatearFecha from "../../../helpers/FormatearFecha";
import useHttp from "../../../hooks/useHttp";
import Table from "../../../ui/Table/Table";
import styles from "./DeclaracionesJuradas.module.css";
import Formato from "../../../helpers/Formato";
import useTareasUsuario from "components/hooks/useTareasUsuario";

const DeclaracionesJuradas = (props) => {
  const { isLoading, error, sendRequest: request } = useHttp();
  const [ddJJUatreList, setDDJJUatreList] = useState([]);
  const [idPrimerRegistroDelGrid, setIdPrimerRegistroDelGrid] = useState(0);
  const { cuil, cuit, infoCompleta, mostrarBuscar, registros } = props ?? 0;//props.cuil && props;

  const tareas = useTareasUsuario();

  useEffect(() => {
    console.log('DeclaracionesJuradas_props',props)
    if (cuil > 0) {
      const processDDJJUatre = async (ddJJUatreObj) => {
        setIdPrimerRegistroDelGrid(ddJJUatreObj[0]?.id ?? 0);
        props.onSeleccionRegistro(ddJJUatreObj[0]);
        setDDJJUatreList(ddJJUatreObj);
        props.onDeclaracionesGeneradas&&props.onDeclaracionesGeneradas(ddJJUatreObj);
      };
			const param = (name, value) => (value ? `${name}=${value}` : null);
      request(
				{
					baseURL: "DDJJ",
					endpoint: [
						"/DDJJUatre/GetCUILUltimoAnio",
						[param("CUIL", cuil), param("CUIT", cuit)]
							.filter((r) => r)
							.join("&"),
					]
						.filter((r) => r)
						.join("?"),
					method: "GET",
				},
				processDDJJUatre
			);
    }
  }, [request, cuil, cuit]);

  let columns = null
  if (infoCompleta) {
    columns = [
      {
        dataField: "id",
        text: "id",
        hidden: true
      },
      {
        dataField: "cuit",
        text: "CUIT",
        formatter: Formato.Cuit,
        headerStyle: (colum, colIndex) => {
          return { width: "15%", textAlign: "center" };
        },
      },
      {
        dataField: "empresa",
        text: "Razón Social",
        headerStyle: (colum, colIndex) => {
          return { width: "20%", textAlign: "center" };
        },
        style: (colum, colIndex) => {
          return { textAlign: "left" };
        },
        formatter: (value, row) => (
         
          value == "Empresa no existente" ? "EMPRESA NO REGISTRADA"  : value
        ),
      },
      {
        dataField: "periodo",
        text: "Periodo",
        sort: true,
        formatter: Formato.Periodo,
      },
      {
        headerTitle: (colum, colIndex) => `Fecha De Presentación`,
        dataField: "presentacionFecha",
        text: "F.Presentación",
        formatter: FormatearFecha,
      },
      {
        headerTitle: (colum, colIndex) => `Fecha De Proceso`,
        dataField: "procesoFecha",
        text: "F.Proceso",
        formatter: FormatearFecha,
      },
      {
        dataField: "rectificativa",
        text: "Versión",
      },

      {
        dataField: "obligacionSecuencia",
        text: "Sec.Obligación",
      },
      {
        headerTitle: (colum, colIndex) => `Código de Modalidad de Contratación`,
        dataField: "modalidadDescripcion",
        text: "Mod.Contrat.",
      },
      {
        headerTitle: (colum, colIndex) => `Código de Actividad`,
        dataField: "actividadDescripcion",
        text: "Actividad",
      },
      {
        headerTitle: (colum, colIndex) => `Código de Zona`,
        dataField: "zonaDescripcion",
        text: "Zona",
      },
      {
        dataField: "remuneracionImponible",
        text: "Remuneración",
        formatter: (value, row) => (
         
          row.esEmpresaRural == "No" || !row.esEmpresaRural ? (value > 0 ? Formato.Moneda(value) : Formato.Moneda(row.remuneracion1)) :
          " "
        ),
        hidden: !tareas.hasTarea("Afiliaciones_DDJJ_VerRemuneraciones"),
      },
    ];
  } else {
    columns = [
      {
        dataField: "periodo",
        text: "Periodo",
        sort: true,
      },
      {
        dataField: "cuit",
        text: "CUIT",
      },
      {
        dataField: "empresa",
        text: "Empresa",
        formatter: (value, row) => (
         
          value == "Empresa no existente" ? "EMPRESA NO REGISTRADA"  : value
        ),
      },
       {
         dataField: "remuneracionImponible",
         text: "Remuneración",
         formatter: (value, row) => (
         
          row.esEmpresaRural == "No" || !row.esEmpresaRural ? Formato.Moneda(value) :
          " "
        ),
        hidden: !tareas.hasTarea("Afiliaciones_DDJJ_VerRemuneraciones"),
       },
    ];
  }

  const selectRow = {
    
    mode: "radio",
    clickToSelect: true,
    hideSelectColumn: true,
    style: {
      backgroundColor: "#EEC85E",
      color: "black",
      fontWeight: "bold",
    },
    onSelect: (row, isSelect, rowIndex, e) => props.onSeleccionRegistro(row, isSelect, rowIndex, e),
    selected: [idPrimerRegistroDelGrid],
  };
  

  const rowEvents = {
    onClick: (e, row, rowIndex) => {
      props.onSeleccionRegistro(row);
      setIdPrimerRegistroDelGrid(row?.id);
    },
  };

  let pagination = {};
  if(registros){
      pagination = {
        size: registros,
      };
  }  

  let tableProps = {
    keyField: "id",
    data: ddJJUatreList,
    columns: columns,

    selection: selectRow,
    rowEvents: rowEvents,
    loading: isLoading,
    noDataIndication: (
      <h4>No existen DDJJ relacionadas al Afiliado seleccionado.</h4>
    ),
    overlay: overlayFactory({ spinner: true }),
    //onSelected: props.onSeleccionRegistro,
    pagination: pagination,
    mostrarBuscar: mostrarBuscar ?? true,
    promptBuscar: "Buscar en DDJJ:",
  };

  return (
    <div className={styles.container}>
      <div className={styles.div}>
        <div className={styles.declaracion}>
          <Table {...tableProps}/>          
        </div>
      </div>
    </div>
  );
};

export default DeclaracionesJuradas;