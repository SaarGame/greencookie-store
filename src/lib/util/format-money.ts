export function formatMoney(amount: number): string {
  return (
    "₪ " +
    (amount / 100).toLocaleString("he-IL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
