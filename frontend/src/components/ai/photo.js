// Shrinks a phone photo before upload (max 1600 px, JPEG) and keeps a preview URL.
export const shrinkPhoto = (file) => new Promise((resolve, reject) => {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { reject(new Error('Choose a JPG, PNG or WebP photo.')); return; }
  if (file.size > 15 * 1024 * 1024) { reject(new Error('This photo is too large. Choose one under 15 MB.')); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    resolve({ dataUrl, preview: dataUrl });
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this photo.')); };
  img.src = url;
});
