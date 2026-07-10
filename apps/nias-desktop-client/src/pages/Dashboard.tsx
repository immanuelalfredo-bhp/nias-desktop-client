import { useState } from 'react';

export default function Dashboard() {
  const [isBusy, setIsBusy] = useState(false);

  const handleSync = async () => {
    setIsBusy(true);
    try {
      const versionResult = await window.electronAPI.syncPull();
      if (!versionResult.success) {
        console.error('Sync pull failed:', versionResult.message);
        return;
      }

      const changeCount = Object.values(versionResult.data?.changes || {}).reduce(
        (acc, changes) => acc + changes.length,
        0,
      );
      console.log(`Sync pull completed successfully. Total changes: ${changeCount}`);

    } catch (error) {
      console.error('Error during sync pull:', error);
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
