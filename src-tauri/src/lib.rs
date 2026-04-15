use screenshots::Screen;
use std::time::Instant;
use std::io::Cursor;
use base64::prelude::*;

#[tauri::command]
fn capture_screen(x: Option<u32>, y: Option<u32>, width: Option<u32>, height: Option<u32>) -> Result<String, String> {
    let start = Instant::now();
    
    let screens = Screen::all().map_err(|e| e.to_string())?;
    let screen = screens[0]; // Captures primary display
    let image = screen.capture().map_err(|e| e.to_string())?;
    
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    // If we received crop coordinates, crop it!
    if let (Some(x), Some(y), Some(w), Some(h)) = (x, y, width, height) {
        let cropped = screenshots::image::imageops::crop_imm(&image, x, y, w, h).to_image();
        cropped.write_to(&mut cursor, screenshots::image::ImageFormat::Png).map_err(|e| e.to_string())?;
    } else {
        // Otherwise, send the whole screen
        image.write_to(&mut cursor, screenshots::image::ImageFormat::Png).map_err(|e| e.to_string())?;
    }
    
    let b64 = BASE64_STANDARD.encode(&buffer);
    println!("Captured screen in {:?}", start.elapsed());
    
    Ok(b64)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![capture_screen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}