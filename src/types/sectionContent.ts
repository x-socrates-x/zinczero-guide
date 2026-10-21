export type BulletItem = {
  id: string;
  text: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
};

export type StepItem = {
  id: string;
  text: string;
};

export type KeyValueItem = {
  id: string;
  key: string;
  value: string;
};

export type TableColumn = {
  key: string;
  label: string;
};

export type TableRow = {
  id: string;
  values: Record<string, string>;
};

export type SimpleTableData = {
  columns: TableColumn[];
  rows: TableRow[];
};