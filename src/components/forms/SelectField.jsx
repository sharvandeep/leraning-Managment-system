import styles from "../../styles/ui.module.css";

export default function SelectField({ label, options, placeholder = "Select", ...props }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select className={styles.select} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </label>
  );
}
