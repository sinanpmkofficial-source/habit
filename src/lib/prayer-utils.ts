export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerDefinition {
  key: PrayerKey;
  name: string;
  timePeriod: string;
  arabicName: string;
}

export const PRAYERS: PrayerDefinition[] = [
  { key: "fajr", name: "Fajr", timePeriod: "Dawn", arabicName: "الفجر" },
  { key: "dhuhr", name: "Dhuhr", timePeriod: "Noon", arabicName: "الظهر" },
  { key: "asr", name: "Asr", timePeriod: "Afternoon", arabicName: "العصر" },
  { key: "maghrib", name: "Maghrib", timePeriod: "Sunset", arabicName: "المغرب" },
  { key: "isha", name: "Isha", timePeriod: "Night", arabicName: "العشاء" },
];

export interface PrayerRecord {
  _id?: string;
  date: string; // YYYY-MM-DD
  completed: PrayerKey[];
}
