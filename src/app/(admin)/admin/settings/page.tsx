import { getSettings } from '@/lib/settings';
import { ThemeVars } from '@/lib/themes';
import SettingsClient from './SettingsClient';

export default function AdminSettingsPage() {
  const raw = getSettings([
    'theme_preset',
    'theme_overrides',
    'login_site_name',
    'login_bg_image',
    'login_card_opacity',
    'donation_enabled',
    'donation_provider',
    'donation_url',
    'donation_label',
    'donation_placement',
    'site_name',
    'admin_email',
  ]);

  const initial = {
    theme_preset: (raw.theme_preset as string) ?? 'atrium-dark',
    theme_overrides: (raw.theme_overrides as Partial<ThemeVars>) ?? {},
    login_site_name: (raw.login_site_name as string) ?? '',
    login_bg_image: (raw.login_bg_image as string) ?? '',
    login_card_opacity: (raw.login_card_opacity as number) ?? 80,
    donation_enabled: (raw.donation_enabled as boolean) ?? false,
    donation_provider: (raw.donation_provider as string) ?? '',
    donation_url: (raw.donation_url as string) ?? '',
    donation_label: (raw.donation_label as string) ?? '',
    donation_placement: (raw.donation_placement as string) ?? 'sidebar',
    site_name: (raw.site_name as string) ?? 'Atrium',
    admin_email: (raw.admin_email as string) ?? '',
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-(--color-text) mb-6">Settings</h1>
      <SettingsClient initial={initial} />
    </div>
  );
}
