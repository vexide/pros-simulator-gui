// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rfd::AsyncFileDialog;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
use window_vibrancy::{apply_acrylic, apply_blur, apply_vibrancy, NSVisualEffectMaterial};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_home_dir() -> Option<String> {
    dirs::home_dir()
        .as_ref()
        .and_then(|path| path.to_str())
        .map(|s| s.to_string())
}

#[tauri::command]
fn get_target() -> &'static str {
    env!("RUSTC_TARGET")
}

fn main() {
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations(
            "sqlite:pros_rs.sqlite",
            vec![Migration {
                version: 1,
                description: "v1",
                sql: include_str!("../migrations/1.sql"),
                kind: MigrationKind::Up,
            }],
        )
        .build();
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

            #[cfg(target_os = "windows")]
            apply_blur(&window, Some((200, 200, 200, 230)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            #[cfg(target_os = "macos")]
            if let Ok(ns_window) = window.ns_window() {
                use cocoa::appkit::NSWindow;
                use objc::{class, msg_send, sel, sel_impl};
                let id = ns_window as cocoa::base::id;
                unsafe { id.setToolbar_(msg_send![class!(NSToolbar), new]) }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_home_dir, get_target])
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(db)
        .plugin(tauri_plugin_upload::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
