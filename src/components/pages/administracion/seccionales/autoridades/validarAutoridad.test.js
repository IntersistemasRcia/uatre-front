                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    import validarAutoridad from "./validarAutoridad";

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
