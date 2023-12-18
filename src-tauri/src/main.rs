// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use gilrs::{Event, Gilrs};
use serde_json::json;
use tauri::{AppHandle, Manager, Runtime, Window};
use tauri_plugin_sql::{Migration, MigrationKind};
use window_vibrancy::{apply_blur, apply_mica, apply_vibrancy, NSVisualEffectMaterial};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

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

#[tauri::command]
async fn gamepad_subscribe<R: Runtime>(app: AppHandle<R>, _window: Window<R>) {
    println!("execute");
    let mut gilrs = Gilrs::new().unwrap();

    loop {
        while let Some(Event { id, event, time }) = gilrs.next_event() {
            let gamepad = gilrs.gamepad(id);
            let buttons: Vec<_> = gamepad
                .state()
                .buttons()
                .map(|b| (b.0, b.1.is_pressed()))
                .collect();
            let axes: Vec<_> = gamepad.state().axes().map(|a| (a.0, a.1.value())).collect();
            let payload = json!({
                "id":id,
                "time": time,
                "buttons": buttons,
                "axes": axes,
            });
            app.emit_all("gamepad", payload);
        }
    }
}

fn main() {
    _ = fix_path_env::fix();
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
            apply_vibrancy(&window, NSVisualEffectMaterial::FullScreenUI, None, None).unwrap();

            #[cfg(target_os = "windows")]
            {
                if let Err(_) = apply_mica(&window, None) {}
                window.set_decorations(true).unwrap();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_home_dir, get_target])
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(db)
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_gamepad::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
