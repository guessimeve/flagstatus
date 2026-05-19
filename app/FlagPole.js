import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Line, G, Defs,
  LinearGradient, Stop, ClipPath,
} from 'react-native-svg';

const W = 180;   // SVG width
const H = 320;   // SVG height
const POLE_X = 41;
const POLE_TOP = 22;
const POLE_H = 274;
const FLAG_W = 114;
const FLAG_H = 70;
// Flag top sits 4px below the finial at full staff
const FLAG_FULL_Y = POLE_TOP + 4;
// Half staff: flag midpoint = pole midpoint
const POLE_MID = POLE_TOP + POLE_H / 2;
const FLAG_HALF_Y = POLE_MID - FLAG_H / 2;
const SLIDE_DISTANCE = FLAG_HALF_Y - FLAG_FULL_Y;

export default function FlagPole({ isHalf = false }) {
  // Always start from the opposite position so there's a visible animation on load
  const slideY = useRef(new Animated.Value(isHalf ? 0 : SLIDE_DISTANCE)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(slideY, {
        toValue: isHalf ? SLIDE_DISTANCE : 0,
        duration: 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 300);
    return () => clearTimeout(timer);
  }, [isHalf]);

  return (
    <View style={{ width: W, height: H }}>
      {/* Static pole, finial, lanyard, base */}
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="pole" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#888"/>
            <Stop offset="35%"  stopColor="#e8e8e8"/>
            <Stop offset="65%"  stopColor="#d0d0d0"/>
            <Stop offset="100%" stopColor="#888"/>
          </LinearGradient>
        </Defs>

        {/* Pole shaft */}
        <Rect x={POLE_X} y={POLE_TOP} width={6} height={POLE_H} rx={3} fill="url(#pole)"/>

        {/* Finial: flat silver cap */}
        <Ellipse cx={POLE_X + 3} cy={POLE_TOP} rx={6} ry={4} fill="#d0d0d0"/>
        <Ellipse cx={POLE_X + 3} cy={POLE_TOP - 2} rx={5} ry={3.5} fill="#e8e8e8"/>

        {/* Lanyard: dashed line beside the pole */}
        <Line
          x1={POLE_X + 3} y1={POLE_TOP + 4}
          x2={POLE_X + 3} y2={POLE_TOP + POLE_H - 4}
          stroke="#bbb" strokeWidth={1} strokeDasharray="4,3" opacity={0.5}
        />

        {/* Base */}
        <Rect x={POLE_X - 7}  y={POLE_TOP + POLE_H}     width={20} height={5}  rx={2} fill="url(#pole)"/>
        <Rect x={POLE_X - 11} y={POLE_TOP + POLE_H + 5} width={28} height={4}  rx={2} fill="#bbb"/>
      </Svg>

      {/* Animated flag — slides up/down independently of the pole */}
      <Animated.View
        style={{
          position: 'absolute',
          left: POLE_X + 6,
          top: FLAG_FULL_Y,
          transform: [{ translateY: slideY }],
        }}
      >
        <Svg width={FLAG_W} height={FLAG_H}>
          <Defs>
            <ClipPath id="flag-clip">
              <Rect x={0} y={0} width={FLAG_W} height={FLAG_H}/>
            </ClipPath>
          </Defs>
          <G clipPath="url(#flag-clip)">
            {/* 13 stripes */}
            {[...Array(13)].map((_, i) => (
              <Rect
                key={i}
                x={0} y={i * (FLAG_H / 13)}
                width={FLAG_W} height={FLAG_H / 13 + 0.5}
                fill={i % 2 === 0 ? '#B22234' : '#ffffff'}
              />
            ))}
            {/* Canton */}
            <Rect x={0} y={0} width={44} height={FLAG_H * 7 / 13} fill="#3C3B6E"/>
            {/* Stars: 5 rows of 6 alternating with 4 rows of 5 */}
            <G fill="white">
              {[0,1,2,3,4,5,6,7,8].map(row => {
                const isWide = row % 2 === 0;
                const count = isWide ? 6 : 5;
                const xStart = isWide ? 4 : 7.5;
                const xStep = 7;
                const y = 4 + row * 4.2;
                return Array.from({ length: count }, (_, col) => (
                  <Circle
                    key={`${row}-${col}`}
                    cx={xStart + col * xStep}
                    cy={y}
                    r={1.3}
                  />
                ));
              })}
            </G>
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
