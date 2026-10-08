																																																																																																																					import validarAutoridad, { validarAfiliadoAutoridad } from "./validarAutoridad";
																																																																																																																					import dayjs from "dayjs";

																																																																																																																					describe("validarAfiliadoAutoridad", () => {
																																																																																																																						test("acepta afiliado activo de la misma seccional", () => {
																																																																																																																							expect(
																																																																																																																								validarAfiliadoAutoridad(
																																																																																																																									{ estadoSolicitudId: 2, seccionalId: 10 },
																																																																																																																									10
																																																																																																																								)
																																																																																																																							).toBe("");
																																																																																																																						});

																																																																																																																						test("rechaza afiliado activo registrado en otra seccional", () => {
																																																																																																																							expect(
																																																																																																																								validarAfiliadoAutoridad(
																																																																																																																									{ estadoSolicitudId: 2, seccionalId: 11 },
																																																																																																																									10
																																																																																																																								)
																																																																																																																							).toBe("AFILIADO REGISTRADO EN OTRA SECCIONAL");
																																																																																																																						});

																																																																																																																						test("rechaza afiliado en estado de baja", () => {
																																																																																																																							expect(
																																																																																																																								validarAfiliadoAutoridad(
																																																																																																																									{ estadoSolicitudId: 3, estadoSolicitud: "Baja", seccionalId: 10 },
																																																																																																																									10
																																																																																																																								)
																																																																																																																							).toBe("EL AFILIADO SE ENCUENTRA EN ESTADO DE BAJA.");
																																																																																																																						});

																																																																																																																						test("rechaza No Activo aunque el id indique otro estado", () => {
																																																																																																																							expect(
																																																																																																																								validarAfiliadoAutoridad(
																																																																																																																									{ estadoSolicitudId: 2, estadoSolicitud: "No Activo", seccionalId: 10 },
																																																																																																																									10
																																																																																																																								)
																																																																																																																							).toBe("EL AFILIADO NO SE ENCUENTRA EN ESTADO ACTIVO.");
																																																																																																																						});

																																																																																																																						test("no informa otra seccional si no se conoce la seccional esperada", () => {
																																																																																																																							expect(
																																																																																																																								validarAfiliadoAutoridad(
																																																																																																																									{ estadoSolicitud: "Activo", seccionalId: 104120 },
																																																																																																																									undefined
																																																																																																																								)
																																																																																																																							).toBe("No se pudo determinar la seccional de la autoridad");
																																																																																																																						});
																																																																																																																					});

