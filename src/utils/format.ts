export function formatDate(input: Date | number): string {
  const date = input instanceof Date ? input : new Date(input);

  return date.getFullYear() + "-" +
  String(date.getMonth() + 1).padStart(2, "0") + "-" +
  String(date.getDate()).padStart(2, "0") + "." +
  String(date.getHours()).padStart(2, "0") + ":" +
  String(date.getMinutes()).padStart(2, "0");
}
