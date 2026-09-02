const API_BASE = 'http://localhost:5000/api';

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
};

export const processPersonFrame = async (imageBase64) => {
  try {
    const res = await fetch(`${API_BASE}/person/process_frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        timestamp_ms: Date.now()
      })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error processing person frame:', err);
    throw err;
  }
};

export const scanPersonDirectory = async (directoryPath) => {
  const res = await fetch(`${API_BASE}/person/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory_path: directoryPath })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to scan directory (${res.status})`);
  }
  return await res.json();
};

export const scanVehicleDirectory = async (directoryPath, aiRecognition = true) => {
  const res = await fetch(`${API_BASE}/vehicle/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directory_path: directoryPath,
      ai_recognition: aiRecognition
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to scan vehicle directory (${res.status})`);
  }
  return await res.json();
};

export const uploadPersonImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/person/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return await res.json();
};

export const uploadVehicleImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/vehicle/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return await res.json();
};
