export type InfoHubTab = 'weather' | 'currency' | 'quotes';

export type TabDefinition = {
  id: InfoHubTab;
  label: string;
  description: string;
};

export const tabs: TabDefinition[] = [
  {
    id: 'weather',
    label: 'Weather',
    description: 'Real-time weather snapshot for the configured city.',
  },
  {
    id: 'currency',
    label: 'Currency',
    description: 'Convert INR to USD and EUR using live exchange rates.',
  },
  {
    id: 'quotes',
    label: 'Motivation',
    description: 'Get a motivational quote to keep momentum going.',
  },
];
