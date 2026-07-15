import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface StbLogoProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const StbLogo: React.FC<StbLogoProps> = ({
  size = 80,
  color = '#FFFFFF',
  backgroundColor = '#1565C0',
}) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Background rounded shape (Quatrefoil/Circular) */}
        <Circle cx="50" cy="50" r="48" fill={backgroundColor} />
        
        {/* Main circular border frame */}
        <Circle cx="50" cy="50" r="42" stroke={color} strokeWidth="1.8" fill="none" />
        
        {/* Inner thin circular border */}
        <Circle cx="50" cy="50" r="39" stroke={color} strokeWidth="0.8" strokeDasharray="3, 3" fill="none" />
        
        {/* Intricate Arabic Calligraphy vector representation */}
        <G transform="translate(18, 18) scale(0.64)">
          {/* Top calligraphy swoop (الشركة) */}
          <Path
            d="M 50 10 Q 55 5, 60 10 T 70 20 Q 65 35, 50 35 T 25 20 Q 30 10, 40 10 Z"
            fill={color}
          />
          <Path
            d="M 28 25 Q 35 15, 52 18 T 68 28 Q 50 48, 28 25 Z"
            fill={color}
            opacity={0.9}
          />
          
          {/* Middle calligraphy stroke (التونسية) */}
          <Path
            d="M 15 50 C 15 35, 30 35, 45 42 C 60 48, 85 45, 85 60 C 85 75, 50 82, 35 70 C 25 62, 10 65, 15 50 Z"
            fill={color}
          />
          <Path
            d="M 32 46 C 45 38, 62 48, 70 54 T 80 44 C 75 62, 45 68, 32 46 Z"
            fill={color}
          />
          
          {/* Bottom calligraphy stroke (للبنك) */}
          <Path
            d="M 30 80 Q 40 92, 50 90 T 70 82 Q 75 75, 65 72 T 45 78 Q 35 78, 30 80 Z"
            fill={color}
          />
          
          {/* Decorative Calligraphy Accents & Harakat (Dots, Dammahs, Sukuns) */}
          {/* Top double dots */}
          <Circle cx="44" cy="22" r="2.5" fill={color} />
          <Circle cx="50" cy="20" r="2.5" fill={color} />
          
          {/* Middle left accent */}
          <Path d="M 72 38 Q 75 35, 78 40 T 72 45 Z" fill={color} />
          
          {/* Middle right accent */}
          <Path d="M 22 42 Q 25 38, 28 44 T 22 48 Z" fill={color} />
          
          {/* Bottom dots */}
          <Circle cx="40" cy="62" r="2.5" fill={color} />
          <Circle cx="46" cy="64" r="2.5" fill={color} />
          <Circle cx="58" cy="60" r="2.5" fill={color} />
          
          {/* Fathah/Sukun accents */}
          <Path d="M 35 32 L 45 28 C 46 29, 46 30, 45 31 L 35 35 Z" fill={color} />
          <Path d="M 55 72 L 63 68 C 64 69, 64 70, 63 71 L 55 75 Z" fill={color} />
          
          {/* Mini Crescent-like accents */}
          <Path
            d="M 52 48 Q 50 43, 53 40 Q 56 43, 54 48 Z"
            fill={color}
          />
        </G>
      </Svg>
    </View>
  );
};
