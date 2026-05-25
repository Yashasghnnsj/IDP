declare module 'react-native-sqlite-storage' {
  export type SQLiteResultSet = {
    rows: {
      length: number;
      item: (index: number) => any;
    };
  };

  export type SQLiteDatabase = {
    executeSql: (
      sql: string,
      params?: unknown[]
    ) => Promise<[SQLiteResultSet]>;
  };

  type OpenDatabaseOptions = {
    name: string;
    location?: string;
  };

  const SQLite: {
    enablePromise: (enabled: boolean) => void;
    openDatabase: (options: OpenDatabaseOptions) => Promise<SQLiteDatabase>;
  };

  export default SQLite;
}
