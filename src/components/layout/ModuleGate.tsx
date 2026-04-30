import { isModuleEnabled } from '@/lib/modules';

interface ModuleGateProps {
  slug: string;
  children: React.ReactNode;
}

export default function ModuleGate({ slug, children }: ModuleGateProps) {
  if (!isModuleEnabled(slug)) return null;
  return <>{children}</>;
}
