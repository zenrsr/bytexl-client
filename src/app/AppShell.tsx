import { useMemo, useState } from 'react';

import { tabs, type InfoHubTab } from './tabs';

type AppShellProps = {
  children: (activeTab: InfoHubTab) => React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<InfoHubTab>('weather');

  const tabMeta = useMemo(() => tabs.find((tab) => tab.id === activeTab), [activeTab]);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="app-shell__kicker">InfoHub</p>
          <h1 className="app-shell__title">Everyday essentials in one dashboard</h1>
        </div>
        <p className="app-shell__subtitle">
          Switch between weather, currency conversion, and motivational quotes without
          leaving the page. All data loads dynamically via the InfoHub API.
        </p>
      </header>

      <nav className="app-shell__tabs" aria-label="InfoHub modules">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={isActive ? 'tab tab--active' : 'tab'}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
            >
              <span className="tab__label">{tab.label}</span>
              <span className="tab__description">{tab.description}</span>
            </button>
          );
        })}
      </nav>

      <section className="app-shell__content" aria-live="polite">
        <header className="app-shell__content-header">
          <h2>{tabMeta?.label}</h2>
          <p>{tabMeta?.description}</p>
        </header>

        <div className="app-shell__panel">{children(activeTab)}</div>
      </section>
    </div>
  );
}
