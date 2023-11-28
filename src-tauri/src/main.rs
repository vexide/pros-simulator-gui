// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cocoa::appkit::NSWindow;
use objc::{class, msg_send, sel, sel_impl};
use rfd::AsyncFileDialog;
use tauri::Manager;
// use tauri_plugin_sql::{Migration, MigrationKind};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// async fn pick_directory() -> String {
//     AsyncFileDialog::new()
//         .a
// }

fn main() {
    // let db = tauri_plugin_sql::Builder::default()
    //     .add_migrations(
    //         "sqlite:pros_rs.sqlite",
    //         vec![Migration {
    //             version: 1,
    //             description: "v1",
    //             sql: include_str!("../migrations/1.sql"),
    //             kind: MigrationKind::Up,
    //         }],
    //     )
    //     .build();
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(
                &window,
                NSVisualEffectMaterial::UnderWindowBackground,
                None,
                None,
            )
            .unwrap();

            if let Ok(ns_window) = window.ns_window() {
                let id = ns_window as cocoa::base::id;
                unsafe { id.setToolbar_(msg_send![class!(NSToolbar), new]) }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        // .plugin(tauri_plugin_persisted_scope::init())
        // .plugin(db)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
