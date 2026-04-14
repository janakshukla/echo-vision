use screenshots::Screen;
use std::time::Instant;
use std::io::Cursor;
use base64::prelude::*;

#[tauri::command]
fn capture_screen() -> String {
    let start = Instant::now();
    let screens = Screen::all().unwrap();
    
    // Capture the primary display
    let screen = screens[0];
    let image = screen.capture().unwrap();
    
    // Modern way to convert image buffer to PNG bytes
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    image.write_to(&mut cursor, screenshots::image::ImageFormat::Png).unwrap();
    
    // Encode to Base64
    let b64 = BASE64_STANDARD.encode(&buffer);
    println!("Captured screen in {:?}", start.elapsed());
    
    b64
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![capture_screen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}