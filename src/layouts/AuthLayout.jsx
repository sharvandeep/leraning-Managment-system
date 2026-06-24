import { Outlet } from "react-router-dom";
import { brand } from "../assets/brand";
import styles from "../styles/ui.module.css";

export default function AuthLayout() {
  return (
    <main className={styles.authShell}>
      <section className={styles.authVisual}>
        <div className={styles.authBrand}>
          <span className={styles.logo}>LS</span>
          <span>{brand.name}</span>
        </div>
        <div>
          <p className={styles.eyebrow}>Campus learning suite</p>
          <h1>{brand.name}</h1>
          <p>{brand.tagline}</p>
        </div>
      </section>
      <section className={styles.authPanel}>
        <Outlet />
      </section>
    </main>
  );
}
