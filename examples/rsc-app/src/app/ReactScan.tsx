'use client';
import { useEffect } from 'react';
import { scan } from 'react-scan';

export default function ReactScan(): JSX.Element {
  useEffect(() => {
    scan({
      enabled: true,
      dangerouslyForceRunInProduction: true,
      // monitor: {
      //   url: 'https://localhost:3000/api/scan',
      // },
    });
  }, []);

  return <></>;
}
