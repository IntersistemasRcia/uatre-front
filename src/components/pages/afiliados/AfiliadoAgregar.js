import React, { useEffect, useReducer, useState, useRef, useContext } from "react";
import moment from "moment";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Button from "components/ui/Button/Button";
import Modal from "components/ui/Modal/Modal";
import useHttp from "components/hooks/useHttp";
import InputMaterial, {
  CUITMask,
  DNIMask,
} from "components/ui/Input/InputMaterial";
import SelectMaterial from "components/ui/Select/SelectMaterial";
import ValidarCUIT from "components/validators/ValidarCUIT";
import ValidarEmail from "components/validators/ValidarEmail";
import useAuditoriaProceso from "components/hooks/useAuditoriaProceso";
import { flatten } from "components/helpers/Utils";
import AuthContext from "../../../store/authContext";
import {
  AFILIADO_AGREGADO,
  AFILIADO_ACTUALIZADO,
  AFILIADO_SOLICITUDRESUELTA,
  AFILIADO_DATOSAFIPACTUALIZADO,
  AFILIADO_AGREGADO_ACTIVO,
} from "components/helpers/Mensajes";
import Documentacion from "components/documentacion/Documentacion";
import UseKeyPress from "components/helpers/UseKeyPress";
import DeclaracionesJuradas from "./declaracionesJuradas/DeclaracionesJuradas";
import classes from "./AfiliadoAgregar.module.css";
import TabEmpleador from "./TabEmpleador/TabEmpleador";
import CabeceraABMAfiliado from "./CabeceraABMAfiliado/CabeceraABMAfiliado";
import DatosAfip from "./DatosAfip/DatosAfip";
import { ActualizarDatosAfip } from "./DatosAfip/ActualizarDatosAfip";
import DateTimePicker from "components/ui/DateTimePicker/DateTimePicker";
import SearchSelectMaterial from "components/ui/Select/SearchSelectMaterial";
import useTareasUsuario from "components/hooks/useTareasUsuario";

const validarTelefono = (part, value) => {
  console.log("validarTelefono", part, value);
  if (value === null || value === undefined) return true;

  if (part === "pais") {
    return value.length === 3 && value.toString().startsWith("+") ? true : false;
  }
  if (part === "area") {
    return value.length >= 2 ? true : false;
  }
  if (part === "numero") {
    return value.length >= 6 ? true : false;
  }
  return false;
}

//#region Reducers
const fechaIngresoReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: action.value !== "" ? true : false };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: action.value !== "" ? true : false };
  }
  return { value: "", isValid: false };
};

const cuilReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: ["30", "33", "34"].includes(action?.value?.toString()?.slice(0, 2))
        ? false
        : ValidarCUIT(action.value),
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: ["30", "33", "34"].includes(state?.value?.toString()?.slice(0, 2))
        ? false
        : ValidarCUIT(state.value),
    };
  }
  return { value: "", isValid: false };
};

const numeroDocumentoReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid:
        parseInt(action.value) !== 0 && action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid:
        parseInt(action.value) !== 0 && action.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const nombreReducer = (state, action) => {
  //console.log("reducer");
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: action?.value.trim().length > 0 };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: state.value.trim().length > 0 };
  }
  return { value: "", isValid: false };
};

const cuitReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    //console.log("action.value", action.value);
    return { value: action.value, isValid: ValidarCUIT(action.value) };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: ValidarCUIT(state.value) };
  }
  return { value: "", isValid: false };
};

const emailReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: ValidarEmail(action.value) };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: ValidarEmail(state.value) };
  }
  return { value: "", isValid: false };
};

const nacionalidadReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const fechaNacimientoReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: action.value !== "" ? true : false };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: state.value !== "" ? true : false };
  }
  return { value: "", isValid: false };
};

const estadoCivilReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const sexoReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const tipoDocumentoReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const domicilioReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action?.value?.length > 0 ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value?.length > 0 ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const provinciaReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const localidadReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const seccionalReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const puestoReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const actividadReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

// const telefonoReducer = (state, action) => {
//   if (action.type === "USER_INPUT") {
//     return { value: action.value, isValid: action.value ? true : false };
//   }
//   if (action.type === "USER_BLUR") {
//     return { value: state.value, isValid: state.value ? true : false };
//   }
//   return { value: "", isValid: false };
// };

const telefonoPaisReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: validarTelefono("pais", action.value) };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: validarTelefono("pais", state.value) };
  }
  return { value: "", isValid: false };
};

const telefonoAreaReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: validarTelefono("area", action.value) };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: validarTelefono("area", state.value) };
  }
  return { value: "", isValid: false };
};

const telefonoNumeroReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return { value: action.value, isValid: validarTelefono("numero", action.value) };
  }
  if (action.type === "USER_BLUR") {
    return { value: state.value, isValid: validarTelefono("numero", state.value) };
  }
  return { value: "", isValid: false };
};

const seccionalSolicitudAfiliacionReducer = (state, action) => {
  if (action.type === "USER_INPUT") {
    return {
      value: action.value,
      isValid: action.value !== "" ? true : false,
    };
  }
  if (action.type === "USER_BLUR") {
    return {
      value: state.value,
      isValid: state.value !== "" ? true : false,
    };
  }
  return { value: "", isValid: false };
};

const onLoadedDef = ({ data, error }) => { };
//#endregion

