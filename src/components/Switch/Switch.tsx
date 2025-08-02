import React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import styles from "./Switch.module.css";

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    { checked, onCheckedChange, disabled, children, className, ...props },
    ref
  ) => (
    <div className={`${styles.switchContainer} ${className || ""}`}>
      <SwitchPrimitives.Root
        className={styles.switchRoot}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        <SwitchPrimitives.Thumb className={styles.switchThumb} />
      </SwitchPrimitives.Root>
      {children && <span className={styles.switchLabel}>{children}</span>}
    </div>
  )
);

Switch.displayName = "Switch";

export default Switch;
