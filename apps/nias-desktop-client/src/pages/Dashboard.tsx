import { useState } from 'react';

export default function Dashboard() {
  const [isBusy, setIsBusy] = useState(false);

  const handleSync = async () => {
    setIsBusy(true);
    try {
      const versionResult = await window.electronAPI.syncFetchVersion();
      if (!versionResult.success) {
        console.error('Error getting sync version:', versionResult.message);
        return;
      }
      console.log('Sync version fetched successfully:', versionResult.data.syncVersion);
    } catch (error) {
      console.error('Error fetching sync version:', error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section id="homeScreen" className="card panel app-screen">
      <h2>Dashboard</h2>
      <p className="muted">Use the left navigation to access users and other modules.</p>
      <button className="primary" onClick={handleSync} disabled={isBusy}>
        Sync
      </button>
    </section>
  );
}
