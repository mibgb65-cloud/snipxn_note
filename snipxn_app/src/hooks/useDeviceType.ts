import { useWindowDimensions } from 'react-native';

export interface DeviceType {
  isTablet: boolean;
  isLandscape: boolean;
  isTabletLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  showSidebar: boolean;
  showMasterDetail: boolean;
  columns: number;
}

const TABLET_BREAKPOINT = 600;
const TABLET_LANDSCAPE_BREAKPOINT = 960;

export function useDeviceType(): DeviceType {
  const { width, height } = useWindowDimensions();

  // Use the shorter dimension so a phone in landscape is never mis-detected as tablet.
  // This matches the logic in ThemeContext.tsx.
  const shortSide = Math.min(width, height);
  const isTablet = shortSide >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const showSidebar = isTablet;
  const showMasterDetail = isTablet && width >= TABLET_LANDSCAPE_BREAKPOINT;

  let columns = 1;

  if (showMasterDetail) {
    columns = 3;
  } else if (isTablet) {
    columns = 2;
  }

  return {
    isTablet,
    isLandscape,
    isTabletLandscape,
    screenWidth: width,
    screenHeight: height,
    showSidebar,
    showMasterDetail,
    columns,
  };
}
