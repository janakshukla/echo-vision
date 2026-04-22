export type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CaptureRecord = {
  id: number;
  image_path: string;
  response_text: string;
  created_at: string;
};
