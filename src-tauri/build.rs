use std::env;

fn main() {
    let triple = env::var("TARGET").unwrap();
    println!("cargo:rustc-env=RUSTC_TARGET={}", triple);
    tauri_build::build()
}
