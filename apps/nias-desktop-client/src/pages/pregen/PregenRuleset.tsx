import { useEffect, useState, useRef } from 'react';
import RulesetModal from './RulesetModal';

type StatusTab = 'active' | 'deleted';
type SyncFilter = 'all' | 'synced' | 'unsynced';
type DirtyFilter = 'all' | 'dirty' | 'not dirty';

export default function PregenRulesPage() {
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rulesetToEdit, setRulesetToEdit] = useState<any | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [dirtyFilter, setDirtyFilter] = useState<DirtyFilter>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchRulesets = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.generationRuleListWithNames(true)
          : await window.electronAPI.generationRuleListWithNames(false);

      if (response.success) {
        setRulesets(response.data || []);
      } else {
        console.error(`Failed to fetch rulesets:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching rulesets:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchRulesets();
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

  const filteredRulesets = rulesets.filter((rulesetItem) => {
    const hasDeletedAt =
      rulesetItem.deletedAt !== null &&
      rulesetItem.deletedAt !== undefined &&
      rulesetItem.deletedAt !== '';
    const isDeletedMatch =
      statusTab === 'deleted'
        ? hasDeletedAt || Boolean(rulesetItem.isDeleted)
        : !hasDeletedAt && !Boolean(rulesetItem.isDeleted);

    if (!isDeletedMatch) return false;

    // Sync Filter logic
    if (syncFilter === 'synced' && !rulesetItem.isSynced) return false;
    if (syncFilter === 'unsynced' && rulesetItem.isSynced) return false;

    // Dirty Filter logic
    if (dirtyFilter === 'dirty' && !rulesetItem.isDirty) return false;
    if (dirtyFilter === 'not dirty' && rulesetItem.isDirty) return false;

    // Search Query logic
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (queryTerms.length === 0) return true;

    return queryTerms.every((term) => {
      const matchesItemName = rulesetItem.itemName?.toLowerCase().includes(term);
      const matchesModeName = rulesetItem.modeName?.toLowerCase().includes(term);
      const matchesUomName = rulesetItem.uomName?.toLowerCase().includes(term);
      const matchesCategoryName = rulesetItem.categoryName?.toLowerCase().includes(term);
      const matchesBrandName = rulesetItem.brandName?.toLowerCase().includes(term);

      return (
        matchesItemName ||
        matchesModeName ||
        matchesUomName ||
        matchesCategoryName ||
        matchesBrandName
      );
    });
  });

  const displayedRulesets = filteredRulesets.slice(0, 100);

  const totalCount = rulesets.length;
  const syncedCount = rulesets.filter((r) => r.isSynced).length;
  const notSyncedCount = totalCount - syncedCount;

  const handleOpenCreateModal = () => {
    setRulesetToEdit(null); // Clear out any previous edit selection
    setShowModal(true);
  };

  const handleOpenEditModal = (rulesetItem: any) => {
    setRulesetToEdit(rulesetItem); // Pass selected item data for editing
    setShowModal(true);
  };

  const handleDeleteRuleset = async (id: string) => {
    try {
      const result = await window.electronAPI.generationRuleDelete(id);
      if (result.success) fetchRulesets();
      else console.error(`Failed to delete ruleset:`, result.message);
    } catch (error) {
      console.error(`Error deleting ruleset:`, error);
    }
  };

  const handleRestoreRuleset = async (id: string) => {
    try {
      const result = await window.electronAPI.generationRuleRestore(id);
      if (result.success) fetchRulesets();
      else console.error(`Failed to restore ruleset:`, result.message);
    } catch (error) {
      console.error(`Error restoring ruleset:`, error);
    }
  };

  const handleRunVariantGenerator = async () => {
    try {
      const result = await window.electronAPI.variantGeneratorRun();
      if (result.success) {
        console.log('Variant generator executed successfully.');
        fetchRulesets();
      } else {
        console.error('Failed to run variant generator:', result.message);
      }
    } catch (error) {
      console.error('Error running variant generator:', error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchRulesets();
  };

  if (isBusy && rulesets.length === 0) {
    return (
      <section id="rulesetsScreen" className="card panel app-screen">
        <h2>Generations Rules</h2>
        <p className="muted">Loading rulesets...</p>
      </section>
    );
  }

  return (
    <section id="rulesetsScreen" className="card panel app-screen">
      <style>{`
        .search-pill-container::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }
      `}</style>

      {/* Consolidated Single-Row Controls Bar */}
      <div
        className="definition-controls-row"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
      >
        {/* Search Pill Container */}
        <div
          ref={searchContainerRef}
          className="search-pill-container"
          onClick={() => {
            const editable = searchContainerRef.current?.querySelector('[contenteditable]');
            (editable as HTMLElement)?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 10px',
            background: 'var(--panel-bg, #fff)',
            border: 'var(--input-border, 1px solid var(--border-color, #e2e8f0))',
            borderRadius: 'var(--radius, 8px)',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            flex: '1',
            minWidth: '220px',
            cursor: 'text',
            height: '38px',
            boxSizing: 'border-box',
          }}
        >
          {statusTab === 'deleted' && (
            <span
              className="inline-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--danger-subtle, #fee2e2)',
                color: 'var(--danger, #991b1b)',
                height: '26px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Status: Deleted
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusTab('active');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          )}

          {syncFilter !== 'all' && (
            <span
              className="inline-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--primary-subtle, #e0e7ff)',
                color: 'var(--primary-dark, #3730a3)',
                padding: '2px 6px',
                height: '26px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Sync: {syncFilter === 'synced' ? 'Synced' : 'Not Synced'}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSyncFilter('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          )}

          {dirtyFilter !== 'all' && (
            <span
              className="inline-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--warning-subtle, #fef3c7)',
                color: 'var(--warning-dark, #92400e)',
                padding: '2px 6px',
                height: '26px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Dirty: {dirtyFilter === 'dirty' ? 'Dirty' : 'Not Dirty'}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDirtyFilter('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          )}

          <div
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setSearchQuery(e.currentTarget.textContent || '')}
            style={{
              outline: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'inherit',
              minWidth: '100px',
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
        </div>

        {/* Right side controls group */}
        <div
          className="right-controls-group"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {/* Filters Dropdown Chip */}
          <div
            className="sync-dropdown-container"
            ref={dropdownRef}
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              className="secondary dropdown-chip-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>Filters</span>
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu" style={{ minWidth: '180px', padding: '8px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    color: 'var(--muted-color, #888)',
                  }}
                >
                  Status
                </div>
                <button
                  type="button"
                  className={`dropdown-item ${statusTab === 'active' ? 'selected' : ''}`}
                  onClick={() => setStatusTab('active')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Active Rulesets
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${statusTab === 'deleted' ? 'selected' : ''}`}
                  onClick={() => setStatusTab('deleted')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Deleted Rulesets
                </button>

                <div
                  style={{
                    margin: '6px 0',
                    height: '1px',
                    background: 'var(--border-color, #ddd)',
                  }}
                />

                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    color: 'var(--muted-color, #888)',
                  }}
                >
                  Sync Status
                </div>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'all' ? 'selected' : ''}`}
                  onClick={() => setSyncFilter('all')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  All Sync States
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'synced' ? 'selected' : ''}`}
                  onClick={() => setSyncFilter('synced')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Synced Only
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'unsynced' ? 'selected' : ''}`}
                  onClick={() => setSyncFilter('unsynced')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Not Synced Only
                </button>

                <div
                  style={{
                    margin: '6px 0',
                    height: '1px',
                    background: 'var(--border-color, #ddd)',
                  }}
                />

                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    color: 'var(--muted-color, #888)',
                  }}
                >
                  Dirty State
                </div>
                <button
                  type="button"
                  className={`dropdown-item ${dirtyFilter === 'all' ? 'selected' : ''}`}
                  onClick={() => setDirtyFilter('all')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  All Dirty States
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${dirtyFilter === 'dirty' ? 'selected' : ''}`}
                  onClick={() => setDirtyFilter('dirty')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Dirty Only
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${dirtyFilter === 'not dirty' ? 'selected' : ''}`}
                  onClick={() => setDirtyFilter('not dirty')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Not Dirty Only
                </button>
              </div>
            )}
          </div>

          {/* Run Variant Generator Button */}
          <button className="secondary" onClick={handleRunVariantGenerator}>
            Run Variant Generator
          </button>
        </div>
      </div>

      <div className="spacer" />
      <div className="divider" />
      <div className="spacer" />

      {/* Table Section Header with Create Ruleset Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0 }}>
          {statusTab === 'active' ? 'Active Generations Rules' : 'Deleted Generations Rules'}
        </h3>

        <button className="primary" onClick={handleOpenCreateModal}>
          Create Ruleset
        </button>
      </div>

      {/* Rulesets Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Mode Name</th>
              <th>UoM Name</th>
              <th>Category Name</th>
              <th>Brand Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRulesets.length > 0 ? (
              displayedRulesets.map((rulesetItem) => (
                <tr key={rulesetItem.id}>
                  <td>{rulesetItem.itemName || '—'}</td>
                  <td>{rulesetItem.modeName || '—'}</td>
                  <td>{rulesetItem.uomName || '—'}</td>
                  <td>{rulesetItem.categoryName || '—'}</td>
                  <td>{rulesetItem.brandName || '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button
                            className="secondary"
                            onClick={() => handleOpenEditModal(rulesetItem)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger"
                            onClick={() => handleDeleteRuleset(rulesetItem.id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="secondary"
                          onClick={() => handleRestoreRuleset(rulesetItem.id)}
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
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }} className="muted">
                  {searchQuery || syncFilter !== 'all' || dirtyFilter !== 'all'
                    ? `No matching ${statusTab} rulesets found.`
                    : `No ${statusTab} rulesets found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} total rulesets ({syncedCount} synced | {notSyncedCount} not synced)
        </span>
      </div>

      {/* Modal Integration */}
      <RulesetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setRulesetToEdit(null);
        }}
        onSuccess={handleModalSuccess}
        initialData={rulesetToEdit}
      />
    </section>
  );
}