import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type AppIconName =
  | 'alert-circle'
  | 'arrow-left'
  | 'arrow-right'
  | 'bookmark'
  | 'bookmark-filled'
  | 'check-circle'
  | 'chevron-left'
  | 'chevron-right'
  | 'cloud-off'
  | 'code'
  | 'community'
  | 'database'
  | 'devices'
  | 'edit-3'
  | 'eye'
  | 'folder'
  | 'flame'
  | 'github'
  | 'google'
  | 'heart'
  | 'heart-filled'
  | 'info'
  | 'log-out'
  | 'message-square'
  | 'moon'
  | 'more'
  | 'notes'
  | 'palette'
  | 'panel-left-close'
  | 'panel-left-open'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'save'
  | 'search'
  | 'send'
  | 'settings'
  | 'share'
  | 'shield'
  | 'sparkles'
  | 'star'
  | 'star-filled'
  | 'sun'
  | 'sync'
  | 'tag'
  | 'trash'
  | 'upload'
  | 'user'
  | 'x';

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export function AppIcon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.9,
  filled = false,
}: AppIconProps) {
  const commonProps = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth,
  };

  const effectiveFilled =
    filled || name === 'star-filled' || name === 'heart-filled' || name === 'bookmark-filled';

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {name === 'search' ? (
        <>
          <Circle cx="11" cy="11" r="7" {...commonProps} />
          <Line x1="20" x2="16.65" y1="20" y2="16.65" {...commonProps} />
        </>
      ) : null}

      {name === 'plus' ? (
        <>
          <Line x1="12" x2="12" y1="5" y2="19" {...commonProps} />
          <Line x1="5" x2="19" y1="12" y2="12" {...commonProps} />
        </>
      ) : null}

      {name === 'sparkles' ? (
        <>
          <Path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3z" {...commonProps} />
          <Path d="M18.5 15l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" {...commonProps} />
          <Path d="M5 14l.5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5L5 14z" {...commonProps} />
        </>
      ) : null}

      {name === 'play' ? (
        <Path d="M8 6l10 6-10 6V6z" {...commonProps} fill={effectiveFilled ? color : 'none'} />
      ) : null}

      {name === 'share' ? (
        <>
          <Path d="M14 4h6v6" {...commonProps} />
          <Path d="M10 14L20 4" {...commonProps} />
          <Path d="M20 14v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h3" {...commonProps} />
        </>
      ) : null}

      {name === 'more' ? (
        <>
          <Circle cx="6" cy="12" fill={color} r="1.6" />
          <Circle cx="12" cy="12" fill={color} r="1.6" />
          <Circle cx="18" cy="12" fill={color} r="1.6" />
        </>
      ) : null}

      {name === 'tag' ? (
        <>
          <Path d="M20 12l-8 8-8-8V4h8l8 8z" {...commonProps} />
          <Circle cx="8.5" cy="8.5" fill={color} r="1.2" />
        </>
      ) : null}

      {name === 'code' ? (
        <>
          <Polyline points="9 18 3 12 9 6" {...commonProps} />
          <Polyline points="15 6 21 12 15 18" {...commonProps} />
        </>
      ) : null}

      {name === 'star' || name === 'star-filled' ? (
        <Path
          d="M12 3.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 17.1 6.8 19.8l1-5.8L3.6 9.9l5.8-.8L12 3.8z"
          {...commonProps}
          fill={effectiveFilled ? color : 'none'}
        />
      ) : null}

      {name === 'trash' ? (
        <>
          <Path d="M4 7h16" {...commonProps} />
          <Path d="M10 11v6" {...commonProps} />
          <Path d="M14 11v6" {...commonProps} />
          <Path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" {...commonProps} />
          <Path d="M9 7V4h6v3" {...commonProps} />
        </>
      ) : null}

      {name === 'folder' ? (
        <Path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" {...commonProps} />
      ) : null}

      {name === 'sync' || name === 'refresh' ? (
        <>
          <Path d="M20 5v5h-5" {...commonProps} />
          <Path d="M4 19v-5h5" {...commonProps} />
          <Path d="M18.4 10A7 7 0 0 0 6 7.5L4 10" {...commonProps} />
          <Path d="M5.6 14A7 7 0 0 0 18 16.5L20 14" {...commonProps} />
        </>
      ) : null}

      {name === 'cloud-off' ? (
        <>
          <Path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8a4 4 0 1 1 0 10H7z" {...commonProps} />
          <Line x1="4" x2="20" y1="4" y2="20" {...commonProps} />
        </>
      ) : null}

      {name === 'check-circle' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...commonProps} />
          <Path d="M8.5 12.3l2.3 2.3 4.7-5" {...commonProps} />
        </>
      ) : null}

      {name === 'alert-circle' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...commonProps} />
          <Line x1="12" x2="12" y1="8" y2="13" {...commonProps} />
          <Circle cx="12" cy="16.5" fill={color} r="1" />
        </>
      ) : null}

      {name === 'heart' || name === 'heart-filled' ? (
        <Path
          d="M12 20s-7-4.7-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.3-7 10-7 10z"
          {...commonProps}
          fill={effectiveFilled ? color : 'none'}
        />
      ) : null}

      {name === 'bookmark' || name === 'bookmark-filled' ? (
        <Path
          d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z"
          {...commonProps}
          fill={effectiveFilled ? color : 'none'}
        />
      ) : null}

      {name === 'message-square' ? (
        <>
          <Rect height="14" rx="3" width="18" x="3" y="4" {...commonProps} />
          <Path d="M8 18v3l4-3" {...commonProps} />
        </>
      ) : null}

      {name === 'arrow-left' ? (
        <>
          <Line x1="19" x2="5" y1="12" y2="12" {...commonProps} />
          <Polyline points="11 18 5 12 11 6" {...commonProps} />
        </>
      ) : null}

      {name === 'arrow-right' ? (
        <>
          <Line x1="5" x2="19" y1="12" y2="12" {...commonProps} />
          <Polyline points="13 6 19 12 13 18" {...commonProps} />
        </>
      ) : null}

      {name === 'chevron-left' ? (
        <Polyline points="15 18 9 12 15 6" {...commonProps} />
      ) : null}

      {name === 'chevron-right' ? (
        <Polyline points="9 18 15 12 9 6" {...commonProps} />
      ) : null}

      {name === 'eye' ? (
        <>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" {...commonProps} />
          <Circle cx="12" cy="12" r="3" {...commonProps} />
        </>
      ) : null}

      {name === 'edit-3' ? (
        <>
          <Path d="M12 20h9" {...commonProps} />
          <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" {...commonProps} />
        </>
      ) : null}

      {name === 'x' ? (
        <>
          <Line x1="18" x2="6" y1="6" y2="18" {...commonProps} />
          <Line x1="6" x2="18" y1="6" y2="18" {...commonProps} />
        </>
      ) : null}

      {name === 'panel-left-close' ? (
        <>
          <Rect height="14" rx="3" width="18" x="3" y="5" {...commonProps} />
          <Line x1="8" x2="8" y1="5" y2="19" {...commonProps} />
          <Polyline points="15 9 11 12 15 15" {...commonProps} />
        </>
      ) : null}

      {name === 'panel-left-open' ? (
        <>
          <Rect height="14" rx="3" width="18" x="3" y="5" {...commonProps} />
          <Line x1="8" x2="8" y1="5" y2="19" {...commonProps} />
          <Polyline points="12 9 16 12 12 15" {...commonProps} />
        </>
      ) : null}

      {name === 'save' ? (
        <>
          <Path d="M5 4h12l2 2v14H5V4z" {...commonProps} />
          <Rect height="4" rx="1" width="6" x="9" y="4" {...commonProps} />
          <Rect height="5" rx="1" width="8" x="8" y="14" {...commonProps} />
        </>
      ) : null}

      {name === 'user' ? (
        <>
          <Circle cx="12" cy="8" r="3.5" {...commonProps} />
          <Path d="M5 19a7 7 0 0 1 14 0" {...commonProps} />
        </>
      ) : null}

      {name === 'shield' ? (
        <Path d="M12 3l7 3v5c0 4.7-2.8 8.8-7 10-4.2-1.2-7-5.3-7-10V6l7-3z" {...commonProps} />
      ) : null}

      {name === 'devices' ? (
        <>
          <Rect height="8" rx="1.8" width="12" x="3" y="5" {...commonProps} />
          <Path d="M8 18h2" {...commonProps} />
          <Rect height="11" rx="1.5" width="6" x="16" y="8" {...commonProps} />
        </>
      ) : null}

      {name === 'palette' ? (
        <>
          <Path d="M12 3a9 9 0 1 0 0 18h1.3a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h1a4 4 0 1 0 0-8z" {...commonProps} />
          <Circle cx="7.5" cy="10" fill={color} r="1" />
          <Circle cx="9.5" cy="7" fill={color} r="1" />
          <Circle cx="14.5" cy="7.5" fill={color} r="1" />
        </>
      ) : null}

      {name === 'database' ? (
        <>
          <EllipseFallback color={color} strokeWidth={strokeWidth} y="6" />
          <Path d="M5 6v8c0 1.7 3.1 3 7 3s7-1.3 7-3V6" {...commonProps} />
          <Path d="M5 10c0 1.7 3.1 3 7 3s7-1.3 7-3" {...commonProps} />
          <Path d="M5 14c0 1.7 3.1 3 7 3s7-1.3 7-3" {...commonProps} />
        </>
      ) : null}

      {name === 'info' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...commonProps} />
          <Line x1="12" x2="12" y1="10.5" y2="16" {...commonProps} />
          <Circle cx="12" cy="7.2" fill={color} r="1" />
        </>
      ) : null}

      {name === 'log-out' ? (
        <>
          <Path d="M10 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" {...commonProps} />
          <Line x1="21" x2="13" y1="12" y2="12" {...commonProps} />
          <Polyline points="17 8 21 12 17 16" {...commonProps} />
        </>
      ) : null}

      {name === 'moon' ? (
        <Path d="M18 14.5A7.5 7.5 0 0 1 9.5 6 8.5 8.5 0 1 0 18 14.5z" {...commonProps} />
      ) : null}

      {name === 'sun' ? (
        <>
          <Circle cx="12" cy="12" r="4" {...commonProps} />
          <Line x1="12" x2="12" y1="2.5" y2="5" {...commonProps} />
          <Line x1="12" x2="12" y1="19" y2="21.5" {...commonProps} />
          <Line x1="2.5" x2="5" y1="12" y2="12" {...commonProps} />
          <Line x1="19" x2="21.5" y1="12" y2="12" {...commonProps} />
          <Line x1="5.6" x2="7.3" y1="5.6" y2="7.3" {...commonProps} />
          <Line x1="16.7" x2="18.4" y1="16.7" y2="18.4" {...commonProps} />
          <Line x1="16.7" x2="18.4" y1="7.3" y2="5.6" {...commonProps} />
          <Line x1="5.6" x2="7.3" y1="18.4" y2="16.7" {...commonProps} />
        </>
      ) : null}

      {name === 'notes' ? (
        <>
          <Rect height="16" rx="2" width="12" x="6" y="4" {...commonProps} />
          <Line x1="9" x2="15" y1="9" y2="9" {...commonProps} />
          <Line x1="9" x2="15" y1="13" y2="13" {...commonProps} />
        </>
      ) : null}

      {name === 'community' ? (
        <>
          <Circle cx="8.5" cy="9.5" r="2.8" {...commonProps} />
          <Circle cx="16.3" cy="8.7" r="2.3" {...commonProps} />
          <Path d="M3.5 18a5.5 5.5 0 0 1 10.2 0" {...commonProps} />
          <Path d="M13.4 16.4a4.6 4.6 0 0 1 7.1 1.9" {...commonProps} />
        </>
      ) : null}

      {name === 'settings' ? (
        <>
          <Circle cx="12" cy="12" r="3" {...commonProps} />
          <Path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7z" {...commonProps} />
        </>
      ) : null}

      {name === 'upload' ? (
        <>
          <Path d="M12 16V5" {...commonProps} />
          <Polyline points="7.5 9.5 12 5 16.5 9.5" {...commonProps} />
          <Path d="M5 19h14" {...commonProps} />
        </>
      ) : null}

      {name === 'send' ? (
        <>
          <Path d="M21 3L10 14" {...commonProps} />
          <Path d="M21 3l-7 18-4-7-7-4 18-7z" {...commonProps} />
        </>
      ) : null}

      {name === 'flame' ? (
        <Path
          d="M12 22c-3.9 0-7-2.9-7-6.8 0-2.2 1-4.3 2.7-5.6.7 1.9 2.3 3.1 4.1 3.4-.6-2.4.3-5.4 2.6-7 1.7 1.7 2.6 3.6 2.8 5.6.7-.5 1.2-1.2 1.5-2 1.5 1.4 2.3 3.3 2.3 5.4 0 4-3.1 7-7 7z"
          {...commonProps}
        />
      ) : null}

      {name === 'github' ? (
        <Path
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.295 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
          fill={color}
          stroke="none"
        />
      ) : null}

      {name === 'google' ? (
        <>
          <Path
            d="M21.805 10.041H12.21v3.866h5.518c-.476 2.534-2.745 3.897-5.518 3.897a6.103 6.103 0 01-6.045-6.285 6.103 6.103 0 016.045-6.285c1.585 0 3.007.546 4.127 1.617l2.89-2.89C17.565 2.408 15.12 1.519 12.21 1.519 6.69 1.519 2.165 6.044 2.165 11.519s4.525 10 10.045 10c5.194 0 9.625-3.762 9.625-10 0-.544-.014-1.07-.03-1.478z"
            fill={color}
            stroke="none"
          />
        </>
      ) : null}
    </Svg>
  );
}

function EllipseFallback({
  color,
  strokeWidth,
  y,
}: {
  color: string;
  strokeWidth: number;
  y: string;
}) {
  return (
    <>
      <Path
        d={`M5 ${y}c0 1.7 3.1 3 7 3s7-1.3 7-3-3.1-3-7-3-7 1.3-7 3z`}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </>
  );
}
