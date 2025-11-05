import { ApiProvider } from './app/ApiProvider';
import { AppShell } from './app/AppShell';
import { type InfoHubTab } from './app/tabs';
import { CurrencyModule, QuotesModule, WeatherModule } from './features';

function renderTab(tab: InfoHubTab) {
  switch (tab) {
    case 'weather':
      return <WeatherModule />;
    case 'currency':
      return <CurrencyModule />;
    case 'quotes':
      return <QuotesModule />;
    default:
      return null;
  }
}

function App() {
  return (
    <ApiProvider>
      <AppShell>{(activeTab) => renderTab(activeTab)}</AppShell>
    </ApiProvider>
  );
}

export default App;
