import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

// Respect prefers-reduced-motion on web; native defaults to false
const prefersReducedMotion = () =>
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false)
    : false;
import Svg, {
  Rect, Circle, Line, G, Defs,
  ClipPath,
} from 'react-native-svg';

const W = 180;
const H = 250;
const POLE_X = 41;
const POLE_TOP = 22;
const POLE_H = 188;
const FLAG_W = 114;
const FLAG_H = 70;
const FLAG_FULL_Y = POLE_TOP;
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
        duration: prefersReducedMotion() ? 0 : 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 300);
    return () => clearTimeout(timer);
  }, [isHalf]);

  return (
    <View accessible={false} style={{ width: W * scale, height: H * scale }}>
      {/* Static pole — pure hairline */}
      <Svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute' }}>
        <Line
          x1={POLE_X + 3} y1={POLE_TOP}
          x2={POLE_X + 3} y2={POLE_TOP + POLE_H}
          stroke="#3A4E62" strokeWidth={3}
        />
      </Svg>

      {/* Animated flag */}
      <Animated.View
        style={{
          position: 'absolute',
          left: (POLE_X + 5) * scale,
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
            {/* 13 stripes — flat bold colors, geometric */}
            {[...Array(13)].map((_, i) => (
              <Rect
                key={i}
                x={0} y={i * (FLAG_H / 13)}
                width={FLAG_W} height={FLAG_H / 13 + 0.5}
                fill={i % 2 === 0 ? '#BF0A30' : '#FFFFFF'}
              />
            ))}

            {/* Canton (union) — flat, no gradients */}
            <Rect x={0} y={0} width={CANTON_W} height={CANTON_H} fill="#002868"/>

            {/* 50 stars — clipped to canton, slightly bolder dots */}
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
                    r={1.4}
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
