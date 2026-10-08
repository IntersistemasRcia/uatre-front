import { MenuItem, Select, InputLabel, FormControl, FormHelperText } from "@mui/material";
import styles from "./SelectMaterial.module.css";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 9.2 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const SelectMaterial = (props) => {
	//console.log('SelectMaterial_props',props)
	
  const handleChange = (event) => {
	//console.log('SelectMaterial_event',event)
    props.onChange(event.target.value, event.target.name);
  };

	const helperText = props.helperText || (props.error !== true ? props.error : "");
	const helperTextRender = helperText ? (
		<FormHelperText>{helperText}</FormHelperText>
	) : null;

  return (
		<FormControl
			size="small"
			style={{ width: props.width != null ? `${props.width}%` : "100%" }}
			error={!!props.error}
		>
			<InputLabel id={props.label + "-label"}>{props.label}</InputLabel>
			<Select
				required={props.required ?? false}
				className={styles.select}
				style={{ ...props.style }}
				labelId={props.label + "-label"}
				name={props.name}
				label={props.label}
				value={props.value}
				defaultValue={props.defaultValue}
				onChange={handleChange}
				MenuProps={MenuProps}
				size="small"
				disabled={props.disabled}
				SelectDisplayProps={{
					...props.SelectDisplayProps,
					style: { minHeight: "inherit", ...props.SelectDisplayProps?.style },
				}}
			>
				{props.options.map((option, index) => (
					<MenuItem key={index} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
			{helperTextRender}
		</FormControl>
	);
};

export default SelectMaterial;
