// monospace number with the decimal point locked in place: trailing zeros stay
// in the dom (so every row is the same width and the dots line up) but they're
// invisible, so 1.2 doesn't read as 1.20000 next to 3.4567.
// use it in a buttons-type column, a string column would just print the text
export function AlignedNumber({
  value,
  decimals,
}: {
  value: number;
  decimals: number;
}) {
  const [intPart, decPart = ""] = value.toFixed(decimals).split(".");
  const significantLength = decPart.replace(/0+$/, "").length;
  const significant = decPart.slice(0, significantLength);
  const trailingZeros = decPart.slice(significantLength);

  return (
    <span className="font-mono tabular-nums">
      {intPart}
      {decimals > 0 && (
        <>
          <span className={significantLength === 0 ? "opacity-0" : undefined}>
            .
          </span>
          {significant}
          {trailingZeros && <span className="opacity-0">{trailingZeros}</span>}
        </>
      )}
    </span>
  );
}
