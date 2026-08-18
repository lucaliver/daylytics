import Papa from "papaparse";

export interface RawDaylioRow {
  full_date: string;
  date: string;
  weekday: string;
  time: string;
  mood: string;
  activities: string;
  scales: string;
  note_title: string;
  note: string;
}

/** Parses a Daylio CSV export entirely in-browser. Rejects on malformed input. */
export function parseDaylioCsv(file: File): Promise<RawDaylioRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawDaylioRow>(file, {
      header: true,
      skipEmptyLines: true,
      // Daylio exports with a UTF-8 BOM prefixed onto the first header.
      transformHeader: (h) => h.trim().replace(/^\uFEFF/, ""),
      complete: (results) => {
        if (!results.data.length) {
          reject(new Error("The CSV file appears to be empty."));
          return;
        }
        resolve(results.data);
      },
      error: (err: Error) => reject(err),
    });
  });
}
