import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(401).json({ error: 'Unauthenticated' });

    let settings = await prisma.setting.findFirst({
      where: { householdId, softDelete: false }
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          householdId,
          country: 'US',
          currency: 'USD',
          theme: 'dark'
        }
      });
    }

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(401).json({ error: 'Unauthenticated' });

    const {
      country,
      currency,
      timeZone,
      dateFormat,
      unitSystem,
      theme,
      language,
      pushNotifications,
      emailAlerts
    } = req.body;

    let settings = await prisma.setting.findFirst({
      where: { householdId, softDelete: false }
    });

    if (settings) {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          country: country ?? settings.country,
          currency: currency ?? settings.currency,
          timeZone: timeZone ?? settings.timeZone,
          dateFormat: dateFormat ?? settings.dateFormat,
          unitSystem: unitSystem ?? settings.unitSystem,
          theme: theme ?? settings.theme,
          language: language ?? settings.language,
          pushNotifications: pushNotifications ?? settings.pushNotifications,
          emailAlerts: emailAlerts ?? settings.emailAlerts
        }
      });
    } else {
      settings = await prisma.setting.create({
        data: {
          householdId,
          country: country || 'US',
          currency: currency || 'USD',
          timeZone: timeZone || 'America/New_York',
          dateFormat: dateFormat || 'MM/DD/YYYY',
          unitSystem: unitSystem || 'Imperial',
          theme: theme || 'dark',
          language: language || 'English',
          pushNotifications: pushNotifications ?? true,
          emailAlerts: emailAlerts ?? true
        }
      });
    }

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
