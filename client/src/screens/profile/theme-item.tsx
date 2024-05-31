import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';

import type { ColorSchemeTheme } from '@/core';
import { setTheme, translate, useTheme } from '@/core';
import type { Option } from '@/ui';
import { Options } from '@/ui';

import { BottomSheetItem } from '../../ui/core/bottom-sheet/bottom-sheet-item';

export const ThemeItem = () => {
  const selectedTheme = useTheme.use.colorSchemeTheme();
  const currentSystemTheme = useTheme.use.systemColorScheme();

  const optionsRef = React.useRef<BottomSheetModal>(null);
  const open = React.useCallback(() => optionsRef.current?.present(), []);
  const onSelect = React.useCallback((option: Option) => {
    setTheme(option.value as ColorSchemeTheme);
    optionsRef.current?.dismiss();
  }, []);

  const themes = React.useMemo(
    () => [
      { label: `${translate('settings.theme.dark')} 🌙`, value: 'dark' },
      { label: `${translate('settings.theme.light')} 🌞`, value: 'light' },
      {
        label: `${translate('settings.theme.system')} (${
          currentSystemTheme === 'dark'
            ? translate('settings.theme.dark')
            : translate('settings.theme.light')
        }) ⚙️`,
        value: 'system',
      },
    ],
    [currentSystemTheme]
  );

  const theme = React.useMemo(
    () => themes.find((t) => t.value === selectedTheme),
    [selectedTheme, themes]
  );

  return (
    <>
      <BottomSheetItem
        text="settings.theme.title"
        value={theme?.label}
        onPress={open}
      />
      <Options
        ref={optionsRef}
        options={themes}
        onSelect={onSelect}
        value={theme?.value}
      />
    </>
  );
};