describe("validarAutoridad", () => {
	const baseRecord = {
		id: 2,
		seccionalId: 10,
		afiliadoId: 200,
		afiliadoNumero: 2000,
		refCargosId: 3,
		fechaVigenciaDesde: "2025-01-01",
		fechaVigenciaHasta: "2025-12-31",
	};

	test("exige una fecha posterior a la vigencia anterior del mismo cargo", () => {
		const errors = validarAutoridad({
			record: baseRecord,
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2024-01-01",
					fechaVigenciaHasta: "2025-01-31",
				},
			],
			request: "A",
		});

		expect(errors.refCargosId).toBe(
			"La Fecha de Vigencia Desde debe ser posterior a la Fecha de Vigencia Hasta de la autoridad anterior"
		);
	});

	test("permite continuar después de la fecha de baja del mismo cargo", () => {
		const errors = validarAutoridad({
			record: { ...baseRecord, fechaVigenciaDesde: "2025-03-01" },
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2024-01-01",
					fechaVigenciaHasta: "2099-12-31",
					deletedDate: "2025-02-01",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("permite iniciar el mismo día de la fecha de baja", () => {
		const errors = validarAutoridad({
			record: { ...baseRecord, fechaVigenciaDesde: "2025-02-01" },
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2024-01-01",
					fechaVigenciaHasta: "2099-12-31",
					deletedDate: "2025-02-01T23:58:10.405122",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("permite el caso real con fechas ISO posteriores a la baja", () => {
		const errors = validarAutoridad({
			record: {
				...baseRecord,
				fechaVigenciaDesde: "2026-09-18T03:00:00.000Z",
				fechaVigenciaHasta: "2099-12-31",
			},
			authorities: [
				{
					id: 2046,
					seccionalId: 104120,
					afiliadoId: 1881445,
					refCargosId: 5,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
					deletedDate: "2026-09-17T23:58:10.405122",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("impide cargar un cargo actualmente vigente", () => {
		const errors = validarAutoridad({
			record: {
				...baseRecord,
				fechaVigenciaDesde: "2098-01-01",
				fechaVigenciaHasta: "2099-12-31",
			},
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2025-01-01",
					fechaVigenciaHasta: "2099-12-31",
				},
			],
			request: "A",
		});

		expect(errors.refCargosId).toBe(
			"El cargo está actualmente vigente en esta seccional y no puede darse de alta otra autoridad"
		);
	});

	test("permite el relevo al día siguiente del vencimiento aunque sea el mismo afiliado", () => {
		const errors = validarAutoridad({
			record: {
				...baseRecord,
				id: undefined,
				afiliadoId: 100,
				fechaVigenciaDesde: "2027-10-17",
				fechaVigenciaHasta: "2029-01-01",
			},
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("permite una autoridad distinta después de la vigencia actual del cargo", () => {
		const errors = validarAutoridad({
			record: {
				...baseRecord,
				id: undefined,
				afiliadoId: 244850,
				fechaVigenciaDesde: "2028-10-08",
				fechaVigenciaHasta: "2099-12-31",
			},
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 244858,
					refCargosId: 3,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("permite los datos actuales de Elortondo para Secretario General desde octubre de 2028", () => {
		const errors = validarAutoridad({
			record: {
				seccionalId: 104120,
				afiliadoId: 1783141,
				afiliadoNumero: 244850,
				refCargosId: 1,
				fechaVigenciaDesde: "2028-10-01",
				fechaVigenciaHasta: "2099-12-31",
			},
			authorities: [
				{
					id: 6,
					seccionalId: 104120,
				afiliadoId: 1783149,
					refCargosId: 1,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
				{
					id: 1055,
					seccionalId: 104120,
					afiliadoId: 1783141,
					refCargosId: 9,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("permite al afiliado 244858 ocupar Secretario General desde 2028", () => {
		const errors = validarAutoridad({
			record: {
				seccionalId: 104120,
				afiliadoId: 1783149,
				afiliadoNumero: 244858,
				refCargosId: 1,
				fechaVigenciaDesde: "2028-10-01",
				fechaVigenciaHasta: "2099-12-31",
			},
			authorities: [
				{
					id: 6,
					seccionalId: 104120,
					afiliadoId: 1783149,
					refCargosId: 1,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
				{
					id: 1057,
					seccionalId: 104120,
					afiliadoId: 1783149,
					refCargosId: 10,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("usa la fecha seleccionada de Day.js y no la fecha actual del sistema", () => {
		const errors = validarAutoridad({
			record: {
				seccionalId: 104120,
				afiliadoId: 1783149,
				afiliadoNumero: 244858,
				refCargosId: 1,
				fechaVigenciaDesde: dayjs("2028-10-08"),
				fechaVigenciaHasta: dayjs("2099-12-31"),
			},
			authorities: [
				{
					id: 6,
					seccionalId: 104120,
					afiliadoId: 1783149,
					refCargosId: 1,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
				{
					id: 1057,
					seccionalId: 104120,
					afiliadoId: 1783149,
					refCargosId: 10,
					fechaVigenciaDesde: "2023-10-17T00:00:00",
					fechaVigenciaHasta: "2027-10-16T00:00:00",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("rechaza dos cargos para el mismo afiliado", () => {
		const errors = validarAutoridad({
				record: { ...baseRecord, fechaVigenciaDesde: "2025-03-01" },
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 200,
					refCargosId: 4,
					fechaVigenciaDesde: "2025-06-01",
					fechaVigenciaHasta: "2099-12-31",
				},
			],
			request: "A",
		});

		expect(errors.afiliadoNumero).toBe(
			"El afiliado ya posee otra autoridad durante el período de vigencia indicado"
		);
	});

	test("ignora autoridades dadas de baja", () => {
		const errors = validarAutoridad({
			record: { ...baseRecord, fechaVigenciaDesde: "2025-03-01" },
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2025-01-01",
					fechaVigenciaHasta: "2025-12-31",
					deletedDate: "2025-02-01",
				},
			],
			request: "A",
		});

		expect(errors).toEqual({});
	});

	test("rechaza una reactivación que pisa una autoridad activa", () => {
		const errors = validarAutoridad({
			record: {
				...baseRecord,
				id: 2,
				fechaVigenciaHasta: "2099-12-31",
			},
			authorities: [
				{
					id: 1,
					seccionalId: 10,
					afiliadoId: 100,
					refCargosId: 3,
					fechaVigenciaDesde: "2025-06-01",
					fechaVigenciaHasta: "2099-12-31",
				},
			],
			request: "R",
		});

		expect(errors.refCargosId).toBe(
			"El cargo está actualmente vigente en esta seccional y no puede darse de alta otra autoridad"
		);
	});
});
