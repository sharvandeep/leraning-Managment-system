import styles from "../../styles/ui.module.css";

export default function SelectField({ label, options, placeholder = "Select", ...props }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select className={styles.select} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const val = option && typeof option === "object" && option.value !== undefined ? option.value : option;
          const lbl = option && typeof option === "object" && option.label !== undefined ? option.label : option;
          return (
            <option key={String(val)} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </label>
  );
}
