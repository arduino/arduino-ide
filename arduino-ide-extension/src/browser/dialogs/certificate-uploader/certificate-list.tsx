import React from '@theia/core/shared/react';

export const CertificateListComponent = ({
  certificates,
  selectedCerts,
  setSelectedCerts,
  openContextMenu,
}: {
  certificates: string[];
  selectedCerts: string[];
  setSelectedCerts: React.Dispatch<React.SetStateAction<string[]>>;
  openContextMenu: (x: number, y: number, cert: string) => void;
}): React.ReactElement => {
  const handleOnChange = (event: any) => {
    const target = event.target;

    const newSelectedCerts = selectedCerts.filter(
      (cert) => cert !== target.name
    );

    if (target.checked) {
      newSelectedCerts.push(target.name);
    }

    setSelectedCerts(newSelectedCerts);
  };

  const handleContextMenu = (event: React.MouseEvent, cert: string) => {
    openContextMenu(event.clientX, event.clientY, cert);
  };

  return (
    <div className="certificate-list">
      {certificates.map((certificate, i) => (
        <label
          key={i}
          className="certificate-row"
          onContextMenu={(e) => handleContextMenu(e, certificate)}
        >
          <span className="fl1">{certificate}</span>
          <input
            type="checkbox"
            name={certificate}
            checked={selectedCerts.includes(certificate)}
            onChange={handleOnChange}
          />
        </label>
      ))}
    </div>
  );
};
