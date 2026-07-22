export function formatWeekInterval(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return dateStr;
  
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay();
  // Monday is 1, Sunday is 0
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  
  const formatFr = (dt: Date) => {
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = dt.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return `Du ${formatFr(monday)} au ${formatFr(sunday)}`;
}

export function formatWeekIntervalText(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return dateStr;

  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const mondayStr = monday.toLocaleDateString("fr-FR", options);
  const sundayStr = sunday.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return `Du ${mondayStr} au ${sundayStr}`;
}

export function getMondayDateStr(dateStr?: string): string {
  let d: Date;
  if (dateStr) {
    const parts = dateStr.split("-").map(Number);
    if (parts.length >= 3 && !isNaN(parts[0])) {
      d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    } else {
      d = new Date();
    }
  } else {
    d = new Date();
  }
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  return monday.toISOString().split("T")[0];
}

export function getSundayDateStr(dateStr?: string): string {
  const mondayStr = getMondayDateStr(dateStr);
  const parts = mondayStr.split("-").map(Number);
  const monday = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday.toISOString().split("T")[0];
}

