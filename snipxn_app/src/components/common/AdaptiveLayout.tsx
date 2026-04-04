import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';

import { useDeviceType } from '../../hooks';
import { useAppTheme } from '../../theme';

import { APP_LAYOUT_TRANSITION } from './AppMotion';
import { MasterDetail } from './MasterDetail';

export interface AdaptiveLayoutProps {
  renderSidebar: () => ReactNode;
  renderList: () => ReactNode;
  renderContent: () => ReactNode;
  sidebarWidth?: number;
  listWidth?: number;
}

const DEFAULT_SIDEBAR_WIDTH = 240;
const DEFAULT_LIST_WIDTH = 300;

export function AdaptiveLayout({
  renderSidebar,
  renderList,
  renderContent,
  sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
  listWidth = DEFAULT_LIST_WIDTH,
}: AdaptiveLayoutProps) {
  const { showSidebar, showMasterDetail } = useDeviceType();
  const { palette } = useAppTheme();
  const shouldRenderSidebarPane = showMasterDetail && sidebarWidth > 0;

  if (!showSidebar) {
    return (
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ flex: 1, minWidth: 0 }}>
        {renderList()}
      </Animated.View>
    );
  }

  if (!showMasterDetail || !shouldRenderSidebarPane) {
    return (
      <MasterDetail
        masterWidth={listWidth}
        renderMaster={renderList}
        renderDetail={renderContent}
        showDetail
      />
    );
  }

  return (
    <Animated.View
      layout={APP_LAYOUT_TRANSITION}
      style={{ flex: 1, minWidth: 0, flexDirection: 'row', backgroundColor: palette.canvas }}>
      <Animated.View
        layout={APP_LAYOUT_TRANSITION}
        style={{ minWidth: 0, flexShrink: 0, width: sidebarWidth }}>
        {renderSidebar()}
      </Animated.View>
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ width: 1, backgroundColor: palette.borderStrong }} />
      <Animated.View layout={APP_LAYOUT_TRANSITION} style={{ minWidth: 0, flex: 1 }}>
        <MasterDetail
          masterWidth={listWidth}
          renderMaster={renderList}
          renderDetail={renderContent}
          showDetail
        />
      </Animated.View>
    </Animated.View>
  );
}
