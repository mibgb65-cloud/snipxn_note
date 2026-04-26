import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';

import { useDeviceType } from '../../hooks';
import { useAppTheme } from '../../theme';

import { APP_LAYOUT_TRANSITION } from './AppMotion';

export interface MasterDetailProps {
  masterWidth?: number;
  renderMaster: () => ReactNode;
  renderDetail: () => ReactNode;
  showDetail: boolean;
}

const DEFAULT_MASTER_WIDTH = 320;
const NARROW_MASTER_MAX_WIDTH = 280;

export function MasterDetail({
  masterWidth = DEFAULT_MASTER_WIDTH,
  renderMaster,
  renderDetail,
  showDetail,
}: MasterDetailProps) {
  const { showMasterDetail, showSidebar } = useDeviceType();
  const { palette } = useAppTheme();

  if (!showSidebar || !showDetail) {
    return (
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ flex: 1, minWidth: 0 }}>
        {renderMaster()}
      </Animated.View>
    );
  }

  if (masterWidth <= 0) {
    return (
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ flex: 1, minWidth: 0 }}>
        {renderDetail()}
      </Animated.View>
    );
  }

  const resolvedMasterWidth = showMasterDetail
    ? masterWidth
    : Math.min(masterWidth, NARROW_MASTER_MAX_WIDTH);

  return (
    <Animated.View
      layout={APP_LAYOUT_TRANSITION}
      style={{ flex: 1, minWidth: 0, flexDirection: 'row', backgroundColor: palette.canvas }}>
      <Animated.View
        layout={APP_LAYOUT_TRANSITION}
        style={{ minWidth: 0, flexShrink: 0, width: resolvedMasterWidth }}>
        {renderMaster()}
      </Animated.View>
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ width: 1, backgroundColor: palette.borderStrong }} />
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ minWidth: 0, flex: 1 }}>
        {renderDetail()}
      </Animated.View>
    </Animated.View>
  );
}
