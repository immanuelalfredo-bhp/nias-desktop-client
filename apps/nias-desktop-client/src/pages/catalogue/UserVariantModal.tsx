import { useState, useEffect } from 'react';
import { item, attribute, variant, order } from '@nias/shared';
import ModalTemplate from '../../components/templates/Modal';
import { notifyApp } from '../../lib/notifications';

interface AliasItem {
  alias: string;
  sortOrder: number;
}

interface ItemWorkspaceModalProps {
  isOpen: boolean;
  initialData?: Partial<item.CreateItemRecordInput> & { id?: string };
  onClose: () => void;
  onSuccess: (message: string) => void;
  onEdit?: (item: any) => void;
}

export default function ItemWorkspaceModal({
  isOpen,
  initialData,
  onClose,
  onSuccess,
  onEdit,
}: ItemWorkspaceModalProps) {
  if (!isOpen) return null;

  const isEditMode = Boolean(initialData?.id);
  const itemId = initialData?.id;

  // --- Left Panel States (Identity & Metadata) ---
  const [skuCode, setSkuCode] = useState(initialData?.skuCode || '');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [baseName, setBaseName] = useState(initialData?.baseName || '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'documents' | 'systems' | 'tags' | 'aliases' | 'system_data'
  >('system_data');

  // --- Aliases Tab States ---
  const [aliases, setAliases] = useState<AliasItem[]>([]);

  // --- System Data States ---
  const [skuSource] = useState<'internal' | 'external'>(initialData?.skuSource || 'internal');
  const [materialType, setMaterialType] = useState<'component' | 'assembly'>(
    initialData?.materialType || 'component',
  );
  const [materialClass, setMaterialClass] = useState<'main' | 'installation' | 'support'>(
    initialData?.materialClass || 'main',
  );
  const [delimiterType, setDelimiterType] = useState<'pipe' | 'cross'>(
    initialData?.delimiterType || 'cross',
  );
  const [hasAutoAssemblyTrigger] = useState<boolean>(initialData?.hasAutoAssemblyTrigger || false);

  // --- Right Panel & Faceted Selector States ---
  const [isBusy, setIsBusy] = useState(false);
  const [itemBrands, setItemBrands] = useState<attribute.Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // --- UOM Selector States ---
  const [activeApiUoms, setActiveApiUoms] = useState<attribute.Uom[]>([]);
  const [selectedUomId, setSelectedUomId] = useState<string | null>(null);

  // Dimension Selection State
  const [selectedDimensionValues, setSelectedDimensionValues] = useState<Record<string, string>>(
    {},
  ); // dimensionId -> valueId

  // Direct Item Dimension & Value States
  const [availableDimensions, setAvailableDimensions] = useState<attribute.Dimension[]>([]);
  const [dimensionValuesMap, setDimensionValuesMap] = useState<
    Record<string, attribute.DimensionValue[]>
  >({});

  // Comments State
  const [commentsValue, setCommentsValue] = useState<string>('');
  const [quantityValue, setQuantityValue] = useState<string>('');

  // --- System & Tag Selector States ---
  const [activeApiSystems, setActiveApiSystems] = useState<attribute.System[]>([]);
  const [selectedCreateSystemIds, setSelectedCreateSystemIds] = useState<string[]>([]);
  const [activeApiTags, setActiveApiTags] = useState<attribute.Tag[]>([]);
  const [selectedCreateTagIds, setSelectedCreateTagIds] = useState<string[]>([]);

  // Initial Fetch (Metadata, Systems, Tags, Brands, UOMs)
  useEffect(() => {
    const fetchActiveMetadata = async () => {
      try {
        const [sysRes, tagRes, brandListRes, uomRes] = await Promise.all([
          window.electronAPI.systemListActive(),
          window.electronAPI.tagListActive(),
          window.electronAPI.brandListActive(),
          window.electronAPI.uomListActive(),
        ]);

        if (sysRes && sysRes.success && Array.isArray(sysRes.data)) {
          setActiveApiSystems(sysRes.data);
        }
        if (tagRes && tagRes.success && Array.isArray(tagRes.data)) {
          setActiveApiTags(tagRes.data);
        }
        if (brandListRes && brandListRes.success && Array.isArray(brandListRes.data)) {
          setItemBrands(brandListRes.data);
          if (brandListRes.data.length > 0 && brandListRes.data[0]) {
            setSelectedBrandId(brandListRes.data[0].id);
          }
        }
        if (uomRes && uomRes.success && Array.isArray(uomRes.data)) {
          setActiveApiUoms(uomRes.data);
          if (uomRes.data.length > 0 && uomRes.data[0]) {
            setSelectedUomId(uomRes.data[0].id);
          }
        }

        if (isEditMode && itemId) {
          const [sysMapRes, tagMapRes, aliasMapRes] = await Promise.all([
            window.electronAPI.systemGetByItemId(itemId),
            window.electronAPI.tagGetByItemId(itemId),
            window.electronAPI.aliasGetByItemId(itemId),
          ]);

          if (sysMapRes?.success && Array.isArray(sysMapRes.data)) {
            setSelectedCreateSystemIds(sysMapRes.data.map((s: any) => s.id));
          }
          if (tagMapRes?.success && Array.isArray(tagMapRes.data)) {
            setSelectedCreateTagIds(tagMapRes.data.map((t: any) => t.id));
          }
          if (aliasMapRes?.success && Array.isArray(aliasMapRes.data)) {
            setAliases(
              aliasMapRes.data.map((a: any) => ({ alias: a.alias, sortOrder: a.sortOrder ?? 0 })),
            );
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial metadata:', err);
      }
    };
    fetchActiveMetadata();
  }, [isEditMode, itemId]);

  // --- Step 1: Fetch Dimensions by Item ID ---
  useEffect(() => {
    const fetchItemDimensions = async () => {
      if (!itemId) return;

      try {
        const response = await window.electronAPI.dimensionGetByItemId(itemId);

        if (response && response.success && Array.isArray(response.data)) {
          setAvailableDimensions(response.data);
        } else {
          setAvailableDimensions([]);
        }
      } catch (error) {
        console.error('Failed to fetch dimensions by item ID:', error);
        setAvailableDimensions([]);
      }
    };

    fetchItemDimensions();
  }, [itemId]);

  // --- Step 2: Fetch Dimension Values for each Dimension ID ---
  useEffect(() => {
    const fetchDimensionValues = async () => {
      if (availableDimensions.length === 0) {
        setDimensionValuesMap({});
        return;
      }

      try {
        const valuePromises = availableDimensions.map(async (dim) => {
          const res = await window.electronAPI.dimensionValueGetActiveByDimensionId(dim.id);
          return {
            dimensionId: dim.id,
            values: res && res.success && Array.isArray(res.data) ? res.data : [],
          };
        });

        const results = await Promise.all(valuePromises);
        const newMap: Record<string, attribute.DimensionValue[]> = {};
        results.forEach((item) => {
          newMap[item.dimensionId] = item.values;
        });

        setDimensionValuesMap(newMap);
      } catch (error) {
        console.error('Failed to fetch dimension values by dimension ID:', error);
      }
    };

    fetchDimensionValues();
  }, [availableDimensions]);

  const handleResetDimension = (dimensionId: string) => {
    setSelectedDimensionValues((prev) => {
      const updated = { ...prev };
      delete updated[dimensionId];
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsBusy(true);
    try {
      const dimensionIds = Object.values(selectedDimensionValues).filter(Boolean).sort();
      
      const modeResponse = await window.electronAPI.modeGetByNorm('default');
      const categoryResponse = await window.electronAPI.categoryGetByNorm('default');

      if (!modeResponse.success || !categoryResponse.success) {
        throw new Error('Failed to fetch default mode or category.');
      }
      
      console.log('Item ID:', itemId);
      console.log('Mode Response:', modeResponse.data?.id);
      console.log('Category Response:', categoryResponse.data?.id);
      console.log('Selected UOM ID:', selectedUomId);
      console.log('Selected Brand ID:', selectedBrandId);
      console.log('Selected Dimension IDs:', dimensionIds);

      const namespace = 'variant';
      const name = [
        itemId,
        categoryResponse?.data?.id,
        modeResponse?.data?.id,
        selectedUomId,
        selectedBrandId,
        ...dimensionIds,
      ].join('-');

      console.log('Generating UUID with name:', name, 'and namespace:', namespace);

      const uuid = await window.electronAPI.variantGeneratorUuid(name, namespace);
      if (!uuid || !uuid.success || !uuid.data) {
        throw new Error('Failed to generate UUID for the variant.');
      }

      console.log('Generated UUID:', uuid.data);

      const variantPayload: variant.VariantRecord[] = [{
        id: uuid.data,
        itemId: itemId!,
        categoryId: categoryResponse.data.id,
        brandId: selectedBrandId!,
        modeId: modeResponse.data.id,
        uomId: selectedUomId!,
        dimensionIds: dimensionIds.flatMap((id) => [id]).join(','),
        skuCode: skuCode,
        description: baseName,
        details: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        isSynced: false,
        syncVersion: 0,
      }];

      const response = await window.electronAPI.variantUpsert(variantPayload);
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to create variant.');
      }

      let mappingPayload = []

      for (const id of dimensionIds) {
        if (id) {
          const mappingRecord = {
            id: crypto.randomUUID(),
            variantId: uuid.data,
            dimensionValueId: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            isSynced: false,
            syncVersion: 0,
          };
          mappingPayload.push(mappingRecord);
        }
      }

      const mappingResponse = await window.electronAPI.dimensionValueMapUpsert(mappingPayload);
      if (!mappingResponse || !mappingResponse.success) {
        throw new Error(mappingResponse?.message || 'Failed to create dimension value mapping.');
      }

      const requestPayload: order.CreateRequestItem = {
        id: crypto.randomUUID(),
        variantId: uuid.data,
        quantity: parseFloat(quantityValue) || 1,
        comments: commentsValue.trim() === '' ? null : commentsValue,
      };

      const requestResponse = await window.electronAPI.requestItemCreate(requestPayload);
      if (!requestResponse || !requestResponse.success) {
        throw new Error(requestResponse?.message || 'Failed to create request item.');
      }

      window.dispatchEvent(new CustomEvent('orders:refresh'));
      onSuccess('Successfully added variant!');
      onClose();
    } catch (error: any) {
      console.error(error);
      notifyApp(error.message || 'An error occurred during submission.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleEditClick = () => {
    onClose();
    if (onEdit) {
      onEdit(initialData);
    }
  };

  return (
    <ModalTemplate title="Variant Selector" handleClose={onClose} className="modal-card-wide">
      <div className="workspaceGrid">
        {/* ================= LEFT PANEL (Identity & Meta) ================= */}
        <div className="leftPanel">
          <div className="formGroup">
            <label htmlFor="skuCodeInput" className="formLabel">
              SKU
            </label>
            <div
              className="skuLabelRow"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
                gap: '8px',
              }}
            >
              <input
                id="skuCodeInput"
                type="text"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="Enter item SKU"
                className="textInput"
              />
              <button
                type="button"
                onClick={handleEditClick}
                title="Edit User Item"
                className="secondaryButton"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✎
              </button>
            </div>
          </div>

          <div className="formGroup">
            <span className="formLabel">Display Name</span>
            <div className="textStaticDisplay">{displayName || 'N/A'}</div>
          </div>

          {/* <div className="imageSectionWrapper">
            <div onClick={() => setIsImageCollapsed(!isImageCollapsed)} className="imageHeader">
              <span>Item Image</span>
              <span>{isImageCollapsed ? '▼' : '▲'}</span>
            </div>
            {!isImageCollapsed && (
              <div className="itemImageContainer">
                {imageUrl ? (
                  <img src={imageUrl} alt={displayName} className="itemImage" />
                ) : (
                  <span className="noImageText">No Image</span>
                )}
              </div>
            )}
          </div> */}

          <div className="formGroup">
            <label htmlFor="baseNameInput" className="formLabel">
              Base Name
            </label>
            <input
              id="baseNameInput"
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="Enter item base name"
              className="textInput"
            />
          </div>

          <div className="metaTabsContainer">
            <div className="tabButtons">
              {(['systems', 'tags', 'aliases', 'system_data'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`tabButton ${activeTab === tab ? 'tabButtonActive' : 'tabButtonInactive'}`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="tabContent">
              {activeTab === 'systems' && (
                <div className="createSystemsSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">
                      Systems ({selectedCreateSystemIds.length})
                    </span>
                    <div className="tagsBox">
                      {selectedCreateSystemIds.length === 0 ? (
                        <span className="emptyTagsText">No systems.</span>
                      ) : (
                        selectedCreateSystemIds.map((id) => {
                          const found: any = activeApiSystems.find((s: any) => s.id === id);
                          return (
                            <span key={id} className="tagBadge">
                              {found ? found.formName || found.name : id}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'tags' && (
                <div className="createTagsSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">
                      Tags ({selectedCreateTagIds.length})
                    </span>
                    <div className="tagsBox">
                      {selectedCreateTagIds.length === 0 ? (
                        <span className="emptyTagsText">No tags.</span>
                      ) : (
                        selectedCreateTagIds.map((id) => {
                          const found: any = activeApiTags.find((t: any) => t.id === id);
                          return (
                            <span key={id} className="tagBadge">
                              {found ? found.formName || found.name : id}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'aliases' && (
                <div className="createAliasesSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">Aliases ({aliases.length})</span>
                    <div className="tagsBox">
                      {aliases.length === 0 ? (
                        <span className="emptyTagsText">No aliases.</span>
                      ) : (
                        aliases.map((item, index) => (
                          <span key={index} className="tagBadge">
                            {item.alias}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'system_data' && (
                <div className="systemDataContainer">
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">SKU Source</span>
                    <div className="textStaticDisplay systemDataDisplay">{skuSource}</div>
                  </div>
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">Material Type</span>
                    <div className="textStaticDisplay systemDataDisplay">{materialType}</div>
                  </div>
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">Material Class</span>
                    <div className="textStaticDisplay systemDataDisplay">{materialClass}</div>
                  </div>
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">Delimiter Type</span>
                    <div className="textStaticDisplay systemDataDisplay">{delimiterType}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL (Faceted Specifications) ================= */}
        <div className="rightPanel">
          <div className="configuratorContent">
            <h4 className="sectionTitle">Variant Specifications</h4>

            <div className="selectedTagsContainer specCard">
              {/* Split Row for Mode and UOM */}
              <div className="specsSplitRow">
                {/* Mode Section */}
                <div className="selectedTagsContainer specCard">
                  <span className="selectedTagsLabel specCardHeader">Mode</span>
                  <div className="tagsBox specTagsBox">
                    <button
                      key="default"
                      type="button"
                      className="tagBadge specBadge specBadgeSelected"
                    >
                      Default
                    </button>
                  </div>
                </div>

                {/* UOM Section */}
                <div className="selectedTagsContainer specCard">
                  <span className="selectedTagsLabel specCardHeader">UOM</span>
                  <div className="tagsBox specTagsBox">
                    {activeApiUoms.map((uom) => {
                      const isSelected = selectedUomId === uom.id;
                      return (
                        <button
                          key={uom.id}
                          type="button"
                          onClick={() => setSelectedUomId(uom.id)}
                          className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                        >
                          {(uom as any).formName || (uom as any).name || uom.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Brand Section */}
              <div className="selectedTagsContainer specCard">
                <span className="selectedTagsLabel specCardHeader">Brand</span>
                <div className="tagsBox specTagsBox">
                  {itemBrands.map((brand) => {
                    const isSelected = selectedBrandId === brand.id;
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => setSelectedBrandId(brand.id)}
                        className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                      >
                        {(brand as any).formName || (brand as any).name || brand.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Faceted Dimension Sections */}
              {availableDimensions
                .slice()
                .sort((a: any, b: any) => {
                  const getPositionWeight = (pos?: string) => {
                    switch (pos) {
                      case 'prefix':
                        return 1;
                      case 'suffix':
                        return 2;
                      case 'dimensions':
                        return 3;
                      case 'end':
                        return 4;
                      default:
                        return 5;
                    }
                  };

                  const posA = getPositionWeight(a.dimensionPosition || a.position);
                  const posB = getPositionWeight(b.dimensionPosition || b.position);

                  if (posA !== posB) {
                    return posA - posB;
                  }

                  const scopeA = (a.dimensionScope || a.scope || '').toString();
                  const scopeB = (b.dimensionScope || b.scope || '').toString();
                  if (scopeA !== scopeB) {
                    return scopeA.localeCompare(scopeB);
                  }

                  const orderA = a.dimensionSortOrder ?? a.sortOrder ?? 0;
                  const orderB = b.dimensionSortOrder ?? b.sortOrder ?? 0;
                  return orderB - orderA;
                })
                .filter((dim) => {
                  const values = dimensionValuesMap[dim.id] || [];
                  return values.length > 0;
                })
                .map((dim) => {
                  const values = dimensionValuesMap[dim.id] || [];
                  const selectedValId = selectedDimensionValues[dim.id];
                  const dimensionDisplayName = (dim as any).name || 'Dimension';

                  return (
                    <div key={dim.id} className="selectedTagsContainer specCard">
                      <div className="specHeaderWrapper">
                        <span className="selectedTagsLabel specCardHeader">
                          {dimensionDisplayName}
                        </span>
                        <div className="specResetWrapper">
                          {selectedValId && (
                            <button
                              type="button"
                              onClick={() => handleResetDimension(dim.id)}
                              className="specResetButton"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="tagsBox specTagsBox">
                        {values.map((val) => {
                          const isSelected = selectedValId === val.id;
                          return (
                            <button
                              key={val.id}
                              type="button"
                              onClick={() =>
                                setSelectedDimensionValues((prev) => ({
                                  ...prev,
                                  [dim.id]: val.id,
                                }))
                              }
                              className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                            >
                              {(val as any).formName || (val as any).name || val.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Comments Section */}
              <div className="selectedTagsContainer specCard">
                <span className="selectedTagsLabel specCardHeader">Comments</span>
                <div className="tagsBox specTagsBox">
                  <textarea
                    value={commentsValue}
                    onChange={(e) => setCommentsValue(e.target.value)}
                    placeholder="Enter comments"
                    className="commentsTextarea"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Quantity Section */}
            <div className="selectedTagsContainer quantityContainer">
              <span className="selectedTagsLabel quantityLabel">Quantity</span>
              <input
                type="text"
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                placeholder="Enter quantity"
                className="quantityInput"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="workspaceFooter">
            <button type="button" className="secondaryButton" onClick={onClose} disabled={isBusy}>
              Cancel
            </button>
            <button
              type="button"
              className="primaryButton"
              onClick={handleSubmit}
              disabled={isBusy || !itemId || !selectedBrandId}
            >
              {isBusy ? 'Adding...' : 'Add Variant'}
            </button>
          </div>
        </div>
      </div>
    </ModalTemplate>
  );
}
