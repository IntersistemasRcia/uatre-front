import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Dropdown, Form, ListGroup, Row, Col, Alert } from "react-bootstrap";
import moment from "moment";
import UseKeyPress from "components/helpers/UseKeyPress";
import Button from "components/ui/Button/Button";
import Grid from "components/ui/Grid/Grid";
import InputMaterial from "components/ui/Input/InputMaterial";
import modalCss from "components/ui/Modal/Modal.module.css";
import classes from "./PreguntasForm.module.css";
// import { Dialog, DialogContent, Typography } from "@mui/material";


const onChangeDef = (changes = {}) => {};
const onCloseDef = (confirm = false) => {};

const PreguntasForm = ({
  data = {},
  title = "",
  disabled = {},
  hide = {},
  errors = {},
  onChange = onChangeDef,
  onClose = onCloseDef,
  loading = {},
  request = {},
  successMessage = null,
}) => {
  data ??= {};
  disabled ??= {};
  hide ??= {};
  errors ??= {};
  onChange ??= onChangeDef;
  onClose ??= onCloseDef;
  request ??= {};
  successMessage ??= null;

  console.log(
    "Este console, es de HIDE, en el archivo PREGUNTAªªª_FORM@@@@@@@@@@@@@@@@@|||||||||",
    hide
  );
  console.log(
    "Este console, es de request, en el archivo PREGUNTAªªª_FORM@@@@@@@@@@@@@@@@@|||||||||",
    request
  );
  console.log(
    "Este console, es de Seccionales_Data, en el archivo PREGUNTAªªª_FORM@@@@@@@@@@@@@@@@@||||||||| ",
    data
  );

  UseKeyPress(["Escape"], () => onClose());
  UseKeyPress(["Enter"], () => onClose(true), "AltKey");

  const [selectedOption, setSelectedOption] = useState(data.tipoPregunta || "Selecciona una opción");
  const [valorOrden, setValorOrden] = useState(data.ordenPregunta || "");
  const [enunciado, setEnunciado] = useState(data.enunciado || "");
  const [opciones, setOpciones] = useState(data.detalles || []);
  const [nuevoValor, setNuevoValor] = useState("");
  const [fecha, setFecha] = useState(moment().format("YYYY-MM-DD"));
  // El orden se calcula en usePreguntas. Este efecto sólo sincroniza los
  // controles locales para evitar ciclos de actualización al continuar la carga.
  useEffect(() => {
  setSelectedOption(data.tipoPregunta || "Selecciona una opción");
  setEnunciado(data.enunciado || "");
  setOpciones([
    ...new Map((data.detalles || []).map((o) => [o.id, o])).values(),
  ]);
  setFecha(data.fecha || moment().format("YYYY-MM-DD"));
  setValorOrden(data.ordenPregunta || "");
  setNuevoValor("");
}, [data]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange({ tipoPregunta: option }); // Actualiza el tipo de pregunta en el estado principal
    console.log("Opción seleccionada:", option);
  };

  const handleChangeEnunciado = (value) => {
    setEnunciado(value);
    onChange({ enunciado: value });
  };

  const handleChangeOrden = (value) => {
    setValorOrden(value);
    onChange({ ordenPregunta: value });
  };

  const agregarOpcion = () => {
    if (nuevoValor.trim() === "") return;
    const nuevaOpcion = { id: Date.now(), texto: nuevoValor };
    setOpciones([...opciones, nuevaOpcion]);
    onChange({ detalles: [...opciones, nuevaOpcion] }); // Actualiza los detalles en el estado principal
    setNuevoValor("");
  };

  const eliminarOpcion = (id) => {
    const nuevasOpciones = opciones.filter((opcion) => opcion.id !== id);
    setOpciones(nuevasOpciones);
    onChange({ detalles: nuevasOpciones }); // Actualiza los detalles en el estado principal
  };

  const handleEditOpcion = (id, newValue) => {
    const nuevasOpciones = opciones.map((opcion) =>
      opcion.id === id ? { ...opcion, texto: newValue } : opcion
    );
    setOpciones(nuevasOpciones);
    onChange({ detalles: nuevasOpciones }); // Actualiza los detalles en el estado principal
  };

  return (
    <>
      {/* <div>
        <Dialog onClose={() => setOpenDialog(false)} open={openDialog}>
          <DialogContent dividers>
            <Typography gutterBottom style={{ whiteSpace: "pre-line" }}>
              {dialogTexto}
            </Typography>
          </DialogContent>
        </Dialog>
      </div> */}
      <Modal show onHide={() => onClose()} size="lg" centered>
        <Modal.Header className={modalCss.modalCabecera}>
          <h3>{title}</h3>
        </Modal.Header>
        <Modal.Body>
          {successMessage || data.infoMessage ? (
            <Alert
              variant="success"
              style={{ marginBottom: 12 }}
              dismissible
              onClose={() => {
                onChange({ infoMessage: undefined });
              }}
            >
              {successMessage || data.infoMessage}
            </Alert>
          ) : null}
          
          <Grid col full gap="15px">
            {/* --------------AQUI EMPIEZA MI FORM--------------------------------- */}
            <Grid gap="inherit">
              <InputMaterial
                type="date"
                id="fecha"
                label="Fecha"
                value={fecha}
                error={!!errors.fecha}
                helperText={errors.fecha ?? ""}
                onChange={(e) => setFecha(e.target.value)}
                disabled={true}
              />
            </Grid>
            {/* ---------------------------------------------- */}
            <Grid width="full" gap="inherit">
              <InputMaterial
                id="enunciado"
                label="Enunciado"
                error={!!errors.enunciado}
                helperText={errors.enunciado ?? ""}
                value={enunciado}
                disabled={!["A", "M"].includes(request) || !!loading}
                onChange={(value) => handleChangeEnunciado(value)}
              />

              <Dropdown onSelect={handleSelect}>
                <Dropdown.Toggle
                  variant="secondary"
                  disabled={disabled.tipoPregunta ?? !hide.deletedObs}
                  id="dropdown-basic"
                >
                  {selectedOption}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="TX">Texto Libre</Dropdown.Item>
                  <Dropdown.Item eventKey="MC">Multiple Choice</Dropdown.Item>
                  <Dropdown.Item eventKey="OP">Opciones</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Grid>


            {/* ---------------------------------------------- */}
            <Grid width="full" gap="inherit">
              <Form.Group as={Row} className="align-items-center">
                <Col xs="auto">
                  <strong>Orden:</strong>
                </Col>
                <Col xs="auto">
                  <InputMaterial
                    id="ordenPregunta"
                    error={!!errors.ordenPregunta}
                    helperText={errors.ordenPregunta ?? false}
                    value={valorOrden}
                    disabled={disabled.ordenPregunta ?? false}
                    type="number"
                    style={{ width: "100px",marginBottom: "15px" }}
                    onChange={(value) => handleChangeOrden(value)}
                  />
                </Col>
              </Form.Group>
            </Grid>
            {/* ---------------------------------------------- */}
        {
          hide.deletedObs
            && (
            selectedOption === "MC" || selectedOption === "OP" ? (
              <div>
                {selectedOption === "MC" ? (
                  <strong>Multiple Choice:</strong>
                ) : (
                  <strong>Opciones:</strong>
                )}
                <ListGroup>
                 


                  {opciones.map((opcion) => (
                    <ListGroup.Item
                      key={opcion.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <Form.Control
                        type="text"
                        value={opcion.texto}
                        onChange={(e) => handleEditOpcion(opcion.id, e.target.value)}
                      />
                      <span
                        style={{ color: "red", cursor: "pointer" }}
                        onClick={() => eliminarOpcion(opcion.id)}
                      >
                        ✖
                      </span>
                    </ListGroup.Item>
                  ))}

                </ListGroup>
                <div className="d-flex mt-3">
                  <Form.Control
                   style={{marginBottom: "15px"}}
                    type="text"
                    placeholder="Agregar opción..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <Button
                    style={{marginBottom: "15px", marginLeft: "10px"}}
                    variant="primary"
                    onClick={agregarOpcion}
                    width={30}
                  
                    className="ms-2"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
              //---------------------------------------------------
            ) : null
            )
        }

            {/* ---------------------------------------------- */}
          </Grid>

        {/* Esto me muestra las opciones de baja de la pregunta seleccionada */}
          {!hide.deletedObs && (
            <>
              <div className={classes.item7}>
                <InputMaterial
                style={{marginBottom: "15px"}}
                  id="deletedDate"
                  label="Fecha Baja"
                  error={!!errors.deletedDate}
                  helperText={errors.deletedDate ?? ""}
                  
                  value={data.deletedDate}
                  disabled={disabled.deletedDate ?? false}
                  onChange={(value, _id) => onChange({ deletedDate: value })}
                />
              </div>
              <div className={classes.item8}>
                <InputMaterial
                style={{marginBottom: "15px"}}
                  id="deletedBy"
                  label="Usuario Baja"
                  error={!!errors.deletedBy}
                  helperText={errors.deletedBy ?? ""}
                  value={data.deletedBy}
                  disabled={disabled.deletedBy ?? false}
                  onChange={(value, _id) => onChange({ deletedBy: value })}
                />
              </div>
              <div className={classes.item9}>
                <InputMaterial
                style={{marginBottom: "15px"}}
                  id="deletedObs"
                  label="Observaciones Baja"
                  error={!!errors.deletedObs}
                  helperText={errors.deletedObs ?? ""}
                  value={data.deletedObs}
                  disabled={disabled.deletedObs ?? false}
                  onChange={(value, _id) => onChange({ deletedObs: value })}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button className="botonAzul" width={25} loading={!!loading} disabled={!!loading} onClick={() => onClose(true)}>
            CONFIRMA
          </Button>
          <Button className="botonAmarillo" width={30} disabled={!!loading} onClick={() => onClose(false)}>
            CERRAR
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PreguntasForm;
