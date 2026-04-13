import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../theme';

export function TabPageHeader({ title }: { title: string }) {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 2,
        paddingBottom: 4,
      }}>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 16,
          fontWeight: '700',
          color: palette.text,
        }}>
        {title}
      </Text>
    </View>
  );
}
