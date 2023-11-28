import Database from "tauri-plugin-sql-api";

export const db = Database.load("sqlite:pros_rs.sqlite");
export async function database() {
    return await db;
}
