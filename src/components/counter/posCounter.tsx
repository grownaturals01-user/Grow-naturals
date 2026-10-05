import { useState } from "react";
import { Link } from "react-router-dom";

export interface PosCounterProps {
  value?: number;
  onChange?: (val: number) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  min?: number;
  max?: number;
}

const PosCounter: React.FC<PosCounterProps> = ({
  value,
  onChange,
  onIncrement,
  onDecrement,
  min = 0,
  max = 999,
}) => {
  const [internalQuantity, setInternalQuantity] = useState(0);

  const isControlled = value !== undefined;
  const currentQuantity = isControlled ? value : internalQuantity;

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onIncrement) {
      onIncrement();
    } else if (currentQuantity < max) {
      const next = currentQuantity + 1;
      if (!isControlled) setInternalQuantity(next);
      if (onChange) onChange(next);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDecrement) {
      onDecrement();
    } else if (currentQuantity > min) {
      const next = currentQuantity - 1;
      if (!isControlled) setInternalQuantity(next);
      if (onChange) onChange(next);
    }
  };

  interface HandleChangeEvent {
    target: { value: string };
  }

  const handleChange = (e: HandleChangeEvent) => {
    const rawVal = e.target.value;
    const numericValue = parseInt(rawVal, 10);

    if (rawVal === "") {
      if (!isControlled) setInternalQuantity(0);
      if (onChange) onChange(0);
    } else if (!isNaN(numericValue) && numericValue >= min && numericValue <= max) {
      if (!isControlled) setInternalQuantity(numericValue);
      if (onChange) onChange(numericValue);
    }
  };

  return (
    <>
      <Link
        to="#"
        className="dec dark d-flex justify-content-center align-items-center"
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title="minus"
        onClick={handleDecrement}
      >
        <i className="ti ti-minus" />
      </Link>
      <input
        type="text"
        className="form-control text-center"
        name="qty"
        value={currentQuantity.toString()}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
      />
      <Link
        to="#"
        className="inc dark dark d-flex justify-content-center align-items-center"
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title="plus"
        onClick={handleIncrement}
      >
        <i className="ti ti-plus" />
      </Link>
    </>
  );
};

export default PosCounter;
