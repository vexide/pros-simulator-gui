use std::{env, process::Command};

/// Builds mac_ddc library Swift project
fn build_mac_native() {
    // cc::Build::new()
    //     .file("../AppNativeOSXObjC/main.m")
    //     .warnings(true)
    //     .flag("-arch")
    //     .flag("x86_64")
    //     .flag("-arch")
    //     .flag("arm64")
    //     .flag("-mmacosx-version-min=11")
    //     .flag("-framework")
    //     .flag("Foundation")
    //     .flag("-framework")
    //     .flag("AppKit")
    //     .compile("AppNativeOSX");
    let status = Command::new("xcodebuild")
        .arg("build")
        .current_dir("../AppNativeOSX")
        .status()
        .unwrap();
    assert!(status.success());

    let out_dir = env::var("OUT_DIR").unwrap();
    _ = fs_extra::dir::remove("./target/debug/AppNativeOSX.framework");
    fs_extra::copy_items(
        &["../AppNativeOSX/build/Release/AppNativeOSX.framework"],
        "./target/debug/",
        &fs_extra::dir::CopyOptions::new(),
    )
    .unwrap();

    // println!("cargo:rustc-link-lib=dylib=AppNativeOSX");
    println!("cargo:rerun-if-changed=../AppNativeOSX/AppNativeOSX");
}

fn main() {
    // let target = env::var("CARGO_CFG_TARGET_OS").unwrap();
    // if target == "macos" {
    //     build_mac_native();
    // }
    tauri_build::build()
}
