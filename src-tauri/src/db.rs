use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::error::Error;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct CaptureRecord {
    pub id: i64,
    pub image_path: String,
    pub response_text: String,
    pub created_at: String,
}

pub fn init_database(db_path: &Path) -> Result<(), Box<dyn Error>> {
    let connection = Connection::open(db_path)?;

    connection.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS captures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            response_text TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        ",
    )?;

    Ok(())
}

pub fn insert_capture(
    db_path: &Path,
    image_path: &str,
    response_text: &str,
) -> Result<i64, Box<dyn Error>> {
    let connection = Connection::open(db_path)?;

    connection.execute(
        "INSERT INTO captures (image_path, response_text) VALUES (?1, ?2)",
        params![image_path, response_text],
    )?;

    Ok(connection.last_insert_rowid())
}

pub fn list_captures(db_path: &Path) -> Result<Vec<CaptureRecord>, Box<dyn Error>> {
    let connection = Connection::open(db_path)?;
    let mut statement = connection.prepare(
        "
        SELECT id, image_path, response_text, created_at
        FROM captures
        ORDER BY id DESC
        ",
    )?;

    let records = statement
        .query_map([], |row| {
            Ok(CaptureRecord {
                id: row.get(0)?,
                image_path: row.get(1)?,
                response_text: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(records)
}

pub fn delete_capture(db_path: &Path, capture_id: i64) -> Result<Option<String>, Box<dyn Error>> {
    let connection = Connection::open(db_path)?;

    let image_path: Option<String> = connection
        .query_row(
            "SELECT image_path FROM captures WHERE id = ?1",
            params![capture_id],
            |row| row.get(0),
        )
        .optional()?;

    if image_path.is_none() {
        return Ok(None);
    }

    connection.execute("DELETE FROM captures WHERE id = ?1", params![capture_id])?;
    Ok(image_path)
}
