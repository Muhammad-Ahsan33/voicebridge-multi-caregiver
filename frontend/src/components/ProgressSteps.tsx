interface Props {
  step: 1 | 2 | 3;
}

const steps = [
  { n: 1, label: "Preview" },
  { n: 2, label: "Choose person" },
  { n: 3, label: "Send" },
];

export default function ProgressSteps({ step }: Props) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4" aria-label="Send progress">
      {steps.map((s, i) => (
        <li key={s.n} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                ${
                  s.n === step
                    ? "bg-primary text-white ring-4 ring-primary-light"
                    : s.n < step
                    ? "bg-sage text-white"
                    : "bg-primary-light text-primary-dark"
                }`}
              aria-current={s.n === step ? "step" : undefined}
            >
              {s.n < step ? "✓" : s.n}
            </div>
            <span className="text-xs font-bold text-inkmuted hidden sm:block">{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className="w-6 sm:w-10 h-0.5 bg-primary-light" />}
        </li>
      ))}
    </ol>
  );
}
