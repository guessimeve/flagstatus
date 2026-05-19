import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Line, G, Defs,
  LinearGradient, Stop, ClipPath,
} from 'react-native-svg';

const W = 180;
const H = 320;
const POLE_X = 41;
const POLE_TOP = 22;
const POLE_H = 274;
const FLAG_W = 114;
const FLAG_H = 70;
const FLAG_FULL_Y = POLE_TOP + 4;
const POLE_MID = POLE_TOP + POLE_H / 2;
const FLAG_HALF_Y = POLE_MID - FLAG_H / 2;
const SLIDE_DISTANCE = FLAG_HALF_Y - FLAG_FULL_Y;

// Canton covers top 7 of 13 stripes
const CANTON_W = 44;
const CANTON_H = FLAG_H * 7 / 13; // ≈ 37.7px

export default function FlagPole({ isHalf = false, scale = 1 }) {
  const slideY = useRef(new Animated.Value(isHalf ? 0 : SLIDE_DISTANCE)).current;
  const scaledSlideY = Animated.multiply(slideY, scale);

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
    <View style={{ width: W * scale, height: H * scale }}>
      {/* Static pole */}
      <Svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="pole" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#888"/>
            <Stop offset="35%"  stopColor="#e8e8e8"/>
            <Stop offset="65%"  stopColor="#d0d0d0"/>
            <Stop offset="100%" stopColor="#888"/>
          </LinearGradient>
        </Defs>
        <Rect x={POLE_X} y={POLE_TOP} width={6} height={POLE_H} rx={3} fill="url(#pole)"/>
        <Ellipse cx={POLE_X + 3} cy={POLE_TOP}     rx={6} ry={4}   fill="#d0d0d0"/>
        <Ellipse cx={POLE_X + 3} cy={POLE_TOP - 2} rx={5} ry={3.5} fill="#e8e8e8"/>
        <Line
          x1={POLE_X + 3} y1={POLE_TOP + 4}
          x2={POLE_X + 3} y2={POLE_TOP + POLE_H - 4}
          stroke="#bbb" strokeWidth={1} strokeDasharray="4,3" opacity={0.5}
        />
        <Rect x={POLE_X - 7}  y={POLE_TOP + POLE_H}     width={20} height={5} rx={2} fill="url(#pole)"/>
        <Rect x={POLE_X - 11} y={POLE_TOP + POLE_H + 5} width={28} height={4} rx={2} fill="#bbb"/>
      </Svg>

      {/* Animated flag */}
      <Animated.View
        style={{
          position: 'absolute',
          left: (POLE_X + 6) * scale,
          top: FLAG_FULL_Y * scale,
          transform: [{ translateY: scaledSlideY }],
        }}
      >
        <Svg width={FLAG_W * scale} height={FLAG_H * scale} viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}>
          <Defs>
            <ClipPath id="flag-clip">
              <Rect x={0} y={0} width={FLAG_W} height={FLAG_H}/>
            </ClipPath>
            {/* Canton clip — prevents stars bleeding into the red stripes */}
            <ClipPath id="canton-clip">
              <Rect x={0} y={0} width={CANTON_W} height={CANTON_H}/>
            </ClipPath>
          </Defs>

          <G clipPath="url(#flag-clip)">
            {/* 13 stripes */}
            {[...Array(13)].map((_, i) => (
              <Rect
                key={i}
                x={0} y={i * (FLAG_H / 13)}
                width={FLAG_W} height={FLAG_H / 13 + 0.5}
                fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
              />
            ))}

            {/* Canton (union) */}
            <Rect x={0} y={0} width={CANTON_W} height={CANTON_H} fill="#002868"/>

            {/* 50 stars — clipped to canton so bottom rows don't bleed */}
            <G fill="white" clipPath="url(#canton-clip)">
              {[0,1,2,3,4,5,6,7,8].map(row => {
                const isWide = row % 2 === 0;
                const count  = isWide ? 6 : 5;
                const xStart = isWide ? 3.8 : 7.2;
                const xStep  = 7.2;
                const y      = 3.8 + row * 3.7;
                return Array.from({ length: count }, (_, col) => (
                  <Circle
                    key={`${row}-${col}`}
                    cx={xStart + col * xStep}
                    cy={y}
                    r={1.25}
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
