// fixed-precision monospace rendering with the decimal point kept in a
// constant position: trailing zeros beyond the significant digits are kept
// in the DOM (so every row has identical character width and the decimal
// points land in the same column) but rendered invisible, so "1.2" doesn't
// visually show as "1.20000" next to "3.4567".
// use inside a "buttons"-type CustomTableColumn to get this instead of the
// plain string rendering a "string" column gives you
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
