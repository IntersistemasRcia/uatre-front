import React, { useEffect, useState } from "react";
import {
	DateTimePicker as DTPicker,
	DatePicker,
	TimePicker,
} from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/es-mx";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import styles from "../Input/InputMaterial.module.css";
import { TextField } from "@mui/material";

 /**
	* 
	* @param {object} props
	* @param {string} props.type
	* @param {string} props.value
	* @param {string} props.placeholder
	* @param {((value: dayjs.Dayjs) => string) | string} props.format
	* @param {string[]} props.views
	* @param {string | JSX.Element} props.error
	* @param {boolean} props.required
	* @param {object} props.InputRenderProps
	* @param {(props: object) => JSX.Element} props.renderInput
	* @param {(value: dayjs.Dayjs | string) => void} props.onChange
	* @returns 
	*/
const DateTimePicker = ({
	type = "datetime",
	value: myValue = "",
	placeholder = "",
	format,
	views,
	error,
	helperText,
	required,
	InputRenderProps = {},
	renderInput = (props) => <TextField {...props} />,
	onChange = () => {},
	...x
} = {}) => {
	
	const [value, setValue] = useState(myValue ? dayjs(myValue) : null);

	useEffect(() => {
		const newValue = myValue ? dayjs(myValue) : null;
		if (myValue === null || newValue?.isValid()) setValue(newValue);
	}, [myValue])

	let pViews, Picker;
	switch (`${type}`.toLowerCase()) {
		case "datetime":
			pViews = "year_month_day_hours_minutes_seconds".split("_");
			Picker = DTPicker;
			if (!placeholder) placeholder = "dd/mm/aaaa hh:mm";
			break;
		case "date":
			pViews = "year_month_day".split("_");
			Picker = DatePicker;
			if (!placeholder) placeholder = "dd/mm/aaaa";
			break;
		case "time":
			pViews = "hours_minutes_seconds".split("_");
			Picker = TimePicker;
			if (!placeholder) placeholder = "hh:mm";
			break;
		case "month":
			pViews = "year_month".split("_");
			Picker = DatePicker;
			if (!placeholder) placeholder = "mmmm aaaa";
			break;
		case "datehours":
			pViews = "year_month_day_hours".split("_");
			Picker = DTPicker;
			if (!placeholder) placeholder = "dd/mm/aaaa hh:mm";
			break;
		case "dateminutes":
			pViews = "year_month_day_hours_minutes".split("_");
			Picker = DTPicker;
			if (!placeholder) placeholder = "dd/mm/aaaa hh:mm";
			break;
		case "hours":
			pViews = ["hours"];
			Picker = TimePicker;
			if (!placeholder) placeholder = "hh:mm";
			break;
		case "minutes":
			pViews = "hours_minutes".split("_");
			Picker = TimePicker;
			if (!placeholder) placeholder = "hh:mm";
			break;
		default:
			pViews = views;
			Picker = DTPicker;
			if (!placeholder) placeholder = "dd/mm/aaaa hh:mm";
			break;
	}

	const myRenderInput = (p) => {
		const renderProps = { ...p, ...InputRenderProps };
		renderProps.className = [renderProps.className, styles.input]
			.filter((e) => e)
			.join(" ");
		renderProps.size ??= "small";
		if (error) {
			renderProps.error = true;
			renderProps.helperText = helperText ?? error;
		} else {
			renderProps.error = false;
			renderProps.helperText = helperText ?? "";
		}
		renderProps.required = required ? required : renderProps.required;
		renderProps.style = {
			...renderProps.style,
			width: "100%",
		};

		const InputLabelProps = { ...renderProps.InputLabelProps };
		InputLabelProps.shrink ??= true;

		const InputProps = { ...renderProps.InputProps };
		InputProps.style = { ...InputProps.style, background: "white" };

		const inputProps = { ...renderProps.inputProps };
		if (placeholder) inputProps.placeholder = placeholder;
		if (!myValue) inputProps.value = "";

		return renderInput({ ...renderProps, InputLabelProps, InputProps, inputProps });
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"es-mx"}>
			<Picker
				views={pViews}
				value={value}
				onChange={(v) => setValue((o) => {
					if (v?.isValid())
						onChange(
							typeof format === "function"
								? format(v)
								: typeof format === "string"
								? v?.format(format)
								: v
						);
					else if (v === null && o?.isValid()) onChange(undefined);
					return v;
				})}
				renderInput={myRenderInput}
				{...x}
			/>
		</LocalizationProvider>
	);
};

export default DateTimePicker;
