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

  const isTablet = width >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  const isTabletLandscape = width >= TABLET_LANDSCAPE_BREAKPOINT;
  const showSidebar = width >= TABLET_BREAKPOINT;
  const showMasterDetail = width >= TABLET_LANDSCAPE_BREAKPOINT;

  let columns = 1;

  if (width >= TABLET_LANDSCAPE_BREAKPOINT) {
    columns = 3;
  } else if (width >= TABLET_BREAKPOINT) {
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
