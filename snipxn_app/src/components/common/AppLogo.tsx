import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
}

export function AppLogo({ size = 56 }: AppLogoProps) {
  return (
    <Svg height={size} width={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="sGrad" x1="0.1" y1="0.08" x2="0.92" y2="0.9">
          <Stop offset="0" stopColor="#0891B2" />
          <Stop offset="0.55" stopColor="#22D3EE" />
          <Stop offset="1" stopColor="#74EEA5" />
        </LinearGradient>
      </Defs>
      <Path
        d="M60 18L87 33.5V64.5L60 80L33 64.5V33.5Z"
        stroke="#22D3EE"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
        opacity={0.12}
      />
      <Path
        d="M72 24H52C38 24 27 33 27 44C27 55 38 60 52 60H68C82 60 93 69 93 80C93 91 82 96 68 96H48"
        stroke="url(#sGrad)"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.12}
      />
      <Line
        x1="35"
        y1="95"
        x2="86"
        y2="24"
        stroke="#86EFAC"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity={0.55}
      />
      <Path
        d="M72 24H52C38 24 27 33 27 44C27 55 38 60 52 60H68C82 60 93 69 93 80C93 91 82 96 68 96H48"
        stroke="url(#sGrad)"
        strokeWidth="12.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
