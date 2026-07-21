"use client";

import { useState, useEffect } from "react";

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
  const rawInit = value !== undefined ? String(value).replace(/,/g, "") : "";
  const [raw, setRaw] = useState(rawInit);
  const [display, setDisplay] = useState(
    rawInit ? Number(rawInit).toLocaleString("ko-KR") : ""
  );

  useEffect(() => {
    if (value !== undefined) {
      const r = String(value).replace(/,/g, "");
      setRaw(r);
      setDisplay(r ? Number(r).toLocaleString("ko-KR") : "");
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
    const formatted = stripped ? Number(stripped).toLocaleString("ko-KR") : "";
    setRaw(stripped);
    setDisplay(formatted);
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
