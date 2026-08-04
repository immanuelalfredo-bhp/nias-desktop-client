import { useState, useMemo, useEffect, useRef } from 'react';
import ModalTemplate from '../../components/templates/Modal';

interface AutocompleteOption {
  id: string;
  name: string;
}

interface RulesetRowData {
  id?: string;
  itemId?: string;
  itemName?: string;
  modeId?: string;
  modeName?: string;
  uomId?: string;
  uomName?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  rules?: string | object;
}

interface EditRulesetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialData?: RulesetRowData | null;
}

export default function EditRulesetModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EditRulesetModalProps) {
  if (!isOpen) return null;

  // Distinguish between updating an existing row versus creating a new one
  const isEditing = Boolean(initialData?.id);

  // --- Form States (Pre-populated from initialData if available) ---
  const [itemId, setItemId] = useState(initialData?.itemId || '');
  const [itemInput, setItemInput] = useState(initialData?.itemName || '');
  
  const [modeId, setModeId] = useState(initialData?.modeId || '');
  const [modeInput, setModeInput] = useState(initialData?.modeName || '');
  
  const [uomId, setUomId] = useState(initialData?.uomId || '');
  const [uomInput, setUomInput] = useState(initialData?.uomName || '');
  
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [categoryInput, setCategoryInput] = useState(initialData?.categoryName || '');
  
  const [brandId, setBrandId] = useState(initialData?.brandId || '');
  const [brandInput, setBrandInput] = useState(initialData?.brandName || '');

  // --- Ruleset Textbox State (Formatted nicely if it's an object) ---
  const [rules, setRules] = useState(() => {
    if (!initialData?.rules) return '';
    if (typeof initialData.rules === 'string') {
      try {
        return JSON.stringify(JSON.parse(initialData.rules), null, 2);
      } catch {
        return initialData.rules;
      }
    }
    return JSON.stringify(initialData.rules, null, 2);
  });

  // --- Master Data States for Autocomplete ---
  const [activeItems, setActiveItems] = useState<AutocompleteOption[]>([]);
  const [activeModes, setActiveModes] = useState<AutocompleteOption[]>([]);
  const [activeUoms, setActiveUoms] = useState<AutocompleteOption[]>([]);
  const [activeCategories, setActiveCategories] = useState<AutocompleteOption[]>([]);
  const [activeBrands, setActiveBrands] = useState<AutocompleteOption[]>([]);

  // --- Active Dropdown Tracker ---
  const [activeDropdown, setActiveDropdown] = useState<
    'item' | 'mode' | 'uom' | 'category' | 'brand' | null
  >(null);

  const [isBusy, setIsBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch active metadata for dropdown options on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [itemRes, modeRes, uomRes, catRes, brandRes] = await Promise.all([
          window.electronAPI.itemListActive ? window.electronAPI.itemListActive() : Promise.resolve({ success: false, data: [] }),
          window.electronAPI.modeListActive ? window.electronAPI.modeListActive() : Promise.resolve({ success: false, data: [] }),
          window.electronAPI.uomListActive ? window.electronAPI.uomListActive() : Promise.resolve({ success: false, data: [] }),
          window.electronAPI.categoryListActive ? window.electronAPI.categoryListActive() : Promise.resolve({ success: false, data: [] }),
          window.electronAPI.brandListActive ? window.electronAPI.brandListActive() : Promise.resolve({ success: false, data: [] }),
        ]);

        if (itemRes?.success && Array.isArray(itemRes.data)) {
          const mapped = itemRes.data.map((i: any) => ({ id: i.id, name: i.displayName || i.name || i.skuCode }));
          setActiveItems(mapped);
          if (initialData?.itemId && !initialData?.itemName) {
            const found = mapped.find(x => x.id === initialData.itemId);
            if (found) setItemInput(found.name);
          }
        }
        if (modeRes?.success && Array.isArray(modeRes.data)) {
          const mapped = modeRes.data.map((m: any) => ({ id: m.id, name: m.name }));
          setActiveModes(mapped);
          if (initialData?.modeId && !initialData?.modeName) {
            const found = mapped.find(x => x.id === initialData.modeId);
            if (found) setModeInput(found.name);
          }
        }
        if (uomRes?.success && Array.isArray(uomRes.data)) {
          const mapped = uomRes.data.map((u: any) => ({ id: u.id, name: u.name }));
          setActiveUoms(mapped);
          if (initialData?.uomId && !initialData?.uomName) {
            const found = mapped.find(x => x.id === initialData.uomId);
            if (found) setUomInput(found.name);
          }
        }
        if (catRes?.success && Array.isArray(catRes.data)) {
          const mapped = catRes.data.map((c: any) => ({ id: c.id, name: c.name }));
          setActiveCategories(mapped);
          if (initialData?.categoryId && !initialData?.categoryName) {
            const found = mapped.find(x => x.id === initialData.categoryId);
            if (found) setCategoryInput(found.name);
          }
        }
        if (brandRes?.success && Array.isArray(brandRes.data)) {
          const mapped = brandRes.data.map((b: any) => ({ id: b.id, name: b.name }));
          setActiveBrands(mapped);
          if (initialData?.brandId && !initialData?.brandName) {
            const found = mapped.find(x => x.id === initialData.brandId);
            if (found) setBrandInput(found.name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch ruleset metadata sources:', err);
      }
    };
    fetchMetadata();
  }, [initialData]);

  // Filtered Options
  const filteredItems = useMemo(() => {
    const q = itemInput.toLowerCase().trim();
    return activeItems.filter(i => i.name.toLowerCase().includes(q)).slice(0, 50);
  }, [activeItems, itemInput]);

  const filteredModes = useMemo(() => {
    const q = modeInput.toLowerCase().trim();
    return activeModes.filter(m => m.name.toLowerCase().includes(q)).slice(0, 50);
  }, [activeModes, modeInput]);

  const filteredUoms = useMemo(() => {
    const q = uomInput.toLowerCase().trim();
    return activeUoms.filter(u => u.name.toLowerCase().includes(q)).slice(0, 50);
  }, [activeUoms, uomInput]);

  const filteredCategories = useMemo(() => {
    const q = categoryInput.toLowerCase().trim();
    return activeCategories.filter(c => c.name.toLowerCase().includes(q)).slice(0, 50);
  }, [activeCategories, categoryInput]);

  const filteredBrands = useMemo(() => {
    const q = brandInput.toLowerCase().trim();
    return activeBrands.filter(b => b.name.toLowerCase().includes(q)).slice(0, 50);
  }, [activeBrands, brandInput]);

  const handleSubmit = async () => {
    setIsBusy(true);
    try {
      const payload = {
        ...(isEditing ? { id: initialData?.id } : {}),
        itemId,
        modeId,
        uomId,
        categoryId,
        brandId,
        rules,
        isDirty: true,
      };

      let response;
      if (isEditing) {
        if (!window.electronAPI.generationRuleUpdate) {
          throw new Error('generationRuleUpdate API endpoint is not defined');
        }
        response = await window.electronAPI.generationRuleUpdate(payload);
      } else {
        if (!window.electronAPI.generationRuleCreate) {
          throw new Error('generationRuleCreate API endpoint is not defined');
        }
        response = await window.electronAPI.generationRuleCreate(payload);
      }

      if (response && !response.success) {
        throw new Error(response.message || `Failed to ${isEditing ? 'update' : 'create'} ruleset`);
      }

      onSuccess(`Successfully ${isEditing ? 'updated' : 'created'} ruleset!`);
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'An error occurred during submission.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate 
      title={isEditing ? "Edit Ruleset" : "Create Ruleset"} 
      handleClose={onClose} 
      className="modal-card-wide"
    >
      <div 
        ref={containerRef}
        className="workspaceGrid" 
        style={{ 
          display: 'flex', 
          height: '72vh', 
          maxHeight: '72vh', 
          overflow: 'hidden',
          gap: '16px'
        }}
      >
        {/* ================= LEFT PANEL (Rules Textbox) ================= */}
        <div 
          className="leftPanel" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1.5, 
            overflowY: 'auto', 
            maxHeight: '100%',
            paddingRight: '8px',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
            <label className="formLabel" style={{ fontWeight: 'bold' }}>Rules Configuration</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Enter rules definition here..."
              className="textInput"
              style={{
                flex: 1,
                resize: 'none',
                padding: '10px',
                fontFamily: 'monospace',
                minHeight: '200px'
              }}
            />
          </div>

          <div className="vendorMenuSection" style={{ borderTop: '1px solid var(--border-color, #e0e0e0)', paddingTop: '12px' }}>
            <h4 className="sectionTitle" style={{ marginBottom: '8px' }}>Vendor Menu</h4>
            <div style={{ padding: '12px', background: 'var(--bg-secondary, #f9f9f9)', borderRadius: '6px', textAlign: 'center', color: '#888' }}>
              Vendor management configurations will be integrated here.
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL (Entity Autocomplete Selectors) ================= */}
        <div 
          className="rightPanel" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1, 
            overflowY: 'auto', 
            maxHeight: '100%',
            paddingBottom: '8px',
            gap: '12px'
          }}
        >
          <h4 className="sectionTitle">Ruleset Parameters</h4>

          {/* Item Selector */}
          <div className="formGroup" style={{ position: 'relative' }}>
            <label className="formLabel">Item</label>
            <input
              type="text"
              value={itemInput}
              onChange={(e) => {
                setItemInput(e.target.value);
                setItemId('');
                setActiveDropdown('item');
              }}
              onFocus={() => setActiveDropdown('item')}
              placeholder="Type to search item..."
              className="textInput"
            />
            {activeDropdown === 'item' && filteredItems.length > 0 && (
              styleDropdownList(filteredItems, (item) => {
                setItemId(item.id);
                setItemInput(item.name);
                setActiveDropdown(null);
              })
            )}
          </div>

          {/* Mode Selector */}
          <div className="formGroup" style={{ position: 'relative' }}>
            <label className="formLabel">Mode</label>
            <input
              type="text"
              value={modeInput}
              onChange={(e) => {
                setModeInput(e.target.value);
                setModeId('');
                setActiveDropdown('mode');
              }}
              onFocus={() => setActiveDropdown('mode')}
              placeholder="Type to search mode..."
              className="textInput"
            />
            {activeDropdown === 'mode' && filteredModes.length > 0 && (
              styleDropdownList(filteredModes, (mode) => {
                setModeId(mode.id);
                setModeInput(mode.name);
                setActiveDropdown(null);
              })
            )}
          </div>

          {/* UoM Selector */}
          <div className="formGroup" style={{ position: 'relative' }}>
            <label className="formLabel">UoM</label>
            <input
              type="text"
              value={uomInput}
              onChange={(e) => {
                setUomInput(e.target.value);
                setUomId('');
                setActiveDropdown('uom');
              }}
              onFocus={() => setActiveDropdown('uom')}
              placeholder="Type to search unit of measure..."
              className="textInput"
            />
            {activeDropdown === 'uom' && filteredUoms.length > 0 && (
              styleDropdownList(filteredUoms, (uom) => {
                setUomId(uom.id);
                setUomInput(uom.name);
                setActiveDropdown(null);
              })
            )}
          </div>

          {/* Category Selector */}
          <div className="formGroup" style={{ position: 'relative' }}>
            <label className="formLabel">Category</label>
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setCategoryId('');
                setActiveDropdown('category');
              }}
              onFocus={() => setActiveDropdown('category')}
              placeholder="Type to search category..."
              className="textInput"
            />
            {activeDropdown === 'category' && filteredCategories.length > 0 && (
              styleDropdownList(filteredCategories, (cat) => {
                setCategoryId(cat.id);
                setCategoryInput(cat.name);
                setActiveDropdown(null);
              })
            )}
          </div>

          {/* Brand Selector */}
          <div className="formGroup" style={{ position: 'relative' }}>
            <label className="formLabel">Brand</label>
            <input
              type="text"
              value={brandInput}
              onChange={(e) => {
                setBrandInput(e.target.value);
                setBrandId('');
                setActiveDropdown('brand');
              }}
              onFocus={() => setActiveDropdown('brand')}
              placeholder="Type to search brand..."
              className="textInput"
            />
            {activeDropdown === 'brand' && filteredBrands.length > 0 && (
              styleDropdownList(filteredBrands, (brand) => {
                setBrandId(brand.id);
                setBrandInput(brand.name);
                setActiveDropdown(null);
              })
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="workspaceFooter" style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '12px' }}>
            <button type="button" className="secondaryButton" onClick={onClose} disabled={isBusy} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="button"
              className="primaryButton"
              onClick={handleSubmit}
              disabled={isBusy}
              style={{ flex: 1 }}
            >
              {isBusy ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Ruleset')}
            </button>
          </div>
        </div>
      </div>
    </ModalTemplate>
  );
}

function styleDropdownList(
  items: AutocompleteOption[],
  onSelect: (item: AutocompleteOption) => void
) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        maxHeight: '150px',
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        zIndex: 10,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginTop: '2px',
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: '1px solid #f0f0f0',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}