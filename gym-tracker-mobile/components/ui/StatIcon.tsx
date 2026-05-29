import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type StatIconName = 'streak' | 'week' | 'total' | 'volume';

interface StatIconProps {
  name: StatIconName;
  size?: number;
  color?: string;
}

export function StatIcon({ name, size = 22, color = '#fff' }: StatIconProps) {
  switch (name) {
    case 'streak':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.5c.3 2.5 1.6 4.1 3.2 5.6 1.9 1.8 3.3 3.7 3.3 6.4a6.5 6.5 0 1 1-13 0c0-1.7.6-3.1 1.8-4.5.7 1 1.7 1.5 2.6 1.5C9 8.4 8 5.5 12 2.5Z"
            fill={color}
          />
          <Path
            d="M12 13c.1 1 .8 1.7 1.6 2.5.9.9 1.5 1.7 1.5 2.9a3 3 0 1 1-6 0c0-.8.3-1.5.9-2.1.3.5.8.7 1.2.7-.1-1.2.4-2.4.8-4Z"
            fill="#fff"
            opacity={0.35}
          />
        </Svg>
      );

    case 'week':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="5" width="18" height="16" rx="3" stroke={color} strokeWidth={1.8} />
          <Path d="M3 9.5h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8 3v4M16 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path
            d="m8.5 15 2.2 2.2 4.3-4.4"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'total':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2.5" y="9.5" width="2.5" height="5" rx="1" fill={color} />
          <Rect x="19" y="9.5" width="2.5" height="5" rx="1" fill={color} />
          <Rect x="5.5" y="7.5" width="2.6" height="9" rx="1.1" fill={color} />
          <Rect x="15.9" y="7.5" width="2.6" height="9" rx="1.1" fill={color} />
          <Rect x="8.5" y="10.8" width="7" height="2.4" rx="0.6" fill={color} />
        </Svg>
      );

    case 'volume':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 17.5 8.5 12l3.5 3.5L20 7"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14.5 7H20v5.5"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="3" cy="20.5" r="1.2" fill={color} />
          <Circle cx="20" cy="20.5" r="1.2" fill={color} />
        </Svg>
      );
  }
}
