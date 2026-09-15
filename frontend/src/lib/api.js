const API_BASE = 'http://127.0.0.1:5000/api';

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
};

export const processVehicleFrame = async (imageBase64) => {
  const res = await fetch(`${API_BASE}/vehicle/process_frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, timestamp_ms: Date.now() }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
};

export const scanVehicleDirectory = async (directoryPath, aiRecognition = true) => {
  const res = await fetch(`${API_BASE}/vehicle/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory_path: directoryPath, ai_recognition: aiRecognition }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};

export const uploadVehicleFiles = async (files, aiRecognition = true) => {
  const fd = new FormData();
  for (let i = 0; i < files.length; i++) {
    fd.append('files', files[i]);
  }
  fd.append('ai_recognition', aiRecognition ? 'true' : 'false');
  const res = await fetch(`${API_BASE}/vehicle/batch_upload`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
};