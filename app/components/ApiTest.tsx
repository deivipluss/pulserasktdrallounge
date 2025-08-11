'use client';

import { useState, useEffect } from 'react';

export default function ApiTest() {
  const [message, setMessage] = useState<string>('Loading...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/hello');
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        setMessage('Error fetching API data');
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 bg-blue-100 rounded-md">
      <h2 className="text-xl font-bold mb-2">API Test</h2>
      <p className="text-gray-700">{message}</p>
    </div>
  );
}
