import moment from "moment";

const parseDate = (value) => {
	if (!value) return null;

	const date = moment(value, ["YYYY-MM-DD", moment.ISO_8601], true);
	if (!date.isValid() && (value instanceof Date || typeof value?.format === "function")) {
		return moment(value).isValid() ? moment(value).startOf("day") : null;
	}
	return date.isValid() ? date.startOf("day") : null;
};

const periodsOverlap = (leftStart, leftEnd, rightStart, rightEnd) =>
	leftStart.isSameOrBefore(rightEnd, "day") &&
	leftEnd.isSameOrAfter(rightStart, "day");

const isActive = (record) => !record?.deletedDate;
const today = () => moment().startOf("day");

export const validarAutoridad = ({ record = {}, authorities = [], request }) => {
	const errors = {};
	const from = parseDate(record.fechaVigenciaDesde);
	const until = parseDate(record.fechaVigenciaHasta);

	if (!record.fechaVigenciaDesde) {
		errors.fechaVigenciaDesde = "Debe ingresar una Fecha de Vigencia Desde";
	} else if (!from) {
		errors.fechaVigenciaDesde = "La Fecha de Vigencia Desde no es válida";
	}

	if (!record.fechaVigenciaHasta) {
		errors.fechaVigenciaHasta = "Debe ingresar una Fecha de Vigencia Hasta";
	} else if (!until) {
		errors.fechaVigenciaHasta = "La Fecha de Vigencia Hasta no es válida";
	}

	if (from && until && from.isAfter(until, "day")) {
		errors.fechaVigenciaHasta =
			"La Fecha de Vigencia Hasta debe ser igual o posterior a la Fecha de Vigencia Desde";
	}

	if (Object.keys(errors).length || request === "B") return errors;

	const sameCargo = authorities.filter(
		(authority) =>
			authority.id !== record.id &&
			authority.seccionalId === record.seccionalId &&
			authority.refCargosId === record.refCargosId
	);

	const activeCargo = sameCargo.filter(isActive);
	const currentCargo = activeCargo.find((authority) => {
		const authorityUntil = parseDate(authority.fechaVigenciaHasta);
		return authorityUntil?.isAfter(today(), "day");
	});
	if (currentCargo) {
		errors.refCargosId =
			"El cargo está actualmente vigente en esta seccional y no puede darse de alta otra autoridad";
	} else {
		const cargoWithInvalidSequence = sameCargo.find((authority) => {
			const referenceDate = authority.deletedDate
				? parseDate(authority.deletedDate)
				: parseDate(authority.fechaVigenciaHasta);

			return referenceDate && authority.deletedDate
				? !from.isSameOrAfter(referenceDate, "day")
				: !from.isAfter(referenceDate, "day");
		});

		if (cargoWithInvalidSequence) {
			errors.refCargosId = cargoWithInvalidSequence.deletedDate
				? "La Fecha de Vigencia Desde debe ser igual o posterior a la Fecha de Baja de la autoridad anterior"
				: "La Fecha de Vigencia Desde debe ser posterior a la Fecha de Vigencia Hasta de la autoridad anterior";
		}
	}

	const activeAuthorities = authorities.filter(
		(authority) =>
			authority.id !== record.id &&
			authority.seccionalId === record.seccionalId &&
			isActive(authority)
	);

	const conflicts = activeAuthorities.filter((authority) => {
		const authorityFrom = parseDate(authority.fechaVigenciaDesde);
		const authorityUntil = parseDate(authority.fechaVigenciaHasta);

		return (
			authorityFrom &&
			authorityUntil &&
			periodsOverlap(from, until, authorityFrom, authorityUntil)
		);
	});

	const afiliadoConflict = conflicts.find(
		(authority) => authority.afiliadoId === record.afiliadoId
	);
	if (afiliadoConflict) {
		errors.afiliadoNumero =
			"El afiliado ya posee otra autoridad durante el período de vigencia indicado";
	}

	return errors;
};

export default validarAutoridad;
