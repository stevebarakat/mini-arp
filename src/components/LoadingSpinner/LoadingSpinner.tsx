import React from "react";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "#666",
}) => {
  return (
    <div className={`${styles.spinner} ${styles[size]}`} style={{ color }}>
      <div className={styles.spinnerInner}></div>
      <span className={styles.text}>Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
