"use client";

import { useState } from "react";

interface MoneyInputProps {
  name: string;
  value?: string | number;
  onChange?: (raw: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  disabled?: boolean;
}

export function MoneyInput({
  name,
  value,
  onChange,
  placeholder = "0",
  min,
  max,
  required,
  className,
  style,
  id,
  disabled,
}: MoneyInputProps) {
  const controlledRaw = value !== undefined ? String(value).replace(/,/g, "") : undefined;
  const [internalRaw, setInternalRaw] = useState(controlledRaw ?? "");
  const raw = controlledRaw ?? internalRaw;
  const display = raw ? Number(raw).toLocaleString("ko-KR") : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
    setInternalRaw(stripped);
    onChange?.(stripped);
  }

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        style={style}
        aria-label={name}
      />
      <input type="hidden" name={name} value={raw} min={min} max={max} />
    </>
  );
}
