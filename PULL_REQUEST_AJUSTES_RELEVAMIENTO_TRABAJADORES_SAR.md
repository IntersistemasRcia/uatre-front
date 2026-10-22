# Fix | Ajustes de visualización en Relevamiento de Trabajadores SAR

## Descripción

La consulta e impresión de SAR no reconocían el cargo SUBDELEGADO ni mostraban `¿Vive en el lugar?`. Las observaciones se imprimían fuera de sus secciones funcionales.

## Solución implementada

Se incorporó un formateador compartido para los códigos de cargo y las respuestas Sí/No. La consulta y el PDF ahora muestran SUBDELEGADO, la respuesta habitacional al inicio de su sección y las observaciones junto a los datos de condición laboral y habitacional que corresponden.

## Cambios principales

- Reconocimiento de `SD` y `SUBDELEGADO` en la consulta e impresión SAR.
- Visualización de `viveEnElLugar` en detalle de trabajador y PDF.
- Reubicación de ambas observaciones dentro de su sección respectiva en el PDF.
- Retiro de trazas de depuración en los componentes alcanzados.

## Cómo probar

1. Ingresar a `Inicio/Relevamiento` con permisos vigentes de consulta.
2. Seleccionar un relevamiento cuyo responsable tenga `inspectorCargo = SD`.
3. Verificar que el detalle muestre `SUBDELEGADO`.
4. Abrir Datos del Trabajador y confirmar que `¿Vive en el lugar?` se muestre antes de los demás datos habitacionales.
5. Presionar IMPRIME y verificar cargo, respuesta y ambas observaciones en el PDF.
6. Repetir con respuestas Sí, No y registros históricos sin `viveEnElLugar`.

## Casos validados

- Revisión estática del diff y ausencia de errores de espacios con `git diff --check`.
- Compilación de producción correcta con `npm run buildtest`.

## Impacto

Se modifica únicamente la consulta e impresión de Relevamiento de Trabajadores en SAR. No cambian rutas, permisos, dependencias ni datos persistidos desde este frontend.

## Riesgos

La visualización depende de que el backend exponga `viveEnElLugar` y de que el cargo SUBDELEGADO se identifique como `SD` o `SUBDELEGADO`. La carga, conservación al navegar y edición de relevamientos pertenecen a componentes no presentes en este repositorio.

## Evidencias

- Adjuntar captura del detalle SAR.
- Adjuntar PDF generado con cargo SUBDELEGADO, respuesta Sí/No y observaciones.
- Resultado de `npm run buildtest` correcto.

## Checklist

- [x] Se analizó el requerimiento funcional.
- [x] La implementación cubre el alcance disponible en este repositorio.
- [x] Se revisó el diff completo.
- [x] No existen cambios fuera del alcance.
- [x] No quedaron imports temporales.
- [x] No quedaron logs de debugging en los componentes alcanzados.
- [ ] Se ejecutó lint (no existe script independiente).
- [ ] Se ejecutaron las validaciones de TypeScript (no existe script independiente).
- [ ] Se ejecutaron los tests aplicables (no existe script de tests automatizados).
- [x] Se ejecutó el build (`npm run buildtest`).
- [ ] Se validó manualmente el flujo afectado (requiere entorno con datos y permisos).
