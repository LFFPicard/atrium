import { getAllModules, MODULE_DEFINITIONS } from '@/lib/modules';
import ModulesClient from './ModulesClient';

export default function AdminModulesPage() {
  const records = getAllModules();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-(--color-text)">Modules</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">
          Enable integrations with your homelab services. Disabled modules are completely hidden from users.
        </p>
      </div>
      <ModulesClient definitions={MODULE_DEFINITIONS} records={records} />
    </div>
  );
}
