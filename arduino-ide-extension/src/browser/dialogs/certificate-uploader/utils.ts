export const arduinoCert = 'arduino.cc:443';

export function sanifyCertString(cert: string): string {
  const regex = /^(?:.*:\/\/)*(\S+\.+[^:]*):*(\d*)*$/gm;

  const m = regex.exec(cert);

  if (!m) {
    return '';
  }

  const domain = m[1] || '';
  const port = m[2] || '443';

  if (domain.length === 0 || port.length === 0) {
    return '';
  }

  return `${domain}:${port}`;
}

export function certificateList(certificates: string): string[] {
  let certs = certificates
    .split(',')
    .map((cert) => sanifyCertString(cert.trim()))
    .filter((cert) => {
      // remove empty certificates
      if (!cert || cert.length === 0) {
        return false;
      }
      return true;
    });

  // add arduino certificate at the top of the list
  certs = certs.filter((cert) => cert !== arduinoCert);
  certs.unshift(arduinoCert);
  return certs;
}
