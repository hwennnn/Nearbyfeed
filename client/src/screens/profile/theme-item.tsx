import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';

import type { ColorSchemeTheme } from '@/core';
import { setTheme, useTheme } from '@/core';
import type { Option } from '@/ui';
import { Options } from '@/ui';

import { BottomSheetItem } from '../../ui/core/bottom-sheet/bottom-sheet-item';

export const ThemeItem = () => {
  const selectedTheme = useTheme.use.colorSchemeTheme();

  const optionsRef = React.useRef<BottomSheetModal>(null);
  const open = React.useCallback(() => optionsRef.current?.present(), []);
  const onSelect = React.useCallback((option: Option) => {
    setTheme(option.value as ColorSchemeTheme);
    optionsRef.current?.dismiss();
  }, []);

  const themes = React.useMemo(
    () => [
      { label: `Dark 🌙`, value: 'dark' },
      { label: `Light 🌞`, value: 'light' },
      {
        label: `System ⚙️`,
        value: 'system',
      },
    ],
    []
  );

  const theme = React.useMemo(
    () => themes.find((t) => t.value === selectedTheme),
    [selectedTheme, themes]
  );

  return (
    <>
      <BottomSheetItem text="Theme" value={theme?.label} onPress={open} />
      <Options
        ref={optionsRef}
        options={themes}
        onSelect={onSelect}
        value={theme?.value}
      />
    </>
  );
};
