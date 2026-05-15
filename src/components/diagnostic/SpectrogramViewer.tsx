import React from 'react';
import { Canvas, Path, Skia, Paint, Shader, Image } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function SpectrogramViewer({ frequencies }: any) {
  // frequencies is a 2D array of power over time & frequency
  // This example draws a simple heatmap grid
  const canvasWidth = width - 40;
  const canvasHeight = 200;

  const paint = Skia.Paint();
  const path = Skia.Path.Make();

  frequencies?.forEach((row: number[], timeIdx: number) => {
    row.forEach((power: number, freqIdx: number) => {
      const x = (timeIdx / frequencies.length) * canvasWidth;
      const y = canvasHeight - (freqIdx / row.length) * canvasHeight;
      const color = `rgba(${Math.min(255, power * 5)}, ${100 - power * 2}, 255, 0.8)`;
      paint.setColor(Skia.Color(color));
      path.addRect(Skia.XYWHRect(x, y, 2, 2)); // small squares
    });
  });

  return (
    <Canvas style={{ width: canvasWidth, height: canvasHeight, borderRadius: 12 }}>
      <Path path={path} paint={paint} />
    </Canvas>
  );
}