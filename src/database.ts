import Database from "tauri-plugin-sql-api";

export const database = Database.load("sqlite:pros_rs.sqlite");

export interface RecentWorkspace {
    name: string;
    path: string;
    last_opened: number;
}
