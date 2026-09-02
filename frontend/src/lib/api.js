const API_BASE = 'http://localhost:5000/api';

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

export const processPersonFrame = async (imageBase64) => {
  const res = await fetch(`${API_BASE}/person/process_frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, timestamp_ms: Date.now() }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
};

export const scanPersonDirectory = async (directoryPath) => {
  const res = await fetch(`${API_BASE}/person/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory_path: directoryPath }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
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

export const uploadPersonImage = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/person/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const uploadVehicleImage = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/vehicle/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};
