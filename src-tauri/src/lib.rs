mod db;

use screenshots::Screen;
use std::time::Instant;
use std::time::{SystemTime, UNIX_EPOCH};
use std::io::Cursor;
use std::fs;
use std::error::Error;
use std::io::ErrorKind;
use base64::prelude::*;
use tauri::Manager;

fn init_sqlite_on_startup(app: &tauri::App) -> Result<(), Box<dyn Error>> {
    let app_data_dir = app.path().app_local_data_dir()?;
    fs::create_dir_all(&app_data_dir)?;

    let db_path = app_data_dir.join("echo_vision.db");
    db::init_database(&db_path)?;

    println!("SQLite + schema initialized at {}", db_path.display());
    Ok(())
}

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

#[tauri::command]
fn save_capture_record(
    app: tauri::AppHandle,
    image_base64: String,
    response_text: String,
) -> Result<i64, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;

    let captures_dir = app_data_dir.join("captures");
    fs::create_dir_all(&captures_dir).map_err(|e| e.to_string())?;

    let image_bytes = BASE64_STANDARD
        .decode(image_base64.as_bytes())
        .map_err(|e| format!("Failed to decode image: {e}"))?;

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis();
    let file_name = format!("capture_{now_ms}.png");
    let image_path = captures_dir.join(file_name);

    fs::write(&image_path, image_bytes).map_err(|e| e.to_string())?;

    let db_path = app_data_dir.join("echo_vision.db");
    let image_path_str = image_path.to_string_lossy().to_string();
    db::insert_capture(&db_path, &image_path_str, &response_text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn list_capture_records(app: tauri::AppHandle) -> Result<Vec<db::CaptureRecord>, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("echo_vision.db");

    db::list_captures(&db_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_capture_image(image_path: String) -> Result<String, String> {
    let image_bytes = fs::read(&image_path).map_err(|e| e.to_string())?;
    Ok(BASE64_STANDARD.encode(image_bytes))
}

#[tauri::command]
fn delete_capture_record(app: tauri::AppHandle, capture_id: i64) -> Result<bool, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("echo_vision.db");

    let image_path = db::delete_capture(&db_path, capture_id).map_err(|e| e.to_string())?;

    let Some(image_path) = image_path else {
        return Ok(false);
    };

    match fs::remove_file(&image_path) {
        Ok(_) => Ok(true),
        Err(err) if err.kind() == ErrorKind::NotFound => Ok(true),
        Err(err) => Err(err.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            init_sqlite_on_startup(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            capture_screen,
            save_capture_record,
            list_capture_records,
            read_capture_image,
            delete_capture_record
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}