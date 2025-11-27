import type { AppData } from "@/types";

const STORAGE_KEY = "money_manager_data_v1";

export const loadData = (): AppData => {
  if (typeof window === "undefined") {
    return { transactions: [], notes: [] };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
  }

  return { transactions: [], notes: [] };
};

export const saveData = (data: AppData): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data to localStorage:", error);
  }
};

