import styles from "../../styles/ui.module.css";

export default function TextField({ label, as = "input", ...props }) {
  const Component = as;
  const className = as === "textarea" ? styles.textarea : styles.input;

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <Component className={className} {...props} />
    </label>
  );
}
