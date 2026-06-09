import { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit === ' ' ? '' : digit;
    onChange(next.join('').replace(/ /g, ''));
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === ' ' ? '' : d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="
            w-11 h-14 text-center font-display-xl text-xl
            bg-white border border-outline-variant/50 rounded-lg text-on-surface
            focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none
            transition-all caret-primary
          "
        />
      ))}
    </div>
  );
}
