import React, { useMemo } from "react";
import Select from "react-select";

interface CommonSelectProps {
  value: any;
  options: { label: string; value: any; [key: string]: any }[];
  placeholder?: string;
  onChange: (e: { value: any; target?: { value: any } }) => void;
  className?: string;
  disabled?: boolean;
  filter?: boolean;
  appendTo?: any;
  formatOptionLabel?: (data: any) => React.ReactNode;
  styles?: any;
}

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "38px",
    height: "38px",
    borderRadius: "0.35rem",
    border: "1px solid #e6eaed !important",
    borderColor: "#e6eaed !important",
    boxShadow: "none !important",
    outline: "none !important",
    backgroundColor: state.isDisabled ? "#f8f9fa" : "#ffffff",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:hover": {
      borderColor: "#e6eaed !important",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 10px",
    fontSize: "13px",
    fontWeight: 400,
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#212b36",
    fontSize: "13px",
    fontWeight: 400,
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 400,
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: "#6c757d",
    padding: "6px 8px",
    "&:hover": {
      color: "#495057",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 99999,
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: "8px",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
    border: "1px solid #e6eaed",
    overflow: "hidden",
    zIndex: 99999,
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: "13px",
    cursor: "pointer",
    padding: "8px 12px",
    backgroundColor: state.isSelected
      ? "#f26522"
      : state.isFocused
      ? "#fff2e8"
      : "white",
    color: state.isSelected ? "white" : state.isFocused ? "#f26522" : "#333",
    "&:active": {
      backgroundColor: "#f26522",
      color: "white",
    },
  }),
};

const CommonSelect: React.FC<CommonSelectProps> = ({
  value,
  options,
  placeholder = "Select",
  onChange,
  className = "",
  disabled = false,
  filter = true,
  formatOptionLabel,
  styles,
}) => {
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map((opt: any) => {
      if (typeof opt === "string") return { label: opt, value: opt };
      const label = opt.label ?? opt.name ?? String(opt.value ?? "");
      const val = opt.value ?? opt.id ?? opt.code ?? label;
      return { ...opt, label, value: val };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "object" && value !== null && "value" in value) {
      return value;
    }
    const found = normalizedOptions.find((opt: any) => String(opt.value) === String(value));
    return found || { value, label: String(value) };
  }, [value, normalizedOptions]);

  const handleChange = (selected: any) => {
    const val = selected ? selected.value : null;
    if (onChange) {
      onChange({ value: val, target: { value: val } });
    }
  };

  const mergedStyles = useMemo(() => {
    if (!styles) return customSelectStyles;
    return { ...customSelectStyles, ...styles };
  }, [styles]);

  return (
    <Select
      options={normalizedOptions}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={disabled}
      isSearchable={filter !== false}
      classNamePrefix="react-select select"
      className={className}
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      styles={mergedStyles}
      formatOptionLabel={formatOptionLabel}
    />
  );
};

export default CommonSelect;
 