export function buildSettingsSections(t) {
  return [
    {
      id: 'profile',
      label: t('settings.profile'),
      icon: 'pi pi-user',
      description: t('settings.profileDescription'),
    },
    {
      id: 'security',
      label: t('settings.security'),
      icon: 'pi pi-shield',
      description: t('settings.securityDescription'),
    },
    {
      id: 'devices',
      label: t('settings.devices'),
      icon: 'pi pi-desktop',
      description: t('settings.devicesDescription'),
    },
    {
      id: 'theme',
      label: t('settings.theme'),
      icon: 'pi pi-palette',
      description: t('settings.themeDescription'),
    },
    {
      id: 'font',
      label: t('settings.font'),
      icon: 'pi pi-pen-to-square',
      description: t('settings.fontDescription'),
    },
    {
      id: 'language',
      label: t('settings.language'),
      icon: 'pi pi-language',
      description: t('settings.languageDescription'),
    },
    {
      id: 'storage',
      label: t('settings.storage'),
      icon: 'pi pi-database',
      description: t('settings.storageDescription'),
    },
    {
      id: 'feedback',
      label: t('settings.feedback'),
      icon: 'pi pi-comment',
      description: t('settings.feedbackDescription'),
    },
  ];
}