const AfiliadoAgregar = (props) => {
  const { isLoading, error, sendRequest: request } = useHttp();
  const [errorAFIP, setErrorAFIP] = useState(false);
  const [consultaPadronCUILOk, setConsultaPadronCUILOk] = useState(false);
  const Usuario = useContext(AuthContext).usuario;

  const [selectedTab, setSelectedTab] = useState(0);
  const { cuil: cuilParam } = props;
  const accion = props?.accion;

  //#region Alert
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTexto, setDialogTexto] = useState("");
  //#endregion

  const tarea = useTareasUsuario();

  const usuarioTareaValidacionAutomatica = tarea.hasTarea(
    "Afiliaciones_AfiliadoAutoValida"
  );
  //#region manejo de validaciones
  const [fechaIngresoState, dispatchFechaIngreso] = useReducer(
    fechaIngresoReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [cuilState, dispatchCUIL] = useReducer(cuilReducer, {
    value: "",
    isValid: false,
  });

  const [numeroDocumentoState, dispatchNumeroDocumento] = useReducer(
    numeroDocumentoReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [nombreState, dispatchNombre] = useReducer(nombreReducer, {
    value: "",
    isValid: false,
  });

  const [cuitState, dispatchCUIT] = useReducer(cuitReducer, {
    value: "",
    isValid: false,
  });

  const [emailState, dispatchEmail] = useReducer(emailReducer, {
    value: "",
    isValid: false,
  });

  // const [telefonoState, dispatchTelefono] = useReducer(telefonoReducer, {
  //   value: "",
  //   isValid: false,
  // });

  const [telefonoPaisState, dispatchTelefonoPais] = useReducer(
    telefonoPaisReducer,
    {
      value: "+54",
      isValid: true,
    }
  );

  const [telefonoAreaState, dispatchTelefonoArea] = useReducer(
    telefonoAreaReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [telefonoNumeroState, dispatchTelefonoNumero] = useReducer(
    telefonoNumeroReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [nacionalidadState, dispatchNacionalidad] = useReducer(
    nacionalidadReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [fechaNacimientoState, dispatchFechaNacimiento] = useReducer(
    fechaNacimientoReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [estadoCivilState, dispatchEstadoCivil] = useReducer(
    estadoCivilReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [sexoState, dispatchSexo] = useReducer(sexoReducer, {
    value: "",
    isValid: false,
  });

  const [tipoDocumentoState, dispatchTipoDocumento] = useReducer(
    tipoDocumentoReducer,
    {
      value: "",
      isValid: false,
    }
  );

  const [domicilioState, dispatchDomicilio] = useReducer(domicilioReducer, {
    value: "",
    isValid: false,
  });

  const [provinciaState, dispatchProvincia] = useReducer(provinciaReducer, {
    value: "",
    isValid: false,
  });

  const [localidadState, dispatchLocalidad] = useReducer(localidadReducer, {
    value: "",
    isValid: false,
  });

  const [seccionalState, dispatchSeccional] = useReducer(seccionalReducer, {
    value: "",
    isValid: false,
  });

  const [puestoState, dispatchPuesto] = useReducer(puestoReducer, {
    value: "",
    isValid: false,
  });

  const [actividadState, dispatchActividad] = useReducer(actividadReducer, {
    value: "",
    isValid: false,
  });

  const [
    seccionalSolicitudAfiliacionState,
    dispatchSeccionalSolicitudAfiliacion,
  ] = useReducer(seccionalSolicitudAfiliacionReducer, {
    value: "",
    isValid: false,
  });
  //#ENDREGION

  UseKeyPress(["Escape"], () => handleCerrarModal());
  UseKeyPress(["Enter"], () => afiliadoAgregarHandler(), "AltKey");

  UseKeyPress(
    ["v"],
    selectedTab === 0 && cuilState.isValid
      ? () => validarAfiliadoCUILHandler()
      : "",
    "AltKey"
  );
  UseKeyPress(
    ["v"],
    selectedTab === 1 && cuitState.isValid
      ? () => validarEmpresaCUITHandler()
      : "",
    "AltKey"
  );

  //#region Texto completar campos
  const TextCompletarCampos = () => {
    //console.log("texto dialog estadocivil", estadoCivilState.isValid);
    setDialogTexto(`Se deben completar todos los campos:\n
      ${!cuilState.isValid ? "*CUIL\n" : ""}
      ${!nombreState.isValid ? "*Nombre\n" : ""}
      ${!fechaNacimientoState.isValid ? "*Fecha de Nacimiento\n" : ""}
      ${!numeroDocumentoState.isValid ? "*Numero Documento\n" : ""}
      ${!estadoCivilState.isValid ? "*Estado Civil\n" : ""}
      ${!sexoState.isValid ? "*Género\n" : ""}
      ${!domicilioState.isValid ? "*Domicilio\n" : ""}
      ${!provinciaState.isValid ? "*Provincia\n" : ""}
      ${!localidadState.isValid ? "*Localidad\n" : ""}
      ${!seccionalState.isValid ? "*Seccional\n" : ""}      
      ${!actividadState.isValid ? "*Actividad\n" : ""}
      ${!seccionalSolicitudAfiliacionState.isValid
        ? "*Seccional Solicita Afiliación\n"
        : ""
      }      
      ${!cuitState.isValid ? "*CUIT Empleador\n" : ""}
      `);
  };
  //#endregion

  //#region Variables de estado para ButtonLoadingCustom
  const [cuilLoading, setCUILLoading] = useState(false);
  const [cuitLoading, setCUITLoading] = useState(false);
  const [afiliadoProcesando, setAfiliadoProcesando] = useState(false);
  //#endregion

  //#region Capturo errores
  useEffect(() => {
    if (error) {
      setAfiliadoProcesando(false);
      if (error.code === 500) {
        setCUILLoading(false);
        setDialogTexto(`Error - ${error.message}`);
        setOpenDialog(true);
      }

      if (error?.data?.statusCode === 408 && cuilLoading) {
        setCUILLoading(false);
        setDialogTexto(
          `No se pudo conectar con ARCA, se habilita la carga MANUAL del Afiliado`
        );
        setOpenDialog(true);
        setErrorAFIP(false); // afip no respondio no se considera un error para impedir la carga
      }

      if (
        error?.code === 404 &&
        cuilLoading &&
        error?.data?.statusCode !== 408
      ) {
        console.log("error", error);
        setCUILLoading(false);
        setDialogTexto(
          //`Error - No existe el CUIL ${cuilState.value} en el Padron de AFIP`
          `${error?.message
            ? error?.message.includes("objeto")
              ? `Error AFIP Conectividad (${cuilState.value}: Persona no encontrada)`
              : error?.message
            : "Error consultando ARCA"
          }`
        );
        setOpenDialog(true);
        setErrorAFIP(true);
      }

      if (error?.data?.statusCode === 408 && cuitLoading) {
        setCUILLoading(false);
        setDialogTexto(
          `No se pudo conectar con AFIP, se habilita la carga MANUAL del Empleador`
        );
        setOpenDialog(true);
        setErrorAFIP(false); // afip no respondio no se considera un error para impedir la carga
      }

      if (
        error.code === 404 &&
        cuitLoading &&
        error?.data?.statusCode !== 408
      ) {
        setCUITLoading(false);
        setDialogTexto(
          //`Error - No existe el CUIT ${cuitEmpresa} en el Padron de AFIP`
          `${error?.message
            ? error?.message.includes("objeto")
              ? `Error AFIP Conectividad (${cuitEmpresa}: Empleador no encontrado)`
              : error?.message
            : "Error consultando ARCA"
          }`
        );
        setOpenDialog(true);
        setErrorAFIP(true);
      }

      return;
    }
  }, [error]);
  //#endregion

  //#region estados para validaciones
  const [formularioIsValid, setFormularioIsValid] = useState(false);
  const [formularioEmpleadorIsValid, setFormularioEmpleadorIsValid] =
    useState(false);
  const [cuilValidado, setCuilValidado] = useState(false);
  const [cuitValidado, setCuitValidado] = useState(false);
 
  const autoVerificaCUILRef = useRef(false); 
  const autoValidaCUILRef = useRef(false); 
  const autoVerificaCUITEmpresaRef = useRef(false); 
  //#endregion

  //#region variables para respuestas de servicios
  const [nuevoAfiliadoResponse, setNuevoAfiliadoResponse] = useState(null);
  const [afiliadoModificado, setAfiliadoModificado] = useState(null);
  const [padronRespuesta, setPadronRespuesta] = useState(null);
  const [padronEmpresaRespuesta, setPadronEmpresaRespuesta] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [provincias, setProvincias] = useState({
    loading: "Cargando...",
    data: [],
    error: null,
    onLoaded: onLoadedDef,
  });


  const [localidades, setLocalidades] = useState({
    loading: null,
    params: null,
    data: [],
    error: null,
    onLoaded: onLoadedDef,
  });
  const [seccionales, setSeccionales] = useState({
    loading: null,
    params: null,
    data: [],
    error: null,
    onLoaded: onLoadedDef,
  });
  const [puestos, setPuestos] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [estadosCiviles, setEstadosCiviles] = useState([]);
  const [tiposDocumentos, setTiposDocumentos] = useState([]);

  const [seccionalSolicitaAfiliacion, setSeccionalSolicitaAfiliacion] =
    useState([]);
  //#endregion

  //#region Documentación
  const [documentacionList, setDocumentacionList] = useState([]);
  // Bandera para evitar doble carga de documentación desde la solicitud
  const docFromSolicitudLoadedRef = useRef(false);
  //#endregion

  //#region Datos Personales Formulario
  const [afiliado, setAfiliado] = useState(null);
  const afiliadoRef = useRef(null);

  //#endregion

  //#region Datos Empleador
  const [cuitEmpresa, setCUITEmpresa] = useState("");
  const [razonSocialEmpresa, setRazonSocialEmpresa] = useState("");
  const [actividadEmpresa, setActividadEmpresa] = useState("");
  const [domicilioEmpresa, setDomicilioEmpresa] = useState("");
  const [localidadEmpresa, setLocalidadEmpresa] = useState("");
  const [telefonoEmpresa, setTelefonoEmpresa] = useState("");
  const [correoEmpresa, setCorreoEmpresa] = useState("");
  const [lugarTrabajoEmpresa, setLugarTrabajoEmpresa] = useState("");
  //const [empresaId, setEmpresaId] = useState(0);
  //#endregion

  //checking
  useEffect(() => {
    const identifier = setTimeout(() => {
      if (
        cuilState.isValid &&
        nombreState.isValid &&
        estadoCivilState.isValid &&
        sexoState.isValid &&
        tipoDocumentoState.isValid &&
        numeroDocumentoState.isValid &&
        domicilioState.isValid &&
        provinciaState.isValid &&
        localidadState.isValid &&
        seccionalState.isValid &&
        fechaNacimientoState.isValid &&
        nacionalidadState.isValid
        // && actividadState.isValid
      ) {
        setFormularioIsValid(true);
      } else {
        setFormularioIsValid(false);
      }
    }, 400);

    return () => {
      clearTimeout(identifier);
    };
  }, [
    cuilState,
    nombreState,
    estadoCivilState,
    sexoState,
    tipoDocumentoState,
    numeroDocumentoState,
    domicilioState,
    provinciaState,
    localidadState,
    seccionalState,
    //puestoState,
    actividadState,
    fechaNacimientoState,
    nacionalidadState,
  ]);

  useEffect(() => {
    const identifier = setTimeout(() => {
      if (cuitState.isValid) {
        setFormularioEmpleadorIsValid(true);
      }
    }, 200);

    return () => {
      clearTimeout(identifier);
    };
  }, [cuitState.isValid]);
  //#endregion

  //#region variables de estado por touched
  const [inputsTouched, setInputsTouched] = useState(false);
  //#endregion

  //#region manejo si el afiliado existe
  const [afiliadoExiste, setAfiliadoExiste] = useState(false);
  const [empresaIdExiste, setEmpresaIdExiste] = useState(0);

  useEffect(() => {
    if (props.accion === "Modifica") {
      setAfiliadoExiste(true);
      setInputsTouched(true);
      console.log("cuilPAram", cuilParam);
      if (cuilParam > 0) {
        dispatchCUIL({
          type: "USER_INPUT",
          value: cuilParam,
          isValid: ["30", "33", "34"].includes(cuilParam.toString().slice(0, 2))
            ? false
            : ValidarCUIT(cuilParam),
        });
      }
    }
  }, [cuilParam, props.accion]);

  // Carga inicial de documentación proveniente de la Solicitud Previa de Afiliación
  useEffect(() => {
    const solicitudId = props?.documentacionSolicitudId;
    if (!solicitudId) return;               
    if (docFromSolicitudLoadedRef.current) return;

    if (documentacionList && documentacionList.length > 0) return;

    const processDocs = (ok) => {
      const arr = Array.isArray(ok) ? ok : [];

      const mapped = arr.map(doc => ({
        id: 0, 
        entidadId: 0,
        entidadTipo: 'A',
        refTipoDocumentacionId: doc.refTipoDocumentacionId ?? doc.tipoDocumentacionId ?? doc.tipoId,
        refTipoDocumentacionDescripcion: doc.refTipoDocumentacionDescripcion,
        nombreArchivo: doc.nombreArchivo,
        descripcion: doc.descripcion,
        observaciones: doc.observaciones,
        fechaVencimiento: doc.fechaVencimiento,
        archivo: doc.archivo,
        contentType: doc.contentType || 'application/octet-stream',
        url: doc.url,
      }));
      if (mapped.length) {
        setDocumentacionList(mapped);
        docFromSolicitudLoadedRef.current = true;
        console.log('[AfiliadoAgregar] Documentación importada desde Solicitud', { solicitudId, cantidad: mapped.length });
      }
    };
    const processDocsError = (err) => {
      console.warn('[AfiliadoAgregar] Error cargando documentación de la solicitud', err);
    };
    request(
      {
        baseURL: 'Comunes',
        endpoint: `/DocumentacionEntidad/GetBySpec?EntidadId=${solicitudId}&EntidadTipo=F`,
        method: 'GET'
      },
      processDocs,
      processDocsError
    );
  }, [props?.documentacionSolicitudId, request, documentacionList]);

  // Auto consulta AFIP apenas el CUIL es válido y todavía no se consultó (solo en alta, no modificación existente)
  useEffect(() => {
    if (autoVerificaCUILRef.current) return; 
    if (props.accion !== "Agrega") return; 
    if (!props.autoValidaDesdeSolicitud) return; 
    if (!cuilState?.isValid) return; 
    if (padronRespuesta) return; 
    if (cuilLoading) return; 
    if (!Array.isArray(provincias?.data) || provincias.data.length === 0) return;
    autoVerificaCUILRef.current = true;
    try {
      validarAfiliadoCUILHandler();
    } catch (e) {
      console.warn("Auto verificación CUIL falló:", e);
      autoVerificaCUILRef.current = false; 
    }

  }, [cuilState.isValid, padronRespuesta, cuilLoading, props.accion, provincias]);

  useEffect(() => {
    if (!cuilState.value) return;
    if (afiliadoRef.current?.cuil === cuilState.value) return;

    const processGetAfiliado = async (afiliadoObj) => {
      console.log("afiliadoObj", afiliadoObj);
      const previousAfiliado = afiliadoRef.current;

      setAfiliado(afiliadoObj);
      afiliadoRef.current = afiliadoObj;
      setCuilValidado(afiliadoObj.cuilValidado ? true : false);
      setNuevoAfiliadoResponse(afiliadoObj);
      setAfiliadoExiste(true);

      //dispatches para validar los campos
      dispatchFechaNacimiento({
        type: "USER_INPUT",
        value:
          afiliadoObj.fechaIngreso !== null
            ? moment(afiliadoObj.fechaIngreso).format("yyyy-MM-DD")
            : "",
      });
      dispatchCUIL({
        type: "USER_INPUT",
        value: afiliadoObj.cuil,
        isValid: ["30", "33", "34"].includes(
          afiliadoObj.cuil.toString().slice(0, 2)
        )
          ? false
          : ValidarCUIT(afiliadoObj.cuil),
      });

      dispatchFechaIngreso({
        type: "USER_INPUT",
        value: moment(afiliadoObj.fechaIngreso).format("yyyy-MM-DD"),
      });

      dispatchActividad({
        type: "USER_INPUT",
        value: afiliadoObj.actividadId === 0 ? "" : afiliadoObj.actividadId,
      });

      dispatchSeccionalSolicitudAfiliacion({
        type: "USER_INPUT",
        value: afiliadoObj?.seccionalIdSolicitudAfiliacion
          ? {
              value: afiliadoObj?.seccionalIdSolicitudAfiliacion,
              label: `${afiliadoObj?.seccionalCodigoSolicitudAfiliacion}-${afiliadoObj?.seccionalDescripcionSolicitudAfiliacion}`,
            }
          : {},
      });

      dispatchPuesto({
        type: "USER_INPUT",
        value: afiliadoObj.puestoId === 0 ? "" : afiliadoObj.puestoId,
      });
      dispatchNacionalidad({
        type: "USER_INPUT",
        value:
          afiliadoObj.nacionalidadId === 0 ? "" : afiliadoObj.nacionalidadId,
      });
      dispatchSexo({
        type: "USER_INPUT",
        value: afiliadoObj.sexoId === 0 ? "" : afiliadoObj.sexoId,
      });
      dispatchEstadoCivil({
        type: "USER_INPUT",
        value:
          afiliadoObj.estadoCivilId === 0 ? "" : afiliadoObj.estadoCivilId,
      });
      dispatchTipoDocumento({
        type: "USER_INPUT",
        value:
          afiliadoObj.tipoDocumentoId === 0
            ? ""
            : afiliadoObj.tipoDocumentoId,
      });

      dispatchLocalidad({
        type: "USER_INPUT",
        value: {
          value: afiliadoObj?.refLocalidadId,
          label: afiliadoObj?.localidad,
        },
      });
      dispatchSeccional({
        type: "USER_INPUT",
        value: {
          value: afiliadoObj?.seccionalId,
          label: afiliadoObj?.seccional,
        },
      });

      setProvincias((o) => ({
        ...o,
        loading: "Cargando...",
        onLoaded: ({ data }) => {
          const provinciaSelected =
            data.find((prov) => prov.value === afiliadoObj.provinciaId) ?? "";

          dispatchProvincia({ type: "USER_INPUT", value: provinciaSelected });

          setLocalidades((o) => ({
            ...o,
            loading: "Cargando...",
            params: provinciaSelected
              ? { provinciaId: provinciaSelected?.value }
              : {},
            onLoaded: ({ data }) => {
              if (!Array.isArray(data)) return;

              //const myLocalidadId = data.find((r) => r.value === afiliadoObj?.refLocalidadId) ?? {value: provinciaSelected?.localidadIdPorDefecto, label: provinciaSelected?.localidadDescripcionPorDefecto} ?? {}; //si encuentra la localidad en las optiosn, la selecciona, sino selecciona por defecto.
              const myLocalidadId =
                data.find((r) => r.value === afiliadoObj?.refLocalidadId) ?? {
                  value: provinciaSelected?.localidadIdPorDefecto,
                  label: provinciaSelected?.localidadDescripcionPorDefecto,
                } ??
                {}; //si encuentra la localidad en las optiosn, la selecciona, sino selecciona por defecto.
              //console.log("afiliadoObj_myRefLocalidadId",myLocalidadId)
              const sinAsignar =
                myLocalidadId?.value ===
                provinciaSelected?.localidadIdPorDefecto
                  ? { provinciaId: provinciaSelected?.value }
                  : { localidadId: myLocalidadId.value };
              dispatchLocalidad({ type: "USER_INPUT", value: myLocalidadId });

              //05/02/2024 las personas afiliadas antes del 05/02/2024, respeto la seccional sin importar localidad

              const fechaIngres = moment(afiliadoObj?.fechaIngreso).format(
                "yyyy-MM-DD"
              );
              const esAnterior =
                moment(fechaIngres).isSameOrBefore("2024-02-05");
              console.log("esAnterior", esAnterior);

              setSeccionales((o) => ({
                ...o,
                loading: "Cargando...",
                //params: esAnterior && afiliadoObj?.seccionalId ? {seccionalId: afiliadoObj?.seccionalId} :  provinciaSelected?.value ? {provinciaId:  provinciaSelected?.value} : sinAsignar ?? null, //AQUI DEBO DETERMINAR CUANTOS REG CARGAR EN EL COMBO
                params:
                  esAnterior && afiliadoObj?.seccionalId
                    ? { seccionalId: afiliadoObj?.seccionalId }
                    : myLocalidadId
                      ? { localidadId: myLocalidadId.value }
                      : provinciaSelected?.value
                        ? { provinciaId: provinciaSelected?.value }
                        : sinAsignar ?? null,
                onLoaded: ({ data }) => {
                  //if (!Array.isArray(data)) return;
                  const mySeccionalId =
                    data.find((r) => r.value === afiliadoObj?.seccionalId) ??
                    data.at(0) ??
                    {};
                  dispatchSeccional({
                    type: "USER_INPUT",
                    value: mySeccionalId,
                  });
                },
              }));
            },
          }));
        },
      }));

      dispatchNombre({ type: "USER_INPUT", value: afiliadoObj.nombre });
      dispatchFechaNacimiento({
        type: "USER_INPUT",
        value:
          afiliadoObj.fechaNacimiento !== null
            ? moment(afiliadoObj.fechaNacimiento).format("yyyy-MM-DD")
            : "",
      });
      dispatchNumeroDocumento({
        type: "USER_INPUT",
        value: afiliadoObj.documento !== 0 ? afiliadoObj.documento : "",
      });
      dispatchDomicilio({
        type: "USER_INPUT",
        value: afiliadoObj.domicilio ?? "",
      });
      dispatchEmail({ type: "USER_INPUT", value: afiliadoObj.correo });

      // dispatchTelefono({ type: "USER_INPUT", value: afiliadoObj.telefono });
      dispatchTelefonoPais({
        type: "USER_INPUT",
        value: afiliadoObj.telefonoPais,
      });
      dispatchTelefonoArea({
        type: "USER_INPUT",
        value: afiliadoObj.telefonoArea,
      });
      dispatchTelefonoNumero({
        type: "USER_INPUT",
        value: afiliadoObj.telefonoNumero,
      });

      //datos empleador
      dispatchCUIT({ type: "USER_INPUT", value: afiliadoObj.empresaCUIT });
      setCuitValidado(true);
      setCUITEmpresa(afiliadoObj.empresaCUIT);
      setRazonSocialEmpresa(afiliadoObj.empresa);
      setEmpresaIdExiste(afiliadoObj.empresaId);
      setDocumentacionList(afiliadoObj.documentacion ?? []);

      //alert
      if (
        accion === "Agrega" ||
        (previousAfiliado?.cuil && cuilParam !== previousAfiliado?.cuil)
      ) {
        console.log("no debe ingresar aqui**");
        setDialogTexto(
          `El Afiliado: ${afiliadoObj?.nombre
          } ya está cargado para la Seccional: ${afiliadoObj?.seccionalCodigo
          } ${afiliadoObj?.seccional}
            ${
              afiliadoObj?.estadoSolicitud.includes("No Activo")
                ? `El Afiliado se encuentra "${afiliadoObj?.estadoSolicitud}", NO podrá modificar los datos del Afiliado`
                : ""
            }`
        );
        setOpenDialog(true);

        return;
      }
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Afiliado/GetAfiliadoByCUIL?CUIL=${cuilState.value}`,
        method: "GET",
      },
      processGetAfiliado
    );
  }, [request, cuilState.value, accion, cuilParam]);

  // Auto validación 
  useEffect(() => {
    if (autoValidaCUILRef.current) return; 
    if (!props.autoValidaDesdeSolicitud) return; 
    if (cuilValidado) return; 
    if (!padronRespuesta?.cuit) return; 
    if (!afiliadoExiste) return; 
    autoValidaCUILRef.current = true;
    try {
      validaCUILHandler();
    } catch (e) {
      console.warn("Auto validación CUIL falló:", e);
      autoValidaCUILRef.current = false; 
    }

  }, [cuilValidado, padronRespuesta, afiliadoExiste]);

  useEffect(() => {
    if (afiliadoExiste && empresaIdExiste > 0) {
      const processGetEmpresa = async (empresaObj) => {
        //console.log('empresaObj',empresaObj)

        setPadronEmpresaRespuesta(empresaObj);
        setRazonSocialEmpresa(empresaObj.razonSocial);
        setActividadEmpresa(empresaObj.actividadPrincipalDescripcion);
        setDomicilioEmpresa(
          `${empresaObj.domicilioCalle} ${empresaObj.domicilioNumero}`
        );
        // AJUSTE LOCALIDAD EMPLEADOR (mostrar texto de AFIPConsultasDomicilios.Localidad)
        const localidadTextoEmpresa =
          empresaObj?.domicilioLocalidadDescripcion ||
          empresaObj?.domicilioLocalidad ||
          empresaObj?.localidadDescripcion ||
          empresaObj?.localidad ||
          "";
        setLocalidadEmpresa(localidadTextoEmpresa);
        setTelefonoEmpresa(empresaObj.telefono ?? "");
        setCorreoEmpresa(empresaObj.email ?? "");
        setLugarTrabajoEmpresa("");
        //ciius

        // Consulta puntual a AFIP para reforzar localidad (domicilio LEGAL/REAL) sin afectar guardado
        if (empresaObj?.cuit) {
          request(
            {
              baseURL: "Comunes",
              endpoint: `/AFIPConsulta?CUIT=${empresaObj.cuit}&VerificarHistorico=false`,
              method: "GET",
            },
            (padronEmpresaAFIP) => {
              const domicilioLegal =
                padronEmpresaAFIP?.domicilios?.find(
                  (d) => d?.tipoDomicilio === "LEGAL/REAL"
                ) || padronEmpresaAFIP?.domicilios?.[0];
              if (domicilioLegal?.localidad) {
                setLocalidadEmpresa(domicilioLegal.localidad);
              }
            }
          );
        }
      };

      request(
        {
          baseURL: "Comunes",
          endpoint: `/Empresas/GetById?Id=${empresaIdExiste}`,
          method: "GET",
        },
        processGetEmpresa
      );
    }
  }, [request, afiliadoExiste, empresaIdExiste]);
  //#endregion

  //#region carga ultimaDDJJ
  const [ultimaDDJJ, setUltimaDDJJ] = useState({ data: {} });
  useEffect(() => {
    if (!cuilState.isValid) return;
    if (!cuitState.isValid) return;
    let { cuil, cuit, data } = {
      cuil: afiliado?.cuilValidado ?? cuilState?.value,
      cuit: cuitState.value,
    };
    if (ultimaDDJJ.cuil === cuil && ultimaDDJJ.cuit === cuit) return;

    console.log("cuil para DDJJ", cuil);
    request(
      {
        baseURL: "DDJJ",
        endpoint: `/DDJJUatre/GetCUILUltimoAnio?cuil=${cuil}&cuit=${cuit}`,
        method: "GET",
      },
      async (ok) => {
        console.log("ok_data:", ok);
        ok.forEach((ddjj) => {
          if (!data) {
            data = {};
            ["modalidadTipo", "actividadTipo"].forEach(
              (k) => (data[k] = ddjj[k])
            );
            return;
          }
          Object.keys(data).forEach((k) => {
            if (!data[k]) return;
            if (data[k] !== ddjj[k]) data[k] = undefined;
          });
        });
      },
      async (_) => (data = {}),
      async () => {
        console.log("setUltimaDDJJ", data);
        setUltimaDDJJ({ cuil, cuit, data });
      }
    );
  }, [request, ultimaDDJJ, cuilValidado, cuitState]);
  //#endregion

  //#region Tablas para crear afiliado
  useEffect(() => {
    const processActividades = async (actividadesObj) => {
      const actividadesSelect = actividadesObj
        .sort((a, b) => (a.descripcion > b.descripcion ? 1 : -1))
        .map((actividad) => {
          return { value: actividad.id, label: actividad.descripcion };
        });
      setActividades(actividadesSelect);
      const pre = props?.data?.actividadIdAfiliado;
      const preferida = actividadesSelect.find((a) => a.value === pre)?.value ?? actividadesSelect[0]?.value;
      dispatchActividad({
        type: "USER_INPUT",
        value: preferida,
      });
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Actividad`,
        method: "GET",
      },
      processActividades
    );
  }, [request, props?.data?.actividadIdAfiliado]);

  useEffect(() => {
    const processGetSeccionales = async (seccionalesObj) => {
      console.log("seccionales_todas", seccionalesObj);

      const seccionalesOptions = seccionalesObj
        .sort((a, b) => (a.codigo > b.codigo ? 1 : -1))
        .map((sec) => {
          return {
            value: sec.id,
            label: `${sec.codigo}-${sec.descripcion}-${sec.provinciaDescripcion}`,
          };
        });

      const seccionalSelected = seccionalesObj.find(
        (s) => s.id == afiliado?.seccionalIdSolicitudAfiliacion
      );
      const seccionalPorDefecto = seccionalesObj.find(
        (s) => s.codigo == "S9925"
      );

      setSeccionalSolicitaAfiliacion(seccionalesOptions);
      console.log("afiliado?", afiliado);
      console.log("seccionalPorDefecto", seccionalPorDefecto);

      dispatchSeccionalSolicitudAfiliacion({
        type: "USER_INPUT",
        value: seccionalSelected
          ? {
            value: seccionalSelected?.id,
            label: `${seccionalSelected?.codigo}-${seccionalSelected?.descripcion}-${seccionalSelected?.provinciaDescripcion}`,
          }
          : {
            value: seccionalPorDefecto?.id,
            label: `${seccionalPorDefecto?.codigo}-${seccionalPorDefecto?.descripcion}`,
          },
      });
    };
    //#region consulto todas las seccionales las cuales mostraré en el combo de SeccionalSolicitaAfiliacion
    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Seccional?SoloActivos=true&verSeccionalesLocalidades=false`,
        method: "GET",
      },
      processGetSeccionales
    );
  }, [request, afiliado]);

  useEffect(() => {
    const processPuestos = async (puestosObj) => {
      const puestosSelect = puestosObj
        .sort((a, b) => (a.descripcion > b.descripcion ? 1 : -1))
        .map((puesto) => {
          return { value: puesto.id, label: puesto.descripcion };
        });
      setPuestos(puestosSelect);
      const prePuesto = props?.data?.oficioId;
      const preferido = puestosSelect.find((p) => p.value === prePuesto)?.value ?? puestosSelect[0]?.value;
      dispatchPuesto({ type: "USER_INPUT", value: preferido });
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Puesto`,
        method: "GET",
      },
      processPuestos
    );
  }, [request, props?.data?.oficioId]);

  useEffect(() => {
    const processSexos = async (sexosObj) => {
      const sexosSelect = sexosObj
        .sort((a, b) => (a.descripcion > b.descripcion ? 1 : -1))
        .map((sexo) => {
          return { value: sexo.id, label: sexo.descripcion };
        });
      setSexos(sexosSelect);
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Sexo`,
        method: "GET",
      },
      processSexos
    );
  }, [request]);

  useEffect(() => {
    const processNacionalidades = async (nacionalidadObj) => {
      const nacionalidadesSelect = nacionalidadObj
        .sort((a, b) => (a.descripcion > b.descripcion ? 1 : -1))
        .map((nacionalidad) => {
          return { value: nacionalidad.id, label: nacionalidad.descripcion };
        });
      setNacionalidades(nacionalidadesSelect);
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Nacionalidad`,
        method: "GET",
      },
      processNacionalidades
    );
  }, [request]);

  //Provincias
  useEffect(() => {
    if (!provincias.loading) return;
    const changes = {
      loading: null,
      data: [],
      error: null,
      onLoaded: onLoadedDef,
    };
    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Provincia`,
        method: "GET",
      },
      async (ok) =>
        changes.data.push(
          ...ok
            .sort((a, b) => (a.nombre > b.nombre ? 1 : -1))
            .map((r) => ({
              value: r.id,
              label: r.nombre,
              ...r,
            }))
        ),
      async (error) => (changes.error = error),
      async () => {
        provincias.onLoaded(changes);
        setProvincias((o) => ({ ...o, ...changes }));
      }
    );
  }, [request, provincias]);

  // Localidades
  useEffect(() => {
    if (!localidades.loading) return;
    const changes = {
      loading: null,
      data: [],
      error: null,
      onLoaded: onLoadedDef,
    };
    const applyChanges = () => {
      localidades.onLoaded(changes);
      setLocalidades((o) => ({ ...o, ...changes }));
    };
    if (!localidades.params) return applyChanges();
    request(
      {
        baseURL: "Afiliaciones",
        endpoint: [
          "/RefLocalidad",
          Object.keys(localidades.params)
            .map((k) => `${k}=${localidades.params[k]}`)
            .join("&"),
        ]
          .filter((r) => r)
          .join("?"),
        method: "GET",
      },
      async (ok) => {
        const sinAsigacion = ok.find((o) => o.codPostal === 99999); //99999 CP de Localidad SinAsignar para cada provincia

        changes.data.push({
          value: sinAsigacion.id,
          label: sinAsigacion.nombre,
        });
        changes.data.push(
          ...ok
            .sort((a, b) => (a.nombre > b.nombre ? 1 : -1))
            .map(
              (r) =>
                r.codPostal !== 99999 && {
                  value: r.id,
                  label: `${r.codPostal} ${r.nombre}`,
                }
            )
        );
      },

      async (error) => (changes.error = error),
      async () => applyChanges()
    );
  }, [request, localidades]);

  // Seccionales
  useEffect(() => {
    if (!seccionales.loading) return;
    const changes = {
      loading: null,
      data: [provincias.data.find((r) => r.value === provinciaState.value)]
        .filter((r) => r)
        .map((r) => ({
          value: r.seccionalIdPorDefecto,
          label: r.seccionalDescripcionPorDefecto,
        })),
      error: null,
      onLoaded: onLoadedDef,
    };
    const applyChanges = () => {
      seccionales.onLoaded(changes);
      setSeccionales((o) => ({ ...o, ...changes }));
    };
    if (!seccionales.params) return applyChanges();

    seccionales.params.seccionalId // si busco solo la seccional ID
      ? request(
        {
          baseURL: "Afiliaciones",
          endpoint: `/Seccional/${seccionales.params.seccionalId}`,
          method: "GET",
        },
        async (ok) => {
          console.log("GetSeccionalesSpecs_ok", ok);
          changes.data.push({
            value: provinciaState?.value?.seccionalIdPorDefecto,
            label: provinciaState?.value?.seccionalDescripcionPorDefecto,
          });
          const item = ok.localidadCodPostal !== 99999 && {
            value: ok.id,
            label: `${ok.codigo} ${ok.descripcion} (Deleg: ${ok.refDelegacionDescripcion})`,
          };
          if (item) changes.data.push(item);
        },
        async (error) => {
          console.log("GetSeccionalesSpecs_error", error);
          changes.error = error;
        },
        async () => applyChanges()
      )
      : //NO BUSCO EXACTAMENTE UNA SECCIONAL
      console.log("seccionales.params", seccionales.params);
    seccionales.params.localidadId
      ? request(
        {
          baseURL: "Afiliaciones",
          endpoint: `/SeccionalLocalidad/GetSeccionalLocalidadByRefLocalidadId?RefLocalidadId=${seccionales.params.localidadId}&SoloActivos=true`,
          method: "GET",
        },
        async (ok) => {
          console.log("GetSeccionalLocalidadByRefLocalidadId_ok", ok);
          changes.data.push({
            value: provinciaState?.value?.seccionalIdPorDefecto,
            label: provinciaState?.value?.seccionalDescripcionPorDefecto,
          });
          changes.data.push(
            ...ok
              .sort((a, b) =>
                a.seccionalDescripcion > b.seccionalDescripcion ? 1 : -1
              )
              .map(
                (r) =>
                  !r.seccionalDescripcion.includes("SIN ASIGNACION") && {
                    value: r.seccionalId,
                    label: `${r.seccionalCodigo} ${r.seccionalDescripcion} (Deleg: ${r.refDelegacionDescripcion})`,
                  }
              )
          );
        },
        async (error) => {
          console.log("GetSeccionalLocalidadByRefLocalidadId_error", error);
          changes.error = error;
        },
        async () => applyChanges()
      )
      : request(
        {
          baseURL: "Afiliaciones",
          endpoint: "/Seccional/GetSeccionalesSpecs",
          body: seccionales.params,
          method: "POST",
        },
        async (ok) => {
          console.log("GetSeccionalesSpecs_ok", ok);
          changes.data.push({
            value: provinciaState?.value?.seccionalIdPorDefecto,
            label: provinciaState?.value?.seccionalDescripcionPorDefecto,
          });
          changes.data.push(
            ...ok.data
              .sort((a, b) => (a.descripcion > b.descripcion ? 1 : -1))
              .map(
                (r) =>
                  r.localidadCodPostal !== 99999 && {
                    value: r.id,
                    label: `${r.codigo} ${r.descripcion} (Deleg: ${r.refDelegacionDescripcion})`,
                  }
              )
          );
        },
        async (error) => {
          console.log("GetSeccionalesSpecs_error", error);
          changes.error = error;
        },
        async () => applyChanges()
      );
  }, [request, seccionales, provincias, provinciaState.value]);

  useEffect(() => {
    const processEstadosCiviles = async (estadosCivilesObj) => {
      const estadosCivilesSelect = estadosCivilesObj.map((estadoCivil) => {
        return { value: estadoCivil.id, label: estadoCivil.descripcion };
      });
      setEstadosCiviles(estadosCivilesSelect);
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/EstadoCivil`,
        method: "GET",
      },
      processEstadosCiviles
    );
  }, [request]);

  useEffect(() => {
    const processTiposDocumentos = async (tiposDocumentosObj) => {
      const tipoDocumentoSelect = tiposDocumentosObj.map((tipoDocumento) => {
        return { value: tipoDocumento.id, label: tipoDocumento.descripcion };
      });
      setTiposDocumentos(tipoDocumentoSelect);
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/TipoDocumento`,
        method: "GET",
      },
      processTiposDocumentos
    );
  }, [request]);

  //modificado Mauro
  useEffect(() => {
    const d = props?.data || {};
    if (d.cuil != null && d.cuil !== "") {
      dispatchCUIL({ type: "USER_INPUT", value: String(d.cuil) });
    }
    // Prefill CUIT Empleador desde Solicitud
    const cuitEmpresaInicial = d.cuitEmpresa ?? d.empresaCUIT ?? d.cuitEmpleador;
    if (cuitEmpresaInicial != null && String(cuitEmpresaInicial) !== "") {
      const limpio = String(cuitEmpresaInicial).replace(/[^\d]/g, "");
      dispatchCUIT({ type: "USER_INPUT", value: limpio });
      setCUITEmpresa(limpio);
    }
    if (d.estadoCivilId != null && d.estadoCivilId > 0) {
      dispatchEstadoCivil({ type: "USER_INPUT", value: d.estadoCivilId });
    }
    if (d.sexoId != null && d.sexoId > 0) {
      dispatchSexo({ type: "USER_INPUT", value: d.sexoId });
    }
    if (d.oficioId != null && d.oficioId > 0) {
      dispatchPuesto({ type: "USER_INPUT", value: d.oficioId });
    }
    if (d.actividadIdAfiliado != null && d.actividadIdAfiliado > 0) {
      dispatchActividad({ type: "USER_INPUT", value: d.actividadIdAfiliado });
    }
    if (d.email != null) {
      dispatchEmail({ type: "USER_INPUT", value: String(d.email) });
    }
    if (d.telefonoPais != null) {
      dispatchTelefonoPais({ type: "USER_INPUT", value: String(d.telefonoPais) });
    }
    if (d.telefonoArea != null) {
      dispatchTelefonoArea({ type: "USER_INPUT", value: String(d.telefonoArea) });
    }
    if (d.telefonoNumero != null) {
      dispatchTelefonoNumero({ type: "USER_INPUT", value: String(d.telefonoNumero) });
    }
    const provinciaIdFromSolicitud = d.provinciaId ?? d.provinciaIdSolicitudAfiliacion ?? null;
    const localidadValueFromSolicitud = d.localidadPrefill?.value ?? d.refLocalidadId ?? d.localidadId ?? null;
    const seccionalValueFromSolicitud = d.seccionalPrefill?.value ?? d.seccionalId ?? d.seccionalIdSolicitudAfiliacion ?? null;

    if (provinciaIdFromSolicitud) {
      setProvincias((o) => ({
        ...o,
        loading: "Cargando...",
        params: {},
        onLoaded: ({ data }) => {
          if (!Array.isArray(data)) return;
          
          let provinciaSelected = data.find((prov) => {
            if (!prov) return false;
            const provVal = prov.value;
            if (provVal != null && String(provVal) === String(provinciaIdFromSolicitud)) return true;
            if (prov.idProvinciaAFIP != null && String(prov.idProvinciaAFIP) === String(provinciaIdFromSolicitud)) return true;
            return false;
          }) ?? { value: provinciaIdFromSolicitud, label: d.provinciaDescripcion ?? d.provincia ?? "" };
          dispatchProvincia({ type: "USER_INPUT", value: provinciaSelected });

          // cargar localidades para la provincia indicada y seleccionar la correcta
          setLocalidades((o) => ({
            ...o,
            loading: "Cargando...",
            params: { provinciaId: provinciaSelected.value },
            onLoaded: ({ data }) => {
              if (!Array.isArray(data)) return;


   let localidadSelected = data.find((l) => l.value === localidadValueFromSolicitud);

   if (!localidadSelected) {
     const nombreDesdeSolicitud = (
       d.localidadPrefill?.label ||
       d.localidad ||
       d.localidadDescripcion ||
       ""
     )
       .toString()
       .trim()
       .toUpperCase();

     if (nombreDesdeSolicitud) {
       localidadSelected = data.find((l) => {
         const labelSinCP = String(l.label || "")
           .replace(/^\d+\s+/, "")
           .toUpperCase()
           .trim();
         return labelSinCP === nombreDesdeSolicitud;
       });
     }
   }

   if (!localidadSelected && localidadValueFromSolicitud) {
     const createdLocalidad = {
       value: localidadValueFromSolicitud,
       label:
         d.localidad ||
         d.localidadDescripcion ||
         String(localidadValueFromSolicitud),
     };
     setLocalidades((prev) => ({
       ...prev,
       data: [createdLocalidad, ...(Array.isArray(prev.data) ? prev.data : data)],
     }));
     localidadSelected = createdLocalidad;
   }

    if (!localidadSelected) {
      localidadSelected =
        data.find((l) => l.value === provinciaSelected?.localidadIdPorDefecto) ??
        data.at(0) ??
        {};
    }
            
              dispatchLocalidad({ type: "USER_INPUT", value: localidadSelected });

              setSeccionales((o) => ({
                ...o,
                loading: "Cargando...",
                params: localidadSelected?.value && localidadSelected?.value !== provinciaSelected?.localidadIdPorDefecto ? { localidadId: localidadSelected.value } : { provinciaId: provinciaSelected.value },
                onLoaded: ({ data }) => {
                  if (!Array.isArray(data)) return;
                  const seccionalSelected = data.find((s) => s.value === seccionalValueFromSolicitud) ?? data.at(0) ?? {};
                  dispatchSeccional({ type: "USER_INPUT", value: seccionalSelected });
                },
              }));
            },
          }));
        },
      }));
    } else {
      if (d.localidadPrefill) {
        dispatchLocalidad({ type: "USER_INPUT", value: d.localidadPrefill });
      }
      if (d.seccionalPrefill) {
        dispatchSeccional({ type: "USER_INPUT", value: d.seccionalPrefill });
      }
    }
  }, [props.data]);

  //#endregion

  //#region submit afiliado
  const afiliadoAgregarHandler = async () => {
    //event.preventDefault();

    setInputsTouched(true);
    if (
      !formularioIsValid ||
      !formularioEmpleadorIsValid ||
      !actividadState.isValid ||
      !seccionalSolicitudAfiliacionState.isValid
    ) {
      //console.log("formularioIsValid", formularioIsValid);
      setOpenDialog(true);
      TextCompletarCampos();
      return;
    }
    setAfiliadoProcesando(true);
    //#region Insertar Sol
    if (props.accion === "Agrega" && !afiliadoExiste) {
      // ::::::::::::::::::::::::::::::::: MODIFICADO :::::::::::::::::::::::::::::::::
  const domicilioAFIPEmpresa =
        padronEmpresaRespuesta?.domicilios?.find(
          (d) => d?.tipoDomicilio === "LEGAL/REAL"
        ) || padronEmpresaRespuesta?.domicilios?.[0];
  const cpIntEmpresaAlta = parseInt(domicilioAFIPEmpresa?.codigoPostal);

      const empresa = {
        cuit: cuitEmpresa,
        razonSocial: padronEmpresaRespuesta
          ? padronEmpresaRespuesta?.razonSocial ??
          `${padronEmpresaRespuesta?.apellido} ${padronEmpresaRespuesta?.nombre}`
          : "",
        claveTipo: padronEmpresaRespuesta.tipoClave,
        claveEstado: padronEmpresaRespuesta.estadoClave,
        claveInactivaAsociada: padronEmpresaRespuesta.claveInactivaAsociada,
        actividadPrincipalDescripcion:
          padronEmpresaRespuesta.descripcionActividadPrincipal,
        actividadPrincipalId: padronEmpresaRespuesta.idActividadPrincipal,
        actividadPrincipalPeriodo:
          padronEmpresaRespuesta.periodoActividadPrincipal,
        contratoSocialFecha: padronEmpresaRespuesta.fechaContratoSocial,
        cierreMes: padronEmpresaRespuesta.mesCierre,
        email: correoEmpresa,
        telefono: telefonoEmpresa,
        domicilioCalle: domicilioAFIPEmpresa?.calle?.toString()?.trim() || "sin dato",
        domicilioNumero: parseInt(domicilioAFIPEmpresa?.numero) || 0,
        domicilioPiso: "SIN DATO",
        domicilioDpto: "SIN DATO",
        domicilioSector: "SIN DATO",
        domicilioTorre: "SIN DATO",
        domicilioManzana: "SIN DATO",
        domicilioProvinciaId: domicilioAFIPEmpresa?.idProvincia ?? 0,
        domicilioLocalidadesId: 0,
  // Guardar CP con dos ceros al final
  domicilioCodigoPostal: isNaN(cpIntEmpresaAlta) ? 0 : cpIntEmpresaAlta * 100,
        domicilioCPA: "SIN DATO",
        domicilioTipo: domicilioAFIPEmpresa?.tipoDomicilio?.toString() || "sin dato",
        domicilioEstado: domicilioAFIPEmpresa?.estadoDomicilio?.toString() || "sin dato",
        domicilioDatoAdicional: domicilioAFIPEmpresa?.datoAdicional?.toString() || "sin dato",
        domicilioDatoAdicionalTipo:
          (domicilioAFIPEmpresa?.tipoDatoAdicional ?? domicilioAFIPEmpresa?.datoAdicionalTipo)?.toString() ||
          "sin dato",
        ciiU1: padronEmpresaRespuesta.ciiU1,
        ciiU2: padronEmpresaRespuesta.ciiU2,
        ciiU3: padronEmpresaRespuesta.ciiU3,
  };
  // ::::::::::::::::::::::::::::::::: FIN MODIFICADO :::::::::::::::::::::::::::::::::

      const forzarEstadoPendiente = !!props?.forzarEstadoPendiente;
      const validaAutomatica =
        !forzarEstadoPendiente &&
        ultimaDDJJ.data?.actividadTipo === "D" &&
        ultimaDDJJ.data?.modalidadTipo === "D" &&
        (padronEmpresaRespuesta?.ciiU1EsRural ||
          padronEmpresaRespuesta?.ciiU2EsRural ||
          padronEmpresaRespuesta?.ciiU3EsRural) &&
        tarea.hasTarea("Afiliaciones_AfiliadoAutoValida");

      const domicilioRealAFIP = padronRespuesta?.domicilios?.find(
        (domicilio) => domicilio?.tipoDomicilio === "LEGAL/REAL"
      );
      console.log("fechaIngresoState**", fechaIngresoState);
      const nuevoAfiliado = {
        cuil: +cuilState.value,
        nombre:
          nombreState.value ??
          `${padronRespuesta?.apellido ?? ""} ${padronRespuesta?.nombre ?? ""}`,
        /*nombre: `${padronRespuesta?.apellido ?? ""} ${
          padronRespuesta?.nombre ?? "" 
        }`,*/
        puestoId: +puestoState.value,
        fechaIngreso: fechaIngresoState?.value,
        fechaEgreso: null,
        nacionalidadId: +nacionalidadState.value,
        //empresaId: +empresaId,
        seccionalId: +seccionalState.value.value,
        sexoId: +sexoState.value,
        tipoDocumentoId: +tipoDocumentoState.value,
        documento: +numeroDocumentoState.value,
        actividadId: +actividadState.value,
        seccionalIdSolicitudAfiliacion:
          +seccionalSolicitudAfiliacionState.value.value,
        //estadoSolicitud: afiliado.estadoSolicitud,
        estadoSolicitudId: validaAutomatica ? 2 : 1,
        estadoSolicitudObservaciones: validaAutomatica
          ? "Validación Automática"
          : null,
        estadoCivilId: +estadoCivilState.value,
        refLocalidadId: localidadState?.value?.value, //?? padronRespuesta?.localidadId,
        domicilio: domicilioState.value,
        // telefono: telefonoState.value,
        telefonoPais: telefonoPaisState.value,
        telefonoArea: telefonoAreaState.value,
        telefonoNumero: telefonoNumeroState.value,
        correo: emailState.value,
        celular: "",
        fechaNacimiento: fechaNacimientoState.value,
        afipcuil: +cuilState.value,
        afipFechaNacimiento: padronRespuesta?.fechaNacimiento,
        afipNombre: padronRespuesta?.nombre ?? "",
        afipApellido: padronRespuesta?.apellido ?? "",
        afipRazonSocial: "",
        afipTipoDocumento: padronRespuesta?.tipoDocumento,
        afipNumeroDocumento: padronRespuesta?.numeroDocumento,
        afipTipoPersona: padronRespuesta?.tipoPersona,
        afipTipoClave: padronRespuesta?.tipoClave,
        afipEstadoClave: padronRespuesta?.estadoClave,
        afipClaveInactivaAsociada: 0,
        afipFechaFallecimiento:
          padronRespuesta?.fechaFallecimiento === "0001-01-01T00:00:00"
            ? null
            : padronRespuesta?.fechaFallecimiento,
        afipFormaJuridica: padronRespuesta?.formaJuridica,
        afipActividadPrincipal: padronRespuesta?.descripcionActividadPrincipal,
        afipIdActividadPrincipal: padronRespuesta?.idActividadPrincipal,
        afipPeriodoActividadPrincipal:
          padronRespuesta?.periodoActividadPrincipal,
        afipFechaContratoSocial: padronRespuesta?.fechaContratoSocial,
        afipMesCierre: padronRespuesta?.mesCierre,
        afipDomicilioDireccion: domicilioRealAFIP?.direccion,
        afipDomicilioCalle: domicilioRealAFIP?.calle,
        afipDomicilioNumero: domicilioRealAFIP?.numero,
        afipDomicilioPiso: domicilioRealAFIP?.piso,
        afipDomicilioDepto: domicilioRealAFIP?.oficinaDptoLocal,
        afipDomicilioSector: domicilioRealAFIP?.sector,
        afipDomicilioTorre: domicilioRealAFIP?.torre,
        afipDomicilioManzana: domicilioRealAFIP?.manzana,
        afipDomicilioLocalidad: domicilioRealAFIP?.localidad,
        afipDomicilioProvincia: domicilioRealAFIP?.descripcionProvincia,
        afipDomicilioIdProvincia: domicilioRealAFIP?.idProvincia,
        afipDomicilioCodigoPostal: domicilioRealAFIP?.codigoPostal,
        afipDomicilioTipo: domicilioRealAFIP?.tipoDomicilio,
        afipDomicilioEstado: domicilioRealAFIP?.estadoDomicilio,
        afipDomicilioDatoAdicional: domicilioRealAFIP?.datoAdicional,
        afipDomicilioTipoDatoAdicional: domicilioRealAFIP?.tipoDatoAdicional,
        empresa: empresa,
        CUILValidado: cuilValidado ? +cuilState.value : 0, //FER me pide que cuando es INSERT, no se guarde el CUILValidado.
        documentacion: documentacionList.map((r) => ({
          ...r,
          id: 0,
          entidadTipo: "A",
          entidadId: 0,
        })),
      };






      const afiliadoAgregar = async (afiliadoResponseObj) => {
        const estados = Array.isArray(props?.estadosSolicitudes)
          ? props.estadosSolicitudes
          : [];
        const estadoLabel = estados.find(
          (r) => r?.value === nuevoAfiliado?.estadoSolicitudId
        )?.label ?? ""; // fallback vacío para no romper

        setNuevoAfiliadoResponse({
          ...nuevoAfiliado,
          id: afiliadoResponseObj,
          estadoSolicitud: estadoLabel,
          empresaCUIT: cuitEmpresa,
        });






        setOpenDialog(true);
        //Si se incorpora automaticamente
        if (nuevoAfiliado.estadoSolicitudId === 2) {
          //setResolverSolicitudAfiliadoResponse(1);
          setDialogTexto(AFILIADO_AGREGADO_ACTIVO);
        }
        //pasa a resolver solicitud
        else {
          setDialogTexto(AFILIADO_AGREGADO); //SE AGREGAN LOS ITEMS QUE NO CUMPLE EL AFILIADO
        }
      };

      request(
        {
          baseURL: "Afiliaciones",
          endpoint: `/Afiliado`,
          method: "POST",
          body: nuevoAfiliado,
          headers: {
            "Content-Type": "application/json",
          },
        },
        afiliadoAgregar
      );
      //#endregion

      //#region Update Solicitud
    } else if (
      props.accion === "Modifica" ||
      (props.accion === "Agrega" && afiliadoExiste)
    ) {
      ActualizaDatosAfiliado();
    }
    setAfiliadoProcesando(false);
    //#endregion
  };
  //#endregion

  const { audit } = useAuditoriaProceso();

  const validaCUILHandler = (value) => {
    setCuilValidado(true);
    setDialogTexto(
      `Se ha validado el CUIL, confirme la ficha para guardar el cambio`
    );
    setOpenDialog(true);

    const config = {
      afiliado: { id: afiliado?.id },
      body: {
        CUILValidado: afiliado?.cuil,
      },
      cambios: [
        {
          op: "replace",
          path: "CUILValidado",
          value: afiliado?.cuil,
        },
      ],
    };
    audit({
      proceso: "AfiliadoValidaCUIL",
      parametros: flatten({ value: config }),
    });
  };

  //#region Operacions validar CUIT/CUIL
  const validarAfiliadoCUILHandler = () => {
    setCUILLoading(true);

    if (!fechaIngresoState.isValid) {
      //AGREGO ESTA LINEA AQUI, XQ SI FALLA LA CONSULTA AFIP NO SUGERIA LA FECHA INGRESO DEL DIA DE HOY
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const day = today.getDate();
      const fechaIngreso = year + "-" + month + "-" + day;
      dispatchFechaIngreso({
        type: "USER_INPUT",
        value: moment(fechaIngreso).format("yyyy-MM-DD"),
      });
    }

    //NUEVO PARA ALEX
    // Helper simple para descomponer teléfonos a País / Área / Número
    const parseTelefonoAR = (raw = "") => {
      const only = String(raw).replace(/[^\d+]/g, "");
      let telefonoPais = /^\+?\d{1,3}/.test(only) ? only.match(/^\+?\d{1,3}/)[0] : "+54";
      telefonoPais = telefonoPais.startsWith("+") ? telefonoPais : `+${telefonoPais}`;
      const rest = only.replace(/^\+?\d{1,3}/, "");
      const m = rest.match(/^0?(\d{2,4})(\d{5,8})$/) || [];
      const telefonoArea = m[1] || "";
      const telefonoNumero = m[2] || rest;
      return { telefonoPais, telefonoArea, telefonoNumero };
    };

    const processConsultaPadron = async (padronObj) => {

      console.log("padronObj", padronObj);
      setErrorAFIP(false);
      //moment(padronRespuesta?.fechaFallecimiento).includes("0001-01-01") ? null : padronRespuesta?.fechaFallecimiento,
      setCUILLoading(false);
      if (
        padronObj?.fechaFallecimiento &&
        padronObj?.fechaFallecimiento !== "0001-01-01T00:00:00"
      ) {
        setCUILLoading(false);
        setDialogTexto(`Error validando CUIL - Persona fallecida`);
        setOpenDialog(true);

        return;
      }

      !!afiliado?.cuilValidado === false &&
        padronObj.cuit &&
        !afiliadoExiste &&
        setCuilValidado(true); //SOLO DEBE VALIDAR EL CUIL Cuando el afiliado tiene un CUIL NO VALIDADO y la respuesta de AFIP es positiva
      setPadronRespuesta(padronObj);

      //Solo actualizo los datos principales si estoy agregando solicitud
      // fecha ingreso
      console.log("fechaIngresoState-*-", fechaIngresoState);
      if (!fechaIngresoState.isValid) {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const day = today.getDate();
        const fechaIngreso = year + "-" + month + "-" + day;
        dispatchFechaIngreso({
          type: "USER_INPUT",
          value: moment(fechaIngreso).format("yyyy-MM-DD"),
        });
        console.log(
          "fecha ingreso:",
          moment(fechaIngreso).format("yyyy-MM-DD")
        );
      }
      let domicilioReal = "";

      if (props.accion === "Agrega") {
        dispatchNombre({
          type: "USER_INPUT",
          value: `${padronObj.apellido} ${padronObj.nombre ?? ""}`,
        });
        dispatchFechaNacimiento({
          type: "USER_INPUT",
          value: moment(padronObj.fechaNacimiento).format("yyyy-MM-DD"),
        });

        //tipo doc
        const tipoDoc = tiposDocumentos.filter(
          (tipoDoc) => tipoDoc.label === padronObj.tipoDocumento
        );
        dispatchTipoDocumento({
          type: "USER_INPUT",
          value: tipoDoc[0]?.value ?? "",
        });
        dispatchNumeroDocumento({
          type: "USER_INPUT",
          value: padronObj.numeroDocumento,
        });
        domicilioReal = padronObj?.domicilios?.find(
          (domicilio) => domicilio.tipoDomicilio === "LEGAL/REAL"
        );

        dispatchDomicilio({
          type: "USER_INPUT",
          value: domicilioReal.direccion,
        });
        const argentina = nacionalidades?.find(
          (nacionalidad) => nacionalidad.label.toUpperCase() === "ARGENTINA"
        );

        dispatchNacionalidad({
          type: "USER_INPUT",
          value: argentina?.value,
        });

        if (!(props?.data?.actividadIdAfiliado > 0) && !actividadState?.value) {
          dispatchActividad({
            type: "USER_INPUT",
            value: 1,
          });
        }

        dispatchSeccionalSolicitudAfiliacion({
          type: "USER_INPUT",
          value: { value: 103423, label: "SIN ASIGNACION" }, //ID DE LA SECCIONA SIN ASIGNACION
        });

        if (!puestoState.isValid)
          dispatchPuesto({
            type: "USER_INPUT",
            value: 99999,
          });
        //provincia

        // Selección robusta de provincia
        if (!props.autoValidaDesdeSolicitud) {
          let provinciaSelected = null;
          if (domicilioReal) {
            const sinDescripcion =
              domicilioReal.idProvincia === 0 &&
              (domicilioReal.descripcionProvincia === null ||
                domicilioReal.descripcionProvincia === "");
            provinciaSelected = sinDescripcion
              ? provincias?.data?.find((p) => p?.idProvinciaAFIP === 99999)
              : provincias?.data?.find(
                  (p) => p?.idProvinciaAFIP === domicilioReal?.idProvincia
                );
          }
          if (!provinciaSelected) {
            provinciaSelected =
              provincias?.data?.find((p) => p?.idProvinciaAFIP === 99999) ||
              provincias?.data?.at?.(0) ||
              null;
          }

          if (provinciaSelected) {
            dispatchProvincia({ type: "USER_INPUT", value: provinciaSelected });
          }
          if (provinciaSelected?.idProvinciaAFIP === 99999) {
            dispatchLocalidad({
              type: "USER_INPUT",
              value: {
                value: provinciaSelected.localidadIdPorDefecto,
                label: provinciaSelected.localidadDescripcionPorDefecto,
              },
            });
            dispatchSeccional({
              type: "USER_INPUT",
              value: {
                value: provinciaSelected.seccionalIdPorDefecto,
                label: provinciaSelected.seccionalDescripcionPorDefecto,
              },
            });
          } else {
            const localidadCodPostal =
              domicilioReal.codigoPostal !== "0000"
                ? domicilioReal.codigoPostal
                : null;
            const processLocalidades = async (localidadesObj) => {
              let localidad;
              if (!localidad) {
                localidad = localidadesObj?.find((localidad) => {
                  if (
                    localidad.nombre === domicilioReal.localidad &&
                    localidad.codPostal
                      .toString()
                      .includes(domicilioReal.codigoPostal)
                  )
                    return localidad;
                });
              }

              if (!localidad) {
                localidad = localidadesObj?.find((localidad) => {
                  if (
                    localidad.nombre.includes(domicilioReal.localidad) &&
                    localidad.codPostal
                      .toString()
                      .includes(domicilioReal.codigoPostal)
                  )
                    return localidad;
                });
              }

              if (!localidad) {
                localidad = localidadesObj?.find((localidad) => {
                  if (localidad.id === provinciaSelected?.localidadIdPorDefecto)
                    return localidad;
                });
              }
              if (!localidad) {
                localidad = { id: provinciaSelected?.localidadIdPorDefecto };
              }

              setLocalidades((o) => ({
                ...o,
                loading: "Cargando...",
                params: provinciaSelected
                  ? { provinciaId: provinciaSelected?.id }
                  : {},
                onLoaded: ({ data }) => {
                  if (!Array.isArray(data)) return;

                  const myLocalidad =
                    data.find((l) => l.value === localidad?.id) ??
                    data.at(0) ??
                    {};

                  dispatchLocalidad({ type: "USER_INPUT", value: myLocalidad });

                  setSeccionales((o) => ({
                    ...o,
                    loading: "Cargando...",
                    params:
                      myLocalidad?.value !==
                        provinciaSelected?.localidadIdPorDefecto
                        ? { localidadId: myLocalidad?.value }
                        : { provinciaId: provinciaSelected?.id } ?? {},
                    onLoaded: ({ data }) => {
                      const mySeccionalId =
                        myLocalidad?.value ===
                          provinciaSelected?.localidadIdPorDefecto
                          ? data.at(0)
                          : data.at(1)
                            ? data.at(1)
                            : data.at(0);

                      dispatchSeccional({
                        type: "USER_INPUT",
                        value: mySeccionalId,
                      });
                    },
                  }));
                },
              }));
            };

            request(
              {
                baseURL: "Afiliaciones",
                endpoint: `/RefLocalidad?ProvinciaId=${provinciaSelected.id}`,
                method: "GET",
              },
              processLocalidades
            );
          }
        }
      }

      if (props.accion === "Modifica") {
        if (!fechaNacimientoState.isValid) {
          dispatchFechaNacimiento({
            type: "USER_INPUT",
            value: moment(padronObj.fechaNacimiento).format("yyyy-MM-DD"),
          });
        }

        ActualizaDatosAfip(padronObj);
      }

      //Agregado Mauro
      // Email (si AFIP trae algo)
      if (padronObj?.email && typeof dispatchEmail === "function") {
        dispatchEmail({ type: "USER_INPUT", value: String(padronObj.email) });
      }

      // Teléfono (si AFIP trae algo)
      const telRaw = padronObj?.telefono || padronObj?.celular;
      if (telRaw && typeof dispatchTelefonoNumero === "function") {
        const { telefonoPais, telefonoArea, telefonoNumero } = parseTelefonoAR(telRaw);
        if (typeof dispatchTelefonoPais === "function") {
          dispatchTelefonoPais({ type: "USER_INPUT", value: telefonoPais });
        }
        if (typeof dispatchTelefonoArea === "function") {
          dispatchTelefonoArea({ type: "USER_INPUT", value: telefonoArea });
        }
        dispatchTelefonoNumero({ type: "USER_INPUT", value: telefonoNumero });
      }


      setCUILLoading(false);
      setInputsTouched(true);
    };

    request(
      {
        baseURL: "Comunes",
        endpoint: `/AFIPConsulta?CUIT=${afiliado?.cuilValidado ? afiliado?.cuilValidado : cuilState.value
          }&VerificarHistorico=${false}`,
        method: "GET",
      },
      async (response) => {
        processConsultaPadron(response);
        setConsultaPadronCUILOk(true);
      }
    );
  };

  const validarEmpresaCUITHandler = () => {
    setCUITLoading(true);
    const processConsultaPadron = async (padronObj) => {
      console.log("validarEmpresaCUITHandler_padronObj", padronObj);
      setCuitValidado(true);
      setPadronEmpresaRespuesta(padronObj);
      setCUITEmpresa(padronObj.cuit);
      setRazonSocialEmpresa(
        padronObj?.razonSocial ?? `${padronObj?.apellido} ${padronObj?.nombre}`
      );
      setActividadEmpresa(padronObj?.descripcionActividadPrincipal ?? "");
      setDomicilioEmpresa(
        padronObj ? `${padronObj?.domicilios[0]?.direccion}` : ""
      );
      setLocalidadEmpresa(
        padronObj
          ? padronObj?.domicilios[1]?.localidad ??
          padronObj?.domicilios[1]?.descripcionProvincia
          : ""
      );
      //ciius
      setCUITLoading(false);
    };

    request(
      {
        baseURL: "Comunes",
        endpoint: `/AFIPConsulta?CUIT=${cuitEmpresa}&VerificarHistorico=${["30", "33", "34"].includes(cuitEmpresa.toString) ? true : false
          }`,
        method: "GET",
      },
      processConsultaPadron
    );
  };
  //#endregion

  // Auto consulta AFIP para CUIT empleador cuando viene prellenado desde Solicitud
  useEffect(() => {
    if (autoVerificaCUITEmpresaRef.current) return;
    if (props.accion !== "Agrega") return;
    if (!props.autoValidaDesdeSolicitud) return;
    if (!cuitState?.isValid) return;
    if (padronEmpresaRespuesta) return;
    if (cuitLoading) return;
    autoVerificaCUITEmpresaRef.current = true;
    try {
      validarEmpresaCUITHandler();
    } catch (e) {
      console.warn("Auto verificación CUIT empleador falló:", e);
      autoVerificaCUITEmpresaRef.current = false; 
    }

  }, [cuitState.isValid, padronEmpresaRespuesta, cuitLoading, props.accion, props.autoValidaDesdeSolicitud]);

  //#region handlers change select
  const handleChangeSelect = (value, name) => {
    console.log("handleChangeSelect_value", value);
    console.log("handleChangeSelect_name", name);

    switch (name) {
      case "actividadSelect":
        dispatchActividad({ type: "USER_INPUT", value: value });
        break;

      case "seccionalDescripcionSolicitudAfiliacionSelect":
        if (seccionalSolicitudAfiliacionState.value === value) break;
        dispatchSeccionalSolicitudAfiliacion({
          type: "USER_INPUT",
          value: value,
        });
        break;

      case "puestoSelect":
        dispatchPuesto({ type: "USER_INPUT", value: value });
        break;

      case "nacionalidadSelect":
        dispatchNacionalidad({ type: "USER_INPUT", value: value });
        break;

      case "sexoSelect":
        dispatchSexo({ type: "USER_INPUT", value: value });
        break;

      case "seccionalSelect":
        if (seccionalState.value === value) break;
        dispatchSeccional({ type: "USER_INPUT", value });
        break;

      case "estadoCivilSelect":
        dispatchEstadoCivil({ type: "USER_INPUT", value: value });
        break;

      case "tipoDocumentoSelect":
        dispatchTipoDocumento({ type: "USER_INPUT", value: value });
        break;

      case "provinciaSelect":
        if (provinciaState.value === value) break;

        dispatchProvincia({ type: "USER_INPUT", value });

        setLocalidades((o) => ({
          ...o,
          loading: "Cargando...",
          params: value ? { provinciaId: value?.value } : {}, //CARGO EN EL COMBO DE LOCALIDADES, TODAS LAS LOCALIDADDES DE LA PROV
          onLoaded: ({ data }) => {
            //
            if (!Array.isArray(data)) return;

            //const myLocalidad = data.find((l) => l.value === localidad?.id) ?? data.at(0) ?? {}; //si encuentra la localidad en las optiosn, la selecciona, sino selecciona por defecto.

            console.log("data_localidades_change", data);
            dispatchLocalidad({ type: "USER_INPUT", value: data.at(0) ?? {} });

            setSeccionales((o) => ({
              ...o,
              loading: "Cargando...",
              params: value ? { provinciaId: value?.value } : {},
              onLoaded: ({ data }) => {
                //console.log('provinciaSelect_SeccionalesData:',data)
                if (!Array.isArray(data)) return;
                dispatchSeccional({
                  type: "USER_INPUT",
                  value: data.at(0) ?? {},
                });
              },
            }));
          },
        }));
        break;

      case "localidadSelect":
        dispatchLocalidad({ type: "USER_INPUT", value });

        if (localidadState.value === value) break;

        setSeccionales((o) => ({
          ...o,
          loading: "Cargando...",
          params:
            localidades?.data?.at(0) === value
              ? { provinciaId: provinciaState?.value?.value }
              : { localidadId: value?.value } ?? {},
          onLoaded: ({ data }) => {
            const mySeccionalId =
              value === localidades?.data?.at(0)
                ? data.at(0)
                : data.at(1)
                  ? data.at(1)
                  : data.at(0);

            dispatchSeccional({ type: "USER_INPUT", value: mySeccionalId });
          },
        }));
        break;

      default:
        break;
    }
  };
  //#endregion

  //#region handles Inputs
  const handleInputChange = (value, id) => {

    switch (id) {
      case "fechaIngreso":
        dispatchFechaIngreso({ type: "USER_INPUT", value: value });
        break;
      case "cuil":
        const cuilLimpio = value?.replace(/[^\d]/gim, "")
        if (props.accion === "Modifica") {
          dispatchCUIL({
            type: "USER_INPUT",
            value: cuilLimpio,
            isValid: ["30", "33", "34"].includes(value?.toString()?.slice(0, 2))
              ? false
              : ValidarCUIT(cuilLimpio),
          });
          setCuilValidado(false);
        } else {
          setCuilValidado(false);
          setAfiliadoExiste(false);
          setAfiliado(null);
          afiliadoRef.current = null;
          setNuevoAfiliadoResponse(null);
          setDialogTexto("");
          setPadronRespuesta(null);
          setCUITEmpresa("");
          dispatchCUIL({
            type: "USER_INPUT",
            value: cuilLimpio,
            isValid: ["30", "33", "34"].includes(value?.toString()?.slice(0, 2))
              ? false
              : ValidarCUIT(cuilLimpio),
          });
          dispatchNombre({ type: "USER_INPUT", value: "" });
          dispatchNacionalidad({ type: "USER_INPUT", value: "" });
          dispatchFechaNacimiento({ type: "USER_INPUT", value: null });
          //dispatchFechaIngreso({ type: "USER_INPUT", value: null }); //SI HABILITO ESTO, NO SUGIERE LA FECHA INGRESO CUANDO SE ABRE LA FICHA
          dispatchEstadoCivil({ type: "USER_INPUT", value: "" });
          dispatchSexo({ type: "USER_INPUT", value: "" });
          dispatchTipoDocumento({ type: "USER_INPUT", value: "" });
          dispatchNumeroDocumento({ type: "USER_INPUT", value: "" });
          dispatchDomicilio({ type: "USER_INPUT", value: "" });
          dispatchProvincia({ type: "USER_INPUT", value: "" });
          dispatchLocalidad({ type: "USER_INPUT", value: "" });
          dispatchSeccional({ type: "USER_INPUT", value: "" });
          // dispatchTelefono({ type: "USER_INPUT", value: "" });
          dispatchTelefonoPais({ type: "USER_INPUT", value: "" });
          dispatchTelefonoArea({ type: "USER_INPUT", value: "" });
          dispatchTelefonoNumero({ type: "USER_INPUT", value: "" });
          dispatchEmail({ type: "USER_INPUT", value: "" });
          dispatchPuesto({ type: "USER_INPUT", value: "" });
          dispatchActividad({ type: "USER_INPUT", value: "" });
          dispatchSeccionalSolicitudAfiliacion({
            type: "USER_INPUT",
            value: "",
          });
        }
        setConsultaPadronCUILOk(false);

        break;

      case "nombre":
        dispatchNombre({ type: "USER_INPUT", value: value });
        break;

      case "fechaNacimiento":
        const today = new Date();
        const month = (today.getMonth() + 1).toString().padStart(2, "0");
        const year = today.getFullYear();
        const day = today.getDate().toString().padStart(2, "0");

        const fechaFormateadaHoy = year + "-" + month + "-" + day;

        if (fechaFormateadaHoy === value || value === fechaIngresoState.value) {
          setDialogTexto(`La fecha de nacimiento ${value} es incorrecta`);
          setOpenDialog(true);
          break;
        }

        dispatchFechaNacimiento({ type: "USER_INPUT", value: value });
        break;

      case "numeroDocumento":
        //const nroDocLimpio = value?.replace(/[^\d]/gim, "")
        dispatchNumeroDocumento({
          type: "USER_INPUT",
          value: value,
        });
        break;

      case "domicilio":
        dispatchDomicilio({ type: "USER_INPUT", value: value });
        break;

      // case "telefono":
      //   dispatchTelefono({ type: "USER_INPUT", value:value });
      //   break;

      case "telefonoPais":
        dispatchTelefonoPais({ type: "USER_INPUT", value: value });
        break;

      case "telefonoArea":
        dispatchTelefonoArea({ type: "USER_INPUT", value: value });
        break;

      case "telefonoNumero":
        dispatchTelefonoNumero({ type: "USER_INPUT", value: value });
        break;

      case "correo":
        dispatchEmail({ type: "USER_INPUT", value: value });
        break;

      case "cuit":
        setCuitValidado(false);
        dispatchCUIT({ type: "USER_INPUT", value: value });
        setCUITEmpresa(value);
        setPadronEmpresaRespuesta(null);
        setRazonSocialEmpresa("");
        setActividadEmpresa("");
        setDomicilioEmpresa("");
        setLocalidadEmpresa("");
        setTelefonoEmpresa("");
        setCorreoEmpresa("");
        setLugarTrabajoEmpresa("");
        //ciius
        break;

      case "telefonoEmpresa":
        setTelefonoEmpresa(value);
        break;

      case "correoEmpresa":
        setCorreoEmpresa(value);
        break;

      default:
        break;
    }
  };
  //#endregion

  //#region handle Focus
  const handleOnFocus = (id) => {
    //console.log("foco en", id);
    // switch (id) {
    //   case "cuil":
    //     setCuilTouched(true);
    //     break;
    //   case "numeroDocumento":
    //     setNumeroDocumentoTouched(true);
    //     break;
    //   case "cuit":
    //     setCuitTouched(true);
    //     break;
    //   default:
    //     break;
    // }
  };
  //#endregion

  //#region handle Close
  const handleCerrarModal = (refresh) => {
    console.log("dialogTexto", dialogTexto);
    console.log("props.accion", props.accion);

    if (dialogTexto === "") props?.onClose(false, "Cancela");
    else {
      props.accion == "Modifica"
        ? props?.onClose(afiliadoModificado, props.accion) //SI  MODIFICA AFIL, ENVIO EL AFILIADO MODIFICADO
        : props?.onClose(nuevoAfiliadoResponse, props.accion); //SI RESUELVE SOLICIT O AFILIADO ES NUEVO "Agrega", DEVUELVO nuevoAfiliadoResponse, EL COMPONENT PADRE SABRÁ QUE HACER SEGÚN EL ESTADO DEL AFILIADO.
    }
  };
  //#endregion

  //#region handle DDJJ
  const handleSeleccionDDJJ = (row) => {
    // setCUITEmpresa(row.cuit);
    // dispatchCUIT({ type: "USER_INPUT", value: row.cuit });
  };
  //#endregion

  //#region Handle tab change
  const handleChangeTab = (event, newValue) => {
    setSelectedTab(newValue);
    if (newValue === 2 && afiliado?.cuilValidado === 0 && !cuilValidado) {
      //-->TAB 2 = "DDJJ UATRE"
      setDialogTexto(`El Afiliado NO posee un CUIL VALIDADO`);
      setOpenDialog(true);
    }
  };
  //#endregion

  //#region Functions
  const deshabilitarBotonValidarCUIL = () => {
    if (afiliadoExiste && afiliado?.estadoSolicitudId === 3) {
      return true;
    }

    if (!cuilState.isValid) {
      return true;
    }

    return false;
  };

  const InputDisabled = (input) => {
    //VALIDO PRIMERO EL CAMPO CUIL
    if (input === "cuil") {
      if (/*props.accion === "Modifica" && */ afiliadoExiste && cuilValidado) {
        return true;
      }
    } else {
      if (
        props.accion === "Modifica" &&
        afiliadoExiste &&
        afiliado?.estadoSolicitudId === 3
      )
        return true;
      if (cuilState.value === "" || !cuilState.isValid) return true;
      //if (!consultaPadronCUILOk || ) return true;

      if (
        afiliadoExiste &&
        afiliado?.estadoSolicitudId !== 1 &&
        afiliado?.estadoSolicitudId !== 4 &&
        afiliado?.estadoSolicitudId !== 2
      )
        return true;
    }

    return false;
  };

  const AgregarModificarAfiliadoDisableHandler = () => {
    let disable = false;

    if (errorAFIP) disable = true;

    if (padronRespuesta?.tipoPersona == "JURIDICA") disable = true;

    if (afiliadoExiste && afiliado?.estadoSolicitudId === 3) disable = true; //si el afiliado está dado de baja, deshabilito el boton de confirmar

    // El fomulario debe ser valido para continuar
    if (!formularioIsValid) disable = true;
    // Debe cargar un cuil valido y un cuit valido para continuar
    if (!cuilState.isValid || !cuitState.isValid || !cuitValidado)
      disable = true;
    // Deshabilitar hasta comprobar ddjj
    if (ultimaDDJJ.data == null) disable = true;

    return disable;
  };

  const AgregarModificarAfiliadoTitulo = () => {
    if (
      props.accion === "Modifica" ||
      (props.accion === "Agrega" && afiliadoExiste)
    ) {
      AgregarModificarAfiliadoDisableHandler();
      return "MODIFICA AFILIADO";
    }

    return "AGREGA SOLICITUD";
  };

  //#endregion

  //#region Funciones actualizacion
  const ActualizaDatosAfiliado = () => {
    // ::::::::::::::::::::::::::::::::: MODIFICADO :::::::::::::::::::::::::::::::::
  const domicilioAFIPEmpresa =
      padronEmpresaRespuesta?.domicilios?.find(
        (d) => d?.tipoDomicilio === "LEGAL/REAL"
      ) || padronEmpresaRespuesta?.domicilios?.[0];
  const cpIntEmpresaMod = parseInt(domicilioAFIPEmpresa?.codigoPostal);

    const empresa = {
      cuit: cuitEmpresa,
      razonSocial: padronEmpresaRespuesta
        ? padronEmpresaRespuesta?.razonSocial ??
        `${padronEmpresaRespuesta?.apellido} ${padronEmpresaRespuesta?.nombre}`
        : "",
      claveTipo: padronEmpresaRespuesta.tipoClave,
      claveEstado: padronEmpresaRespuesta.estadoClave,
      claveInactivaAsociada: padronEmpresaRespuesta.claveInactivaAsociada,
      actividadPrincipalDescripcion:
        padronEmpresaRespuesta.descripcionActividadPrincipal,
      actividadPrincipalId: padronEmpresaRespuesta.idActividadPrincipal,
      actividadPrincipalPeriodo:
        padronEmpresaRespuesta.periodoActividadPrincipal,
      contratoSocialFecha: padronEmpresaRespuesta.fechaContratoSocial,
      cierreMes: padronEmpresaRespuesta.mesCierre,
      email: correoEmpresa,
      telefono: telefonoEmpresa,
      domicilioCalle: domicilioAFIPEmpresa?.calle?.toString()?.trim() || "sin dato",
      domicilioNumero: parseInt(domicilioAFIPEmpresa?.numero) || 0,
      domicilioPiso: "string",
      domicilioDpto: "string",
      domicilioSector: "string",
      domicilioTorre: "string",
      domicilioManzana: "string",
      domicilioProvinciaId: domicilioAFIPEmpresa?.idProvincia ?? 0,
      domicilioLocalidadesId: 0,
  // Guardar CP con dos ceros al final
  domicilioCodigoPostal: isNaN(cpIntEmpresaMod) ? 0 : cpIntEmpresaMod * 100,
      domicilioCPA: "string",
      domicilioTipo: domicilioAFIPEmpresa?.tipoDomicilio?.toString() || "sin dato",
      domicilioEstado: domicilioAFIPEmpresa?.estadoDomicilio?.toString() || "sin dato",
      domicilioDatoAdicional: domicilioAFIPEmpresa?.datoAdicional?.toString() || "sin dato",
      domicilioDatoAdicionalTipo:
        (domicilioAFIPEmpresa?.tipoDatoAdicional ?? domicilioAFIPEmpresa?.datoAdicionalTipo)?.toString() ||
        "sin dato",
      ciiU1: padronEmpresaRespuesta.ciiU1,
      ciiU2: padronEmpresaRespuesta.ciiU2,
      ciiU3: padronEmpresaRespuesta.ciiU3,
    };
    // ::::::::::::::::::::::::::::::::: FIN MODIFICADO :::::::::::::::::::::::::::::::::

    const domicilioRealAFIP = padronRespuesta?.domicilios?.find(
      (domicilio) => domicilio.tipoDomicilio === "LEGAL/REAL"
    );

    const afiliadoModificado = {
      id: nuevoAfiliadoResponse.id,
      cuil: +cuilState.value,
      CUILValidado: cuilValidado ? +cuilState.value : 0,

      nroAfiliado: +afiliado.nroAfiliado,
      nombre: nombreState.value,
      puestoId: +puestoState.value,
      fechaIngreso: fechaIngresoState.value,
      fechaEgreso: afiliado.fechaEgreso,
      nacionalidadId: +nacionalidadState.value,
      //empresaCUIT: +cuitEmpresa,
      seccionalId: +seccionalState.value.value,
      seccionalIdSolicitudAfiliacion:
        +seccionalSolicitudAfiliacionState.value.value,

      sexoId: +sexoState.value,
      tipoDocumentoId: +tipoDocumentoState.value,
      documento: +numeroDocumentoState.value,
      actividadId: +actividadState.value,
      estadoSolicitud: afiliado.estadoSolicitud,
      estadoSolicitudId: +afiliado.estadoSolicitudId,
      estadoSolicitudObservacion: afiliado.estadoSolicitudObservacion,
      estadoCivilId: +estadoCivilState.value,
      refLocalidadId: +localidadState.value.value, //?? padronRespuesta.localidadId,
      domicilio: domicilioState.value,
      // telefono: telefonoState.value,
      telefonoPais: telefonoPaisState.value,
      telefonoArea: telefonoAreaState.value,
      telefonoNumero: telefonoNumeroState.value,
      correo: emailState.value,
      celular: "",
      fechaNacimiento: fechaNacimientoState.value,
      afipcuil: +cuilState.value,
      afipFechaNacimiento:
        padronRespuesta !== null
          ? padronRespuesta.fechaNacimiento
          : afiliado.afipFechaFallecimiento,
      afipNombre:
        padronRespuesta !== null ? padronRespuesta.nombre : afiliado.afipNombre,
      afipApellido:
        padronRespuesta !== null
          ? padronRespuesta.apellido
          : afiliado.afipApellido,
      afipRazonSocial: "",
      afipTipoDocumento:
        padronRespuesta !== null
          ? padronRespuesta.tipoDocumento
          : afiliado.afipTipoDocumento,
      afipNumeroDocumento:
        padronRespuesta !== null
          ? padronRespuesta.numeroDocumento
          : afiliado.afipNumeroDocumento,
      afipTipoPersona:
        padronRespuesta !== null
          ? padronRespuesta.tipoPersona
          : afiliado.afipTipoPersona,
      afipTipoClave:
        padronRespuesta !== null
          ? padronRespuesta.tipoClave
          : afiliado.afipTipoClave,
      afipEstadoClave:
        padronRespuesta !== null
          ? padronRespuesta.estadoClave
          : afiliado.afipEstadoClave,
      afipClaveInactivaAsociada:
        padronRespuesta !== null
          ? padronRespuesta.claveInactivaAsociada
          : afiliado.afipClaveInactivaAsociada,
      afipFechaFallecimiento:
        padronRespuesta !== null
          ? padronRespuesta.fechaFallecimiento === "0001-01-01T00:00:00"
            ? null
            : padronRespuesta.fechaFallecimiento
          : afiliado.afipFechaFallecimiento,
      afipFormaJuridica:
        padronRespuesta !== null
          ? padronRespuesta.formaJuridica
          : afiliado.afip,
      afipActividadPrincipal:
        padronRespuesta !== null
          ? padronRespuesta.descripcionActividadPrincipal
          : afiliado.afip,
      afipIdActividadPrincipal:
        padronRespuesta !== null
          ? padronRespuesta.idActividadPrincipal
          : afiliado.afip,
      afipPeriodoActividadPrincipal:
        padronRespuesta !== null
          ? padronRespuesta.periodoActividadPrincipal
          : afiliado.afip,
      afipFechaContratoSocial:
        padronRespuesta !== null
          ? padronRespuesta.afipFechaContratoSocial
          : afiliado.afip,
      afipMesCierre:
        padronRespuesta !== null ? padronRespuesta.mesCierre : afiliado.afip,
      afipDomicilioDireccion:
        padronRespuesta !== null
          ? `${domicilioRealAFIP?.calle} ${domicilioRealAFIP?.numero}`
          : afiliado.afipDomicilioDireccion,
      afipDomicilioCalle:
        padronRespuesta !== null
          ? domicilioRealAFIP?.calle
          : afiliado.afipDomicilioCalle,
      afipDomicilioNumero:
        padronRespuesta !== null
          ? domicilioRealAFIP?.numero
          : afiliado.afipDomicilioNumero,
      afipDomicilioPiso:
        padronRespuesta !== null
          ? domicilioRealAFIP?.piso
          : afiliado.afipDomicilioPiso,
      afipDomicilioDepto:
        padronRespuesta !== null
          ? domicilioRealAFIP?.depto
          : afiliado.afipDomicilioDepto,
      afipDomicilioSector:
        padronRespuesta !== null
          ? domicilioRealAFIP?.sector
          : afiliado.afipDomicilioSector,
      afipDomicilioTorre:
        padronRespuesta !== null
          ? domicilioRealAFIP?.torre
          : afiliado.afipDomicilioTorre,
      afipDomicilioManzana:
        padronRespuesta !== null
          ? domicilioRealAFIP?.manzana
          : afiliado.afipDomicilioManzana,
      afipDomicilioLocalidad:
        padronRespuesta !== null
          ? domicilioRealAFIP?.localidad
          : afiliado.afipDomicilioLocalidad,
      afipDomicilioProvincia:
        padronRespuesta !== null
          ? domicilioRealAFIP?.provincia
          : afiliado.afipDomicilioProvincia,
      afipDomicilioIdProvincia:
        padronRespuesta !== null
          ? domicilioRealAFIP?.idProvincia
          : afiliado.afipDomicilioIdProvincia,
      afipDomicilioCodigoPostal:
        padronRespuesta !== null
          ? domicilioRealAFIP?.codigoPostal
          : afiliado.afipDomicilioCodigoPostal,
      afipDomicilioTipo:
        padronRespuesta !== null
          ? domicilioRealAFIP?.tipo
          : afiliado.afipDomicilioTipo,
      afipDomicilioEstado:
        padronRespuesta !== null
          ? domicilioRealAFIP?.estado
          : afiliado.afipDomicilioEstado,
      afipDomicilioDatoAdicional:
        padronRespuesta !== null
          ? domicilioRealAFIP?.datoAdicional
          : afiliado.afipDomicilioDatoAdicional,
      afipDomicilioTipoDatoAdicional:
        padronRespuesta !== null
          ? domicilioRealAFIP?.tipoDatoAdicional
          : afiliado.afipDomicilioTipoDatoAdicional,
      empresa: empresa,
      documentacion: documentacionList.map((r) => ({
        ...r,
        id: r.id ?? 0,
        entidadTipo: "A",
        entidadId: nuevoAfiliadoResponse.id,
      })),
    };
    console.log("afiliado modificado", afiliadoModificado);
    
    // Construir lista de cambios para auditoría
    const cambiosTexto = [];
    const mapearCampos = {
      cuil: "CUIL",
      CUILValidado: "CUIL Validado",
      nombre: "Nombre",
      puestoId: "Puesto",
      fechaIngreso: "Fecha Ingreso",
      nacionalidadId: "Nacionalidad",
      seccionalId: "Seccional",
      seccionalIdSolicitudAfiliacion: "Seccional Solicitud Afiliación",
      sexoId: "Sexo",
      tipoDocumentoId: "Tipo Documento",
      documento: "Documento",
      actividadId: "Actividad",
      estadoCivilId: "Estado Civil",
      refLocalidadId: "Localidad",
      domicilio: "Domicilio",
      telefonoPais: "Teléfono País",
      telefonoArea: "Teléfono Área",
      telefonoNumero: "Teléfono Número",
      correo: "Correo",
      fechaNacimiento: "Fecha Nacimiento"
    };

    const opcionesReferenciales = {
      puestoId: puestos,
      nacionalidadId: nacionalidades,
      seccionalId: seccionales.data,
      seccionalIdSolicitudAfiliacion: seccionalSolicitaAfiliacion,
      sexoId: sexos,
      tipoDocumentoId: tiposDocumentos,
      actividadId: actividades,
      estadoCivilId: estadosCiviles,
      refLocalidadId: localidades.data,
    };

    const camposDescripcionOriginal = {
      seccionalId: ["seccional", "seccionalDescripcion"],
      seccionalIdSolicitudAfiliacion: [
        "seccionalDescripcionSolicitudAfiliacion",
        "seccionalSolicitudAfiliacion",
      ],
      refLocalidadId: ["localidad", "localidadDescripcion"],
      puestoId: ["puestoDescripcion", "puesto"],
      nacionalidadId: ["nacionalidadDescripcion", "nacionalidad"],
      sexoId: ["sexoDescripcion", "sexo"],
      tipoDocumentoId: ["tipoDocumentoDescripcion", "tipoDocumento"],
      actividadId: ["actividadDescripcion", "actividad"],
      estadoCivilId: ["estadoCivilDescripcion", "estadoCivil"],
    };

    const describirValorAuditoria = (campo, valor, registro) => {
      if (valor === null || valor === undefined || valor === "") {
        return "vacío";
      }

      const opciones = opcionesReferenciales[campo];
      if (!opciones) return valor;

      const opcion = opciones.find(
        (item) => String(item?.value) === String(valor)
      );
      if (opcion?.label) return opcion.label;

      const descripcionOriginal = (camposDescripcionOriginal[campo] ?? [])
        .map((propiedad) => registro?.[propiedad])
        .find((descripcion) => descripcion);

      return descripcionOriginal ?? valor;
    };

    Object.keys(mapearCampos).forEach(campo => {
      const valorAnterior = afiliado?.[campo];
      const valorNuevo = afiliadoModificado[campo];
      
      if (valorAnterior != valorNuevo) {
        cambiosTexto.push(
          `${mapearCampos[campo]}: ${describirValorAuditoria(
            campo,
            valorAnterior,
            afiliado
          )} → ${describirValorAuditoria(campo, valorNuevo, afiliadoModificado)}`
        );
      }
    });

    const afiliadoModificar = async (afiliadoModificarResponseObj) => {
      setAfiliadoModificado(afiliadoModificado);
      setDialogTexto(AFILIADO_ACTUALIZADO);
      setOpenDialog(true);

      // Registrar auditoría de cambios en AuditoriasDatos
      if (cambiosTexto.length > 0 && afiliado?.guid) {
        const auditoriaBody = {
          Usuario: Usuario?.nombre || "Sistema",
          Tabla: "Afiliado",
          TablaIdentificador: afiliado.guid,
          Accion: "Modificación",
          Cambios: cambiosTexto.join("\r\n")
        };
        
        request(
          {
            baseURL: "Auditoria",
            endpoint: `/AuditoriasDatos/registrar`,
            method: "POST",
            body: auditoriaBody,
            headers: {
              "Content-Type": "application/json",
            },
          },
          (response) => console.log("✅ Auditoría guardada exitosamente:", response),
          (error) => console.error("❌ Error al guardar auditoría:", error)
        );
      } else {
        console.warn("⚠️ No se guardó auditoría:", { 
          tieneCambios: cambiosTexto.length > 0, 
          tieneGuid: !!afiliado?.guid 
        });
      }
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Afiliado`,
        method: "PUT",
        body: afiliadoModificado,
        headers: {
          "Content-Type": "application/json",
        },
      },
      afiliadoModificar
    );
  };

  const ActualizaDatosAfip = (padronObj) => {
    const patchModelo = ActualizarDatosAfip(padronObj);
    console.log("patchModelo", patchModelo);
    const actualizarDatosAfip = async () => {
      setDialogTexto(AFILIADO_DATOSAFIPACTUALIZADO);
      setOpenDialog(true);
    };

    request(
      {
        baseURL: "Afiliaciones",
        endpoint: `/Afiliado/ActualizarDatosAfip?Id=${afiliado?.id}`,
        method: "PATCH",
        body: patchModelo,
        headers: {
          "Content-Type": "application/json",
        },
      },
      actualizarDatosAfip
    );
  };
  //#endregion

  //#region Dialog or alert
  const handleCloseDialog = () => {
    setOpenDialog(false);
    if (
      dialogTexto.includes(AFILIADO_SOLICITUDRESUELTA) ||
      [
        AFILIADO_ACTUALIZADO,
        AFILIADO_AGREGADO,
        AFILIADO_AGREGADO_ACTIVO,
      ].includes(dialogTexto)
    ) {
      handleCerrarModal(true);
    }
  };
  //#endregion

  return (
    <>
      <div>
        <Dialog
          onClose={() => (setDialogTexto(""), handleCloseDialog())}
          open={openDialog}
        >
          <DialogContent dividers>
            <Typography gutterBottom style={{ whiteSpace: "pre-line" }}>
              {dialogTexto}
            </Typography>
            {props?.accion === "Agrega" &&
              !afiliadoExiste &&
              nuevoAfiliadoResponse?.estadoSolicitudId === 1 && (
                <div>
                  <Typography gutterBottom>
                    {" "}
                    {`El Afiliado NO debe tener una afiliación anterior con fecha de BAJA - ✔️`}
                  </Typography>
                  <Typography gutterBottom>
                    {" "}
                    {`El Afiliado debe tener, en sus DDJJ AFIP declaradas, Actividades y Modalidades de Contratación relacionadas al ámbito rural de la UATRE - ${ultimaDDJJ?.data?.actividadTipo === "D" &&
                      ultimaDDJJ?.data?.modalidadTipo === "D"
                      ? "✔️"
                      : "❌"
                      }`}
                  </Typography>
                  <Typography gutterBottom>
                    {" "}
                    {`El Empleador del Afiliado debe tener Actividades (CIIUs) de tipo rurales registradas en AFIP ${padronEmpresaRespuesta?.ciiU1EsRural ||
                      padronEmpresaRespuesta?.ciiU2EsRural ||
                      padronEmpresaRespuesta?.ciiU3EsRural
                      ? "✔️"
                      : "❌"
                      }`}
                  </Typography>
                  <Typography gutterBottom>
                    {" "}
                    {`Operador con permisos de Autovalidación ${usuarioTareaValidacionAutomatica ? "✔️" : "❌"
                      }`}
                  </Typography>
                </div>
              )}
          </DialogContent>
          <DialogActions>
            <Button
              className="botonAmarillo"
              onClick={() => (setDialogTexto(""), handleCloseDialog())}
            >
              Cierra
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <Modal onClose={handleCerrarModal}>
        <CabeceraABMAfiliado
          cuilState={cuilState}
          nombreState={nombreState}
          afiliadoExiste={afiliadoExiste}
          padronRespuesta={padronRespuesta}
          afiliado={afiliado}
          estadoSolicitudDescripcion={afiliado?.estadoSolicitud}
        />

        <div className={classes.div}>
          <Tabs
            value={selectedTab}
            onChange={handleChangeTab}
            aria-label="basic tabs example"
          >
            <Tab label="Datos Personales" />
            <Tab label="Datos Empleador" disabled={!formularioIsValid} />
            <Tab
              label="DDJJ UATRE"
              disabled={
                !cuilState.isValid ||
                !cuitState.isValid ||
                !cuitValidado ||
                !formularioIsValid
              }
            />
            <Tab
              label="Documentacion"
              disabled={
                !cuilState.isValid ||
                !cuitState.isValid ||
                !cuitValidado ||
                !formularioIsValid
              }
            />
          </Tabs>
        </div>
        {
          [
            //Datos Principales
            <div className={classes.div}>
              <div className={classes.renglon}>
                <div className={classes.input50} style={{ gap: "1%" }}>
                  <div>
                    <InputMaterial
                      id="cuil"
                      onFocus={handleOnFocus}
                      value={cuilState.value}
                      label="CUIL"
                      //mask="99\-99\.999\.999\-9"
                      mask={CUITMask}
                      disabled={InputDisabled("cuil")}
                      onChange={handleInputChange}
                      error={
                        !cuilState.isValid && cuilState.value.length != ""
                          ? true
                          : false
                      }
                      helperText={
                        !cuilState.isValid && cuilState.value != ""
                          ? "CUIL Inválido"
                          : ""
                      }
                    />
                  </div>
                  <div style={{ minWidth: "max-content" }}>
                    <Button
                      className="botonAzul"
                      heigth={70}
                      disabled={deshabilitarBotonValidarCUIL()}
                      tarea="Afiliaciones_ValidaCUIL"
                      onClick={validarAfiliadoCUILHandler}
                      loading={cuilLoading}
                      underlineindex={0}
                    >
                      {!cuilLoading ? `Verifica CUIL AFIP` : `Verificando...`}
                    </Button>
                  </div>
                  <div style={{ minWidth: "max-content" }}>
                    <Button
                      className="botonAzul"
                      heigth={70}
                      //disabled={afiliadoExiste ? !!cuilValidado || !cuilState.isValid : true}
                      disabled={
                        cuilValidado == false &&
                          padronRespuesta?.cuit &&
                          afiliadoExiste
                          ? false
                          : true
                      }
                      tarea="Afiliaciones_AsignaCUILValidado"
                      onClick={() => validaCUILHandler()}
                      underlineindex={0}
                    >
                      Valida CUIL
                    </Button>
                  </div>
                </div>

                <div className={classes.input25}>
                  <InputMaterial
                    id="nroAfiliado"
                    value={afiliado?.nroAfiliado}
                    label="Nro Afiliado"
                    onChange={handleInputChange}
                    readOnly={true}
                  />
                </div>
                <div className={classes.input25}>
                  <DateTimePicker
                    type="date"
                    id="fechaIngreso"
                    value={fechaIngresoState.value}
                    label="Fecha Ingreso"
                    maxDate={moment().format("YYYY-MM-DD")}
                    disabled={InputDisabled()}
                    onChange={(f) =>
                      handleInputChange(
                        f?.format("YYYY-MM-DD") ?? "",
                        "fechaIngreso"
                      )
                    }
                    error={
                      !fechaIngresoState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>
              </div>
              <div className={classes.renglon}>
                <div className={classes.input}>
                  <InputMaterial
                    id="nombre"
                    value={nombreState.value ?? ""}
                    label="Apellido y Nombre"
                    width={100}
                    onChange={handleInputChange}
                    disabled={InputDisabled()}
                    error={!nombreState.isValid && inputsTouched ? true : false}
                  />
                </div>
                <div className={classes.input25}>
                  <SelectMaterial
                    name="tipoDocumentoSelect"
                    value={tipoDocumentoState.value}
                    options={tiposDocumentos}
                    label="Tipo Documento"
                    disabled={InputDisabled()}
                    onChange={handleChangeSelect}
                    //width={98}
                    error={
                      !tipoDocumentoState.isValid && inputsTouched
                        ? true
                        : false
                    }
                    helperText
                  />
                </div>
                <div className={classes.input25}>
                  <InputMaterial
                    id="numeroDocumento"
                    onFocus={handleOnFocus}
                    value={numeroDocumentoState.value}
                    label="Numero Documento"
                    disabled={InputDisabled()}
                    mask={DNIMask}
                    //width={96}
                    onChange={handleInputChange}
                    error={
                      !numeroDocumentoState.isValid && inputsTouched
                        ? true
                        : false
                    }
                  />
                </div>
              </div>
              <div className={classes.renglon}>
                <div className={classes.input25}>
                  <DateTimePicker
                    type="date"
                    id="fechaNacimiento"
                    value={fechaNacimientoState.value}
                    label="Fecha de Nacimiento"
                    maxDate={moment().format("YYYY-MM-DD")}
                    disabled={InputDisabled()}
                    onChange={(f) =>
                      handleInputChange(
                        f?.format("YYYY-MM-DD") ?? "",
                        "fechaNacimiento"
                      )
                    }
                    error={
                      !fechaNacimientoState.isValid && inputsTouched
                        ? true
                        : false
                    }
                  />
                </div>
                <div className={classes.input25}>
                  <SelectMaterial
                    name="nacionalidadSelect"
                    label="Nacionalidad"
                    options={nacionalidades}
                    value={nacionalidadState.value}
                    defaultValue={nacionalidades[0]}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    error={
                      !nacionalidadState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>
                <div className={classes.input25}>
                  <SelectMaterial
                    name="estadoCivilSelect"
                    label="Estado Civil"
                    options={estadosCiviles}
                    value={estadoCivilState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    //width={100}
                    error={
                      !estadoCivilState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>
                <div className={classes.input25}>
                  <SelectMaterial
                    name="sexoSelect"
                    label="Genero"
                    options={sexos}
                    value={sexoState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    //width={100}
                    error={!sexoState.isValid && inputsTouched ? true : false}
                  />
                </div>
              </div>
              <div className={classes.renglon}>
                <div className={classes.input}>
                  <InputMaterial
                    id="domicilio"
                    value={domicilioState.value}
                    label="Domicilio"
                    disabled={InputDisabled()}
                    onChange={handleInputChange}
                    error={
                      !domicilioState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>

                <div className={classes.input}>
                  <SearchSelectMaterial
                    name="provinciaSelect"
                    label="Provincia"
                    options={provincias.data}
                    value={provinciaState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    error={
                      !provinciaState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>
                <div className={classes.input}>
                  <SearchSelectMaterial
                    name="localidadSelect"
                    label="Localidad"
                    options={localidades.data}
                    value={localidadState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    error={
                      !localidadState.isValid && inputsTouched ? true : false
                    }
                  //defaultValue={localidades[0]?.value ?? {}}
                  />
                </div>
              </div>

              <div className={classes.renglon}>
                <div className={classes.input}>
                  <SearchSelectMaterial
                    name="seccionalSelect"
                    label="Seccional"
                    options={seccionales.data}
                    value={seccionalState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    error={
                      !seccionalState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>
                <div className={classes.input25}>
                  <SelectMaterial
                    name="puestoSelect"
                    label="Oficio"
                    options={puestos}
                    value={puestoState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                  //error={!puestoState.isValid && inputsTouched ? true : false}
                  />
                </div>
                <div className={classes.input25}>
                  <SelectMaterial
                    name="actividadSelect"
                    label="Actividad"
                    options={actividades}
                    value={actividadState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    error={
                      !actividadState.isValid && inputsTouched ? true : false
                    }
                  />
                </div>
              </div>

              <div className={classes.renglon}>
                <div className={classes.input}>
                  {/* <InputMaterial
                    id="telefono"
                    value={telefonoState.value}
                    label="Telefono/Celular"
                    disabled={InputDisabled()}
                    width={100}
                    onChange={handleInputChange}
                  /> */}
                  <InputMaterial
                    id="telefonoPais"
                    value={telefonoPaisState.value}
                    label="País"
                    disabled={InputDisabled()}
                    width={20}
                    onChange={handleInputChange}
                  />
                  <InputMaterial
                    id="telefonoArea"
                    value={telefonoAreaState.value}
                    label="Área"
                    disabled={InputDisabled()}
                    width={25}
                    onChange={handleInputChange}
                  />
                  <InputMaterial
                    id="telefonoNumero"
                    value={telefonoNumeroState.value}
                    label="Numero"
                    disabled={InputDisabled()}
                    width={55}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={classes.input}>
                  <InputMaterial
                    id="correo"
                    value={emailState.value}
                    label="Correo"
                    disabled={InputDisabled()}
                    width={100}
                    onChange={handleInputChange}
                    helperText={
                      !emailState.isValid &&
                        emailState.value !== "" &&
                        emailState.value !== null
                        ? "Email inválido"
                        : ""
                    }
                    error={
                      !emailState.isValid &&
                        emailState.value !== "" &&
                        emailState.value !== null
                        ? true
                        : false
                    }
                  />
                </div>

                <div className={classes.input}>
                  <SearchSelectMaterial //SelectMaterial
                    name="seccionalDescripcionSolicitudAfiliacionSelect"
                    label="Seccional Solicita Afiliación"
                    options={seccionalSolicitaAfiliacion}
                    value={seccionalSolicitudAfiliacionState.value}
                    onChange={handleChangeSelect}
                    disabled={InputDisabled()}
                    error={
                      !seccionalSolicitudAfiliacionState.isValid &&
                        inputsTouched
                        ? true
                        : false
                    }
                  />
                </div>
              </div>

              <DatosAfip
                afiliado={afiliado}
                padronRespuesta={padronRespuesta}
              />
            </div>,

            //Empleador
            <TabEmpleador
              afiliado={afiliado}
              padronEmpresaRespuesta={padronEmpresaRespuesta}
              cuitEmpresa={cuitEmpresa}
              cuitState={cuitState}
              cuitValidado={cuitValidado}
              cuitLoading={cuitLoading}
              razonSocialEmpresa={razonSocialEmpresa}
              actividadEmpresa={actividadEmpresa}
              domicilioEmpresa={domicilioEmpresa}
              localidadEmpresa={localidadEmpresa}
              telefonoEmpresa={telefonoEmpresa}
              correoEmpresa={correoEmpresa}
              lugarTrabajoEmpresa={lugarTrabajoEmpresa}
              inputsTouched={inputsTouched}
              onHandleInputChange={handleInputChange}
              onValidarEmpresaCUITHandler={validarEmpresaCUITHandler}
              onFocus={handleOnFocus}
            />,

            // DeclaracionesJuradas
            <DeclaracionesJuradas
              cuil={
                afiliado !== null
                  ? afiliado?.cuilValidado
                  : padronRespuesta?.cuit
                    ? padronRespuesta?.cuit
                    : 0
              } //EL CUIL de AFIP SE GUARDA EN EL padronRespuesta.CUIT
              cuit={cuitEmpresa}
              onSeleccionRegistro={handleSeleccionDDJJ}
              infoCompleta={true}
              // onDeclaracionesGeneradas={handleOnDeclaracionesGeneradas}
              registros={12}
            />,

            <Documentacion
              data={documentacionList}
              onChange={({ index, item }) => {
                const newDocList = [...documentacionList];
                if (index == null) {
                  // Create
                  newDocList.push(item);
                } else if (item == null) {
                  // Delete
                  newDocList.splice(index, 1);
                } else {
                  // Update
                  newDocList.splice(index, 1, item);
                }
                setDocumentacionList(newDocList);
              }}
            />,
          ][selectedTab]
        }
        <div className={classes.footer}>
          <Button
            className="botonAzul" /*className={classes.button}*/
            loading={afiliadoProcesando}
            width={25}
            onClick={afiliadoAgregarHandler}
            disabled={AgregarModificarAfiliadoDisableHandler()}
          >
            {AgregarModificarAfiliadoTitulo()}
          </Button>

          <Button
            className="botonAmarillo"
            width={25}
            onClick={handleCerrarModal}
          >
            CIERRA
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default AfiliadoAgregar;
