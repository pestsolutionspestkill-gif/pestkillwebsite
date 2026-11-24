import { createContext, useContext } from 'react';

/*
  Data the server already loaded for this page (e.g. a product), keyed by API path such as
  "/products/envu-premise-sc-1-l". The server renders the page with it and sends it along in
  window.__PK_DATA__, so the first browser render matches the HTML and shows content at once.
*/
const PreloadContext = createContext({});

export const PreloadProvider = ({ data, children }) => <PreloadContext.Provider value={data || {}}>{children}</PreloadContext.Provider>;

/** Returns the preloaded API response for `path`, or null. */
export const usePreloaded = (path) => {
  const data = useContext(PreloadContext);
  return (path && data[path]) || null;
};

/** Reads and validates the data the server embedded in the page. */
export const readEmbeddedData = () => {
  try {
    const el = typeof document !== 'undefined' && document.getElementById('pk-data');
    return el ? JSON.parse(el.textContent) : {};
  } catch { return {}; }
};
