export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
  return `${month}/${day}`;
};

export const formatDateInput = (dateString: string): string => {
  // Convert ISO string to YYYY-MM-DD format for input[type="date"]
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, "0");
  
  return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
};

export const formatNameList = (names: string[], maxNames: number = 3): string => {
  if (names.length === 0) return "";
  if (names.length <= maxNames) return names.join(", ");
  
  const displayedNames = names.slice(0, maxNames);
  const remainingCount = names.length - maxNames;
  return `${displayedNames.join(", ")} and ${remainingCount} other${remainingCount === 1 ? "" : "s"}`;
};

export const truncateName = (name: string, maxLength: number = 10): string => {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "...";
};

