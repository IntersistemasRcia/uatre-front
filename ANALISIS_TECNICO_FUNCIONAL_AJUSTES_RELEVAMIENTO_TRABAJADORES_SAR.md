# Análisis Técnico Funcional — Ajustes en Relevamiento de Trabajadores y SAR

## 1. Resumen del requerimiento

El AF `XnqWRi0s` solicita conservar y exponer las observaciones laboral y habitacional, el cargo SUBDELEGADO y la respuesta obligatoria `¿VIVE EN EL LUGAR?`; además define el flujo de carga de la aplicación y la consulta, actualización e impresión en SAR.

## 2. Interpretación funcional

- SAR debe mostrar el cargo y la respuesta habitacional recibidos, y mantener ambas observaciones en su sección funcional e impresión.
- La respuesta habitacional debe aparecer antes de los demás datos de vivienda.
- Los valores vacíos se muestran con el comportamiento visual vigente de SAR (`-` en el detalle/PDF); no se altera la longitud ni la persistencia de las observaciones.
- SUBDELEGADO se reconoce como código `SD` y también como valor textual `SUBDELEGADO` para su presentación.

## 3. Estado actual

El repositorio `uatre-front` es una aplicación React con Create React App y npm. La ruta `Inicio/Relevamiento` consume `App/Fiscalizaciones` y el detalle de trabajadores consume `App/FiscalizacionesTrabajador`.

- `RelevamientoDetails` y `PDF` traducían únicamente los códigos de cargo existentes; no reconocían SUBDELEGADO.
- `TrabajadorDetails` y `PDF` mostraban observaciones, pero no la nueva respuesta habitacional.
- El PDF agrupaba las observaciones en un bloque separado, en lugar de ubicarlas dentro de cada sección correspondiente.
- No existe en este repositorio formulario de captura, navegación entre páginas ni operación de actualización de los endpoints de fiscalización. El único formulario local de relevamiento es una vista genérica sin persistencia para esos datos.
- Se hallaron trazas de depuración en los componentes de consulta e impresión alcanzados.

## 4. Comportamiento esperado

SAR debe presentar SUBDELEGADO como cargo del responsable, `¿Vive en el lugar?` como primer dato de la condición habitacional y cada observación dentro de su condición respectiva, tanto en consulta como en el PDF.

## 5. Impacto técnico

- `src/components/pages/relevamiento/relevamientoFormatters.js`: normalización centralizada de cargo y respuesta Sí/No.
- `PDF.js`: impresión de los tres datos y reubicación de observaciones.
- `detallesRelevamiento/RelevamientoDetails.js`: consulta del cargo del responsable.
- `datosTrabajador/detallesTrabajador/TrabajadorDetails.js`: consulta de la respuesta habitacional.
- Componentes de consulta e impresión: retiro de trazas de depuración.

## 6. Estrategia de implementación

Se reutiliza un helper local para evitar discrepancias entre la consulta y el PDF. No se incorporan permisos, rutas, dependencias, almacenamiento local ni reglas de negocio en el cliente: los valores se renderizan únicamente si los endpoints los entregan.

## 7. Flujo de datos

`App/Fiscalizaciones` entrega el relevamiento y `App/FiscalizacionesTrabajador` los datos del trabajador. SAR consume `inspectorCargo`, `observacionCondicionLaboral`, `observacionesCondicionHabitacional` y el nuevo campo `viveEnElLugar`; los formatea para detalle o PDF sin mutarlos ni persistirlos.

## 8. Validaciones

- `inspectorCargo = SD` y `SUBDELEGADO` se presentan como SUBDELEGADO.
- `viveEnElLugar` admite S/SI/SÍ/true/1 y N/NO/false/0 para visualización legible.
- La ausencia de valor conserva el marcador visual `-`.
- Las observaciones se renderizan dentro de su sección sin truncamiento adicional.

## 9. Casos borde

- Datos históricos sin el nuevo campo deben seguir siendo consultables.
- Valores de cargo o respuesta no reconocidos se muestran de forma segura: `-` para cargo y el valor original para una respuesta no vacía no normalizada.
- Observaciones vacías y extensas no se transforman ni limitan desde SAR.

## 10. Riesgos y dependencias

La aplicación de carga y el backend no están incluidos en este repositorio. Para completar RN-003 a RN-008, RN-010, RN-012, RN-013 y RN-015 se requiere que dichos componentes persistan, validen y expongan el campo `viveEnElLugar` y permitan las operaciones de actualización definidas en el AF. El nombre y código acordados con la API deben confirmarse durante la integración; esta implementación usa `viveEnElLugar` y `SD` de forma explícita.

## 11. Estrategia de pruebas

- Compilar el frontend con `npm run buildtest`.
- En un ambiente integrado, seleccionar relevamientos con cargos existentes y SUBDELEGADO, respuestas Sí/No/vacía y observaciones vacías/largas.
- Confirmar detalle SAR y PDF para cada caso.
- Probar el flujo de carga, conservación, cambio Sí/No, guardado y actualización de históricos en el repositorio/aplicación que los implemente.

## 12. Criterios de aceptación técnicos

- Consulta SAR e impresión reconocen SUBDELEGADO.
- Consulta e impresión muestran `¿Vive en el lugar?` al inicio de Condición habitacional.
- Ambas observaciones aparecen en su sección correspondiente.
- No se agregan dependencias ni se modifican permisos o contratos de guardado.
- La compilación finaliza sin errores introducidos por estos cambios.
