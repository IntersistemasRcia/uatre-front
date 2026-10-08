import React from "react";
import { FormControl, Autocomplete } from "@mui/material";
import styles from "./SearchSelectMaterial.module.css";
import InputMaterial from "../Input/InputMaterial";
import { v4 as uuidv4 } from "uuid";

/**
 * @typedef {object} SearchSelectOption
 * @property {*} value
 * @property {string} [label]
 */

/**
 * @callback SearchSelectOptionMap
 * @param {*} value
 * @param {number} index
 * @param {array} array
 * @returns {SearchSelectOption}
 */

/**
 * @callback SearchSelectOptionFilter
 * @param {SearchSelectOption} option
 * @returns {boolean}
 */

/** @type {SearchSelectOptionMap} */
const mapDef = (value, index, array) => ({
	value,
	label: value == null ? "" : `${value}`,
});

/** @type {SearchSelectOptionFilter} */
const filterDef = (option) => !!option;

/**
 * Generador de opciones a partir de datos crudos
 * @param {object} config Configuración
 * @param {array} config.data Datos origen
 * @param {SearchSelectOptionMap} [config.map] Funcion que convierte un dato a una opcion
 * @param {SearchSelectOption[]} [config.start] Opciones a agregar al inicio
 * @param {SearchSelectOption[]} [config.end] Opciones a agregar al final
 * @param {SearchSelectOptionFilter} [config.filter] Filtro a aplicar a las opciones
 * @returns Arreglo de opciones que cumplen con filter
 */
export const mapOptions = ({
	data,
	map = mapDef,
	start = [],
	end = [],
	filter = filterDef,
}) => [...start, ...data.map(map), ...end].filter(filter);

/**
 * Convierte value a minúsculas o mayúsculas dependiendo de casing
 * @param {string} value Valor a capitalizar
 * @param {number} casing
 * Si mayor a 0, convierte value a mayúsculas.
 *
 * Si menor a 0, convierte value a minúsculas.
 *
 * Si 0, no aplica conversión.
 *
 * Por defecto es 0.
 * @returns Alteración de value según casing
 */
export const getCase = (value, casing = 0) =>
	casing < 0 ? value.toLowerCase() : casing > 0 ? value.toUpperCase() : value;

/**
 * Condición si option incluye search en su label
 * @param {SearchSelectOption} option Opcion a evaluar
 * @param {string} search Valor a buscar en label de option
 * @param {boolean} ignoreCase
 * Si debe o no considerar mayúsculas y minúsculas.
 *
 * Por defecto no considera.
 * @returns true o false dependiendo de si search tiene valor y cumple la condición.
 */
export const includeSearch = (option, search, ignoreCase = true) =>
	!search ||
	getCase(option.label ?? "", ignoreCase).includes(
		getCase(search ?? "", ignoreCase)
	);

const normalizeOption = (option, fallback = null) => {
	if (option == null) return fallback ?? { value: "", label: "" };
	if (typeof option === "string") return { value: option, label: option };
	return option;
};

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;

/**
 * @callback SearchSelectOnChange
 * @param {SearchSelectOption} newValue
 * @param {string} name
 */

/**
 * @callback SearchSelectOnTextChange
 * @param {string} newValue
 * @param {string} id
 */

/**
 * @callback SearchSelectOnInputChange
 * @param {string} newValue
 */

/**
 * @param {object} [props] Propiedades
 * @param {string} [props.name]
 * @param {string} [props.label]
 * @param {SearchSelectOption} [props.value]
 * @param {SearchSelectOption[]} [props.options]
 * @param {SearchSelectOption} [props.defaultOption]
 * @param {string | number} [props.width]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.readOnly]
 * @param {string} [props.size]
 * @param {object} [props.style]
 * @param {SearchSelectOnChange} [props.onChange]
 * @param {SearchSelectOnTextChange} [props.onTextChange]
 * @param {SearchSelectOnInputChange} [props.onInputChange]
 * @param {string} [props.inputValue]
 * @param {object} [props.autocompleteProps]
 */
const SearchSelectMaterial = ({
	name = "",
	label = "",
	value = {},
	options = [],
	defaultOption = null,
	width = "100%",
	disabled = false,
	readOnly = false,
	size = "small",
	style: styleInit = {},
	onChange = () => {},
	onTextChange = () => {},
	onInputChange,
	inputValue,
	autocompleteProps = {},
	freeSolo = true,
	autoSelect = false,
	...x
}) => {
	const clearOption = defaultOption ?? { value: "", label: "" };
	const currentValue = value ?? defaultOption ?? null;

	const formControlProps = {
		size,
		style: {
			width: typeof width === "number" ? `${width}%` : width,
			backgroundColor: "white",
			...styleInit,
		},
	};
	
	return (
		<FormControl {...formControlProps}>
			<Autocomplete
				listboxprops={{ style: { maxHeight: 50 } }}
				className={styles.select}
				disablePortal
				freeSolo={freeSolo}
				autoSelect={autoSelect}
				renderOption={(props, option, state) => (
					<li {...props} key={state.index}>
						{typeof option === "string" ? option : option.label}
					</li>
				)}
				disabled={disabled}
				readOnly={readOnly}
				id={`${name || x.id || label || uuidv4()}-label`}
				options={options}
				//MenuProps={MenuProps}
				size="small"
				value={currentValue}
				inputValue={inputValue}
				onInputChange={(event, newInputValue, reason) => {
					if (onInputChange) onInputChange(newInputValue, reason);
					else onTextChange(newInputValue);
				}}
				onChange={(event, newValue, reason) => {
					if (reason === 'selectOption' || reason === 'clear' || reason === 'removeOption') {
						const normalizedValue = normalizeOption(newValue, clearOption);
						onChange(normalizedValue, name);
						if (onInputChange) onInputChange(normalizedValue.label || '', reason);
					}
				}}
				getOptionLabel={(option) =>
					typeof option === "string" ? option : option?.label || ""
				}
				//defaultValue={props.defaultValue}
				{...autocompleteProps}
				renderInput={(params) => (
					<InputMaterial
						label={label}
						{...x}
						{...params}
					/>
				)}
			/>
		</FormControl>
	);
};

export default SearchSelectMaterial;
