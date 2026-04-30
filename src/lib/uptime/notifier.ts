import { db } from '@/lib/db';
import { uptimeChecks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isModuleEnabled } from '@/lib/modules';
import { getSetting } from '@/lib/settings';
import type { CheckRow, UptimeStatus } from './checker';

export async function notifyStatusChange(
  check: CheckRow,
  oldStatus: UptimeStatus,
  newStatus: UptimeStatus,
): Promise<void> {
  const isDown = newStatus === 'down' && oldStatus !== 'down';
  const isRecovery = newStatus === 'up' && (oldStatus === 'down' || oldStatus === 'degraded');
  if (!isDown && !isRecovery) return;

  const now = Math.floor(Date.now() / 1000);
  // Prevent spam — one notification per hour per check
  if (check.lastNotifiedAt && now - check.lastNotifiedAt < 3600) return;

  const subject = isDown
    ? `[Atrium] ${check.serviceName} is down`
    : `[Atrium] ${check.serviceName} has recovered`;
  const body = isDown
    ? `${check.serviceName} failed 3 consecutive uptime checks and is now marked as DOWN.`
    : `${check.serviceName} is back online and responding normally.`;

  if (check.notifyEmail && isModuleEnabled('smtp')) {
    try {
      const nodemailer = await import('nodemailer');
      const smtpHost = getSetting<string>('smtp_host');
      const smtpPort = getSetting<string>('smtp_port');
      const smtpUser = getSetting<string>('smtp_user');
      const smtpPass = getSetting<string>('smtp_pass');
      const smtpFrom = getSetting<string>('smtp_from');
      if (smtpHost && smtpPort && smtpUser && smtpPass && smtpFrom) {
        const transport = nodemailer.default.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          auth: { user: smtpUser, pass: smtpPass },
        });
        await transport.sendMail({ from: smtpFrom, to: smtpFrom, subject, text: body });
      }
    } catch {
      // email failure must not crash the poller
    }
  }

  if (check.notifyWebhook) {
    const webhookUrl = getSetting<string>('uptime_webhook_url');
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{ title: subject, description: body, color: isDown ? 15158332 : 3066993 }],
          }),
        });
      } catch {
        // webhook failure must not crash the poller
      }
    }
  }

  db.update(uptimeChecks).set({ lastNotifiedAt: now }).where(eq(uptimeChecks.id, check.id)).run();
}
