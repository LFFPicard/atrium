import { getAllTabs } from '@/lib/tabs';
import TabsClient from './TabsClient';

export default function AdminTabsPage() {
  const tabs = getAllTabs();
  return <TabsClient initialTabs={tabs} />;
}
