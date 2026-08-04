import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import DimensionModal from './DimensionModal';
import DimensionValueModal from './DimensionValueModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function DimensionPage() {
  const [dimensions, setDimensions] = useState<attribute.Dimension[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dimensionToEdit, setDimensionToEdit] = useState<attribute.Dimension | null>(null);

  // Dimension Value Modal States
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedDimensionForValue, setSelectedDimensionForValue] =
    useState<attribute.Dimension | null>(null);
  const [valueToEdit, setValueToEdit] = useState<attribute.DimensionValue | null>(null);

  // Tracking expanded rows and their independent child values
  const [expandedDimensionIds, setExpandedDimensionIds] = useState<Record<string, boolean>>({});
  const [dimensionValuesMap, setDimensionValuesMap] = useState<
    Record<string, attribute.DimensionValue[]>
  >({});

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchDimensions = async () => {
    try {
      setIsBusy(true);

      if (statusTab === 'active') {
        const response = await window.electronAPI.dimensionListActive();
        if (response.success) {
          setDimensions(response.data || []);
        } else {
          console.error(`Failed to fetch active dimensions:`, response.message);
        }
      } else {
        // 1. Get truly deleted dimensions
        const deletedRes = await window.electronAPI.dimensionListDeleted();
        const trulyDeletedDims = deletedRes.success ? deletedRes.data || [] : [];
        const trulyDeletedIds = new Set(trulyDeletedDims.map((d) => d.id)); // Properly mapped for lookup

        // 2. Get active dimensions to check for deleted children
        const activeRes = await window.electronAPI.dimensionListActive();
        const activeDims = activeRes.success ? activeRes.data || [] : [];

        const hybridDeletedDims: attribute.Dimension[] = [...trulyDeletedDims];

        for (const activeDim of activeDims) {
          // Check if this active dimension has any deleted child values
          const valRes = await window.electronAPI.dimensionValueGetDeletedByDimensionId(
            activeDim.id,
          );
          if (valRes.success && valRes.data && valRes.data.length > 0) {
            // Avoid duplication if it's already accounted for
            if (
              !trulyDeletedIds.has(activeDim.id) &&
              !hybridDeletedDims.some((d) => d.id === activeDim.id)
            ) {
              hybridDeletedDims.push(activeDim);
            }
          }
        }

        setDimensions(hybridDeletedDims);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} dimensions:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  const fetchDimensionValues = async (dimensionId: string) => {
    try {
      // Fetch values based on current statusTab context
      const response =
        statusTab === 'active'
          ? await window.electronAPI.dimensionValueGetActiveByDimensionId(dimensionId)
          : await window.electronAPI.dimensionValueGetDeletedByDimensionId(dimensionId);

      if (response.success) {
        setDimensionValuesMap((prev) => ({
          ...prev,
          [dimensionId]: response.data || [],
        }));
      }
    } catch (error) {
      console.error(`Error fetching values for dimension ${dimensionId}:`, error);
    }
  };

  useEffect(() => {
    fetchDimensions();
    setExpandedDimensionIds({});
    setDimensionValuesMap({});
  }, [statusTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDimensionRow = async (id: string) => {
    const willBeExpanded = !expandedDimensionIds[id];

    setExpandedDimensionIds((prev) => ({
      ...prev,
      [id]: willBeExpanded,
    }));

    if (willBeExpanded && !dimensionValuesMap[id]) {
      await fetchDimensionValues(id);
    }
  };

  const filteredDimensions = dimensions.filter((dimension) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return dimension.isSynced;
      if (syncFilter === 'unsynced') return !dimension.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = dimension.name.toLowerCase().includes(term);

      return matchesName;
    });

    if (syncFilter === 'synced') return matchesSearch && dimension.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !dimension.isSynced;
    return matchesSearch;
  });

  const displayedDimensions = filteredDimensions.slice(0, 100);

  const totalCount = dimensions.length;
  const syncedCount = dimensions.filter((d) => d.isSynced).length;
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
    setDimensionToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (dimension: attribute.Dimension) => {
    setDimensionToEdit(dimension);
    setShowModal(true);
  };

  const handleOpenAddValueModal = (dimension: attribute.Dimension) => {
    setSelectedDimensionForValue(dimension);
    setValueToEdit(null);
    setShowValueModal(true);
  };

  const handleOpenEditValueModal = (
    dimension: attribute.Dimension,
    val: attribute.DimensionValue,
  ) => {
    setSelectedDimensionForValue(dimension);
    setValueToEdit(val);
    setShowValueModal(true);
  };

  const handleDeleteDimension = async (id: string) => {
    try {
      const result = await window.electronAPI.dimensionDelete(id);
      if (result.success) {
        fetchDimensions();
      } else {
        console.error(`Failed to delete dimension:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting dimension:`, error);
    }
  };

  const handleRestoreDimension = async (id: string) => {
    try {
      const result = await window.electronAPI.dimensionRestore(id);
      if (result.success) {
        fetchDimensions();
      } else {
        console.error(`Failed to restore dimension:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring dimension:`, error);
    }
  };

  const handleDeleteValue = async (dimensionId: string, valueId: string) => {
    try {
      const result = await window.electronAPI.dimensionValueDelete(valueId);
      if (result.success) {
        fetchDimensionValues(dimensionId);
      } else {
        console.error(`Failed to delete dimension value:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting dimension value:`, error);
    }
  };

  const handleRestoreValue = async (dimensionId: string, valueId: string) => {
    try {
      const result = await window.electronAPI.dimensionValueRestore(valueId);
      if (result.success) {
        fetchDimensionValues(dimensionId);
      } else {
        console.error(`Failed to restore dimension value:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring dimension value:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchDimensions();
  };

  const handleValueModalSuccess = (message: string, dimensionId: string) => {
    console.log(message);
    fetchDimensionValues(dimensionId);
  };

  if (isBusy && dimensions.length === 0) {
    return (
      <section id="dimensionsScreen" className="card panel app-screen">
        <h2>Dimensions</h2>
        <p className="muted">Loading dimensions...</p>
      </section>
    );
  }

  return (
    <section id="dimensionsScreen" className="card panel app-screen">
      {/* Controls Bar */}
      <div className="definition-controls-row">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search dimensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="right-controls-group">
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

      {/* Table Section Header */}
      <div className="definition-controls-row" style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>
          {statusTab === 'active' ? 'Active Dimensions' : 'Deleted Dimensions'}
        </h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New Dimension
        </button>
      </div>

      {/* Dimensions Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Scope</th>
              <th>Position</th>
              <th>Sort Order</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedDimensions.length > 0 ? (
              displayedDimensions.map((dimension) => {
                const isExpanded = !!expandedDimensionIds[dimension.id];
                const values = dimensionValuesMap[dimension.id] || [];

                // Determine if this dimension itself is soft-deleted or just has deleted values
                // (Assumes dimension object has a deletedAt or isDeleted property, or check via backend)
                // If checking via backend, you could also track a set of truly deleted IDs during fetch.
                // For this template, we check a standard property pattern like dimension.deletedAt.
                const isParentDeleted =
                  statusTab === 'deleted' &&
                  (dimension.deletedAt != null || (dimension as any).isDeleted);

                return (
                  <>
                    <tr key={dimension.id}>
                      <td>{dimension.name}</td>
                      <td>{dimension.scope || '—'}</td>
                      <td>{dimension.position || '—'}</td>
                      <td>{dimension.sortOrder ?? '—'}</td>
                      <td>
                        <div className="inline-actions" style={{ justifyContent: 'center' }}>
                          {statusTab === 'active' ? (
                            <>
                              <button
                                className="secondary compact-btn"
                                onClick={() => handleOpenAddValueModal(dimension)}
                              >
                                Add Value
                              </button>
                              <button
                                className="secondary compact-btn"
                                onClick={() => handleOpenEditModal(dimension)}
                              >
                                Edit
                              </button>
                              <button
                                className="danger compact-btn"
                                onClick={() => handleDeleteDimension(dimension.id)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            // Only show Restore button if the parent dimension itself is deleted
                            isParentDeleted && (
                              <button
                                className="secondary compact-btn"
                                onClick={() => handleRestoreDimension(dimension.id)}
                              >
                                Restore
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            className="secondary compact-btn"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              boxShadow: 'none',
                              padding: '2px 4px',
                              minWidth: 'auto',
                              marginLeft: '4px',
                            }}
                            onClick={() => toggleDimensionRow(dimension.id)}
                            title="Toggle Values"
                          >
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible Sub-row for Dimension Values */}
                    {isExpanded && (
                      <tr key={`${dimension.id}-values`} className="subrow-container">
                        <td
                          colSpan={5}
                          style={{ padding: 0, background: 'var(--panel-bg, inherit)' }}
                        >
                          {values.length > 0 ? (
                            <table
                              style={{
                                background: 'transparent',
                                margin: 0,
                                width: '100%',
                                boxShadow: 'none',
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    borderTop:
                                      '1px solid var(--border-color, rgba(128, 128, 128, 0.2))',
                                    borderBottom:
                                      '1px solid var(--border-color, rgba(128, 128, 128, 0.2))',
                                    fontSize: '12px',
                                    color: 'var(--muted)',
                                  }}
                                >
                                  <th style={{ paddingLeft: '32px', fontWeight: 600 }}>SKU Code</th>
                                  <th style={{ fontWeight: 600 }}>Value Name</th>
                                  <th style={{ fontWeight: 600 }}>Numeric Value</th>
                                  <th style={{ fontWeight: 600 }}>Sort Order</th>
                                  <th className="col-actions" style={{ fontWeight: 600 }}>
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {values.map((val) => (
                                  <tr
                                    key={val.id}
                                    style={{
                                      borderTop:
                                        '1px solid var(--border-color, rgba(128, 128, 128, 0.1))',
                                    }}
                                  >
                                    <td style={{ paddingLeft: '32px' }}>{val.skuCode}</td>
                                    <td>{val.name}</td>
                                    <td>{val.numericValue ?? '—'}</td>
                                    <td>{val.sortOrder ?? 0}</td>
                                    <td>
                                      <div
                                        className="inline-actions"
                                        style={{ justifyContent: 'center' }}
                                      >
                                        {statusTab === 'active' ? (
                                          <>
                                            <button
                                              className="secondary compact-btn"
                                              onClick={() =>
                                                handleOpenEditValueModal(dimension, val)
                                              }
                                            >
                                              Edit
                                            </button>
                                            <button
                                              className="danger compact-btn"
                                              onClick={() =>
                                                handleDeleteValue(dimension.id, val.id)
                                              }
                                            >
                                              Delete
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            className="secondary compact-btn"
                                            onClick={() => handleRestoreValue(dimension.id, val.id)}
                                          >
                                            Restore
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div
                              className="muted"
                              style={{ fontSize: '13px', padding: '12px 32px' }}
                            >
                              No dimension values defined yet.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }} className="muted">
                  {searchQuery || syncFilter !== 'all'
                    ? `No matching ${statusTab} dimensions found.`
                    : `No ${statusTab} dimensions found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} dimensions out of {syncedCount} synced | {notSyncedCount} not
          synced
        </span>
      </div>

      <DimensionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        dimensionToEdit={dimensionToEdit}
      />

      <DimensionValueModal
        isOpen={showValueModal}
        onClose={() => setShowValueModal(false)}
        onSuccess={(msg) =>
          selectedDimensionForValue && handleValueModalSuccess(msg, selectedDimensionForValue.id)
        }
        dimension={selectedDimensionForValue}
        valueToEdit={valueToEdit}
      />
    </section>
  );
}
