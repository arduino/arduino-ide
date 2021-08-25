import * as React from 'react';

export const CertificateAddComponent = ({
  addCertificate,
}: {
  addCertificate: (cert: string) => void;
}): React.ReactElement => {
  const [value, setValue] = React.useState('');

  const handleChange = React.useCallback((event) => {
    setValue(event.target.value);
  }, []);

  return (
    <form
      className="certificate-add"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        addCertificate(value);
        setValue('');
      }}
    >
      <label>
        <div>Add URL to fetch SSL certificate</div>
        <input
          className="theia-input"
          placeholder="Enter URL"
          type="text"
          name="add"
          onChange={handleChange}
          value={value}
        />
      </label>
    </form>
  );
};
