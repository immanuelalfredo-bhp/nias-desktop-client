import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import VendorModal from './VendorModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<attribute.Vendor[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<attribute.Vendor | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchVendors = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.vendorListActive()
          : await window.electronAPI.vendorListDeleted();

      if (response.success) {
        setVendors(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} vendors:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} vendors:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [statusTab]);

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

  const filteredVendors = vendors.filter((vendor) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return vendor.isSynced;
      if (syncFilter === 'unsynced') return !vendor.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = vendor.name.toLowerCase().includes(term);
      const matchesSku = vendor.skuCode.toLowerCase().includes(term);

      return matchesName || matchesSku;
    });

    if (syncFilter === 'synced') return matchesSearch && vendor.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !vendor.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedVendors = filteredVendors.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = vendors.length;
  const syncedCount = vendors.filter((b) => b.isSynced).length;
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

  const handleOpenCreateModal = () => {
    setVendorToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (vendor: attribute.Vendor) => {
    setVendorToEdit(vendor);
    setShowModal(true);
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      const result = await window.electronAPI.vendorDelete(id);
      if (result.success) {
        fetchVendors();
      } else {
        console.error(`Failed to delete vendor:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting vendor:`, error);
    }
  };

  const handleRestoreVendor = async (id: string) => {
    try {
      const result = await window.electronAPI.vendorRestore(id);
      if (result.success) {
        fetchVendors();
      } else {
        console.error(`Failed to restore vendor:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring vendor:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchVendors();
  };

  if (isBusy && vendors.length === 0) {
    return (
      <section id="vendorsScreen" className="card panel app-screen">
        <h2>Vendors</h2>
        <p className="muted">Loading vendors...</p>
      </section>
    );
  }

  return (
    <section id="vendorsScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search vendors..."
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

          {/* Active | Deleted Segmented Toggle Button */}
          <div className="segmented-toggle">
            <button
              type="button"
              className={`segmented-btn ${statusTab === 'active' ? 'active' : ''}`}
              onClick={() => setStatusTab('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusTab === 'deleted' ? 'active' : ''}`}
              onClick={() => setStatusTab('deleted')}
            >
              Deleted
            </button>
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
        <h3 style={{ margin: 0 }}>
          {statusTab === 'active' ? 'Active Vendors' : 'Deleted Vendors'}
        </h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New Vendor
        </button>
      </div>

      {/* Vendors Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>Name</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedVendors.length > 0 ? (
              displayedVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.skuCode || '—'}</td>
                  <td>{vendor.name}</td>
                  <td>{vendor.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(vendor)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteVendor(vendor.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="secondary"
                          onClick={() => handleRestoreVendor(vendor.id)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }} className="muted">
                  {searchQuery || syncFilter !== 'all'
                    ? `No matching ${statusTab} vendors found.`
                    : `No ${statusTab} vendors found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} vendors out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <VendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        vendorToEdit={vendorToEdit}
      />
    </section>
  );
}
