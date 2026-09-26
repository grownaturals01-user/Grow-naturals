import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Equal } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [clearOnNext, setClearOnNext] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key >= '0' && e.key <= '9') handleNum(e.key);
      else if (e.key === '.') handleDot();
      else if (e.key === '+') handleOp('+');
      else if (e.key === '-') handleOp('-');
      else if (e.key === '*' || e.key === 'x') handleOp('×');
      else if (e.key === '/') { e.preventDefault(); handleOp('÷'); }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); }
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, prevVal, operation, clearOnNext]);

  if (!isOpen) return null;

  const handleNum = (n: string) => {
    if (clearOnNext || display === '0') {
      setDisplay(n);
      setClearOnNext(false);
    } else {
      if (display.length < 14) {
        setDisplay(display + n);
      }
    }
  };

  const handleDot = () => {
    if (clearOnNext) {
      setDisplay('0.');
      setClearOnNext(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOp = (op: string) => {
    const current = parseFloat(display);
    if (prevVal !== null && operation && !clearOnNext) {
      const result = compute(prevVal, current, operation);
      setDisplay(String(result));
      setPrevVal(result);
    } else {
      setPrevVal(current);
    }
    setOperation(op);
    setClearOnNext(true);
  };

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      case '%': return (a * b) / 100;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prevVal === null || !operation) return;
    const current = parseFloat(display);
    const result = compute(prevVal, current, operation);
    // Format nicely without ugly scientific notation where possible
    const formatted = Math.round(result * 100000000) / 100000000;
    setDisplay(String(formatted));
    setPrevVal(null);
    setOperation(null);
    setClearOnNext(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setClearOnNext(false);
  };

  const handleBackspace = () => {
    if (clearOnNext) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };

  const handleToggleSign = () => {
    const val = parseFloat(display);
    setDisplay(String(val * -1));
  };

  return (
    <div className="pos-calc-overlay" onClick={onClose}>
      <div className="pos-calc-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="pos-calc-header">
          <div className="pos-calc-title">
            <span>POS Quick Calculator</span>
          </div>
          <button type="button" className="pos-calc-close-btn" onClick={onClose} aria-label="Close Calculator">
            <X size={16} />
          </button>
        </div>

        {/* Display Screen */}
        <div className="pos-calc-screen">
          <div className="pos-calc-op-preview">
            {prevVal !== null && operation ? `${prevVal} ${operation}` : ''}
          </div>
          <div className="pos-calc-value">{display}</div>
        </div>

        {/* Button Grid */}
        <div className="pos-calc-keypad">
          <button type="button" className="calc-btn calc-btn-func" onClick={handleClear}>C</button>
          <button type="button" className="calc-btn calc-btn-func" onClick={handleToggleSign}>±</button>
          <button type="button" className="calc-btn calc-btn-func" onClick={handlePercent}>%</button>
          <button type="button" className={`calc-btn calc-btn-op ${operation === '÷' ? 'active' : ''}`} onClick={() => handleOp('÷')}>÷</button>

          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('7')}>7</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('8')}>8</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('9')}>9</button>
          <button type="button" className={`calc-btn calc-btn-op ${operation === '×' ? 'active' : ''}`} onClick={() => handleOp('×')}>×</button>

          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('4')}>4</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('5')}>5</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('6')}>6</button>
          <button type="button" className={`calc-btn calc-btn-op ${operation === '-' ? 'active' : ''}`} onClick={() => handleOp('-')}>−</button>

          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('1')}>1</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('2')}>2</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('3')}>3</button>
          <button type="button" className={`calc-btn calc-btn-op ${operation === '+' ? 'active' : ''}`} onClick={() => handleOp('+')}>+</button>

          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('0')}>0</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={() => handleNum('00')}>00</button>
          <button type="button" className="calc-btn calc-btn-num" onClick={handleDot}>.</button>
          <button type="button" className="calc-btn calc-btn-equal" onClick={handleEquals}>
            <Equal size={18} />
          </button>
        </div>

        <div className="pos-calc-footer">
          <button type="button" className="pos-calc-backspace-btn" onClick={handleBackspace} title="Backspace">
            <Delete size={14} /> Backspace
          </button>
          <span className="pos-calc-hint">Supports keyboard</span>
        </div>
      </div>
    </div>
  );
};
