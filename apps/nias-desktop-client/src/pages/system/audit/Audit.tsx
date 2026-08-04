import { useEffect, useState, useRef } from 'react';
import type { system } from '@nias/shared';

type SyncFilter = 'all' | 'synced' | 'unsynced';

export default function BrandsPage() {
  const [audit, setAudit] = useState<system.Audit[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAudit = async () => {
    try {
      setIsBusy(true);
      const response = await window.electronAPI.auditList();

      if (response.success) {
        setAudit(response.data || []);
      } else {
        console.error(`Failed to fetch audit logs:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching audit logs:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAudit = audit.filter((log) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return log.isSynced;
      if (syncFilter === 'unsynced') return !log.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesAction = log.action.toLowerCase().includes(term);
      const matchesTableName = log.tableName.toLowerCase().includes(term);
      const matchesTimestamp = log.timestamp.toLowerCase().includes(term);
      const matchesDetails =
        typeof log.details === 'string' && log.details.toLowerCase().includes(term);

      return matchesAction || matchesTableName || matchesTimestamp || matchesDetails;
    });

    if (syncFilter === 'synced') return matchesSearch && log.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !log.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedAudit = filteredAudit.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = audit.length;
  const syncedCount = audit.filter((b) => b.isSynced).length;
  const notSyncedCount = totalCount - syncedCount;

  const getSyncLabel = (filter: SyncFilter) => {
    switch (filter) {
      case 'synced':
        return 'Synced';
      case 'unsynced':
        return 'Not Synced';
      default:
        return 'All';
    }
  };

  if (isBusy && audit.length === 0) {
    return (
      <section id="auditScreen" className="card panel app-screen">
        <h2>Audit Logs</h2>
        <p className="muted">Loading audit logs...</p>
      </section>
    );
  }

  return (
    <section id="auditScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right side controls group */}
        <div className="right-controls-group">
          {/* Dropdown Chip for Sync Status */}
          <div className="sync-dropdown-container" ref={dropdownRef}>
            <button
              type="button"
              className="secondary dropdown-chip-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{getSyncLabel(syncFilter)}</span>
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'all' ? 'selected' : ''}`}
                  onClick={() => {
                    setSyncFilter('all');
                    setIsDropdownOpen(false);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'synced' ? 'selected' : ''}`}
                  onClick={() => {
                    setSyncFilter('synced');
                    setIsDropdownOpen(false);
                  }}
                >
                  Synced
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'unsynced' ? 'selected' : ''}`}
                  onClick={() => {
                    setSyncFilter('unsynced');
                    setIsDropdownOpen(false);
                  }}
                >
                  Not Synced
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="spacer" />
      <div className="divider" />
      <div className="spacer" />

      {/* Table Section Header with Create Button on the right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0 }}>{'Audit Log'}</h3>
      </div>

      {/* Brands Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Table Name</th>
              <th>Action</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {displayedAudit.length > 0 ? (
              displayedAudit.map((log) => (
                <tr key={log.id}>
                  <td>{log.tableName || '—'}</td>
                  <td>{log.action}</td>
                  <td>{log.timestamp ?? '—'}</td>
                  <td>
                    {typeof log.details === 'object' && log.details !== null
                      ? JSON.stringify(log.details)
                      : log.details != null
                        ? String(log.details)
                        : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }} className="muted">
                  {searchQuery || syncFilter !== 'all'
                    ? `No matching audit logs found.`
                    : `No audit logs found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} audit logs out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>
    </section>
  );
}
