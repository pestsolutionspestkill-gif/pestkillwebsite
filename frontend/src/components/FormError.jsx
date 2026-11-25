// Error message for website forms. When our server cannot be reached, the error carries a WhatsApp
// link with the visitor's details already typed; it is shown as a button the visitor taps, because
// browsers (especially on phones) block windows opened automatically after a network request.
const FormError = ({ error, className = 'form-error' }) => {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div className={className} role="alert">
      <p>{message}</p>
      {error.waUrl && (
        <a className="btn btn-primary btn-sm wa-fallback" href={error.waUrl} target="_blank" rel="noopener noreferrer">Send my details on WhatsApp</a>
      )}
    </div>
  );
};

export default FormError;
