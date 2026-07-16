import type { AttributeEntityKey } from './attributeFactory';

interface TabItem {
  key: AttributeEntityKey;
  label: string;
}

interface AttributeTabsProps {
  tabs: TabItem[];
  activeTab: AttributeEntityKey;
  onChange: (tab: AttributeEntityKey) => void;
}

export default function AttributeTabs({ tabs, activeTab, onChange }: AttributeTabsProps) {
  return (
    <div className="attribute-tabs" role="tablist" aria-label="Attribute entities">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          className={activeTab === tab.key ? 'attribute-tab active' : 'attribute-tab'}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
