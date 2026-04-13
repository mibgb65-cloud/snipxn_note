import type { ViewStyle } from 'react-native';

import { type AppPalette, withAlpha } from '../theme';

export const MOBILE_TAB_BAR_BASE_HEIGHT = 58;
export const MOBILE_TAB_BAR_MIN_BOTTOM_PADDING = 10;

export function createMobileTabBarStyle(
  palette: AppPalette,
  tabBarBottomPadding: number,
): ViewStyle {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MOBILE_TAB_BAR_BASE_HEIGHT + tabBarBottomPadding,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: withAlpha(palette.primary, 0.18),
    backgroundColor: palette.panelRaised,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: tabBarBottomPadding,
    shadowColor: palette.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  };
}
