import { MeshGradientColorsConfig } from '@mesh-gradient/core';

export const GradientColors = {
  green: ['#043D5D', '#032E46', '#23B684', '#0F595E'],
  peach: ['#FE6860', '#FE8A71', '#D9BBAE', '#F3C9BF'],
  sky: ['#c3e4ff', '#6ec3f4', '#eae2ff', '#b9beff'],
  purple: ['#ba53df', '#7948ea', '#6b03b0', '#210368'],
  yellow: ['#ffa061', '#ffc370', '#d9ceaf', '#f2ecbf'],
  lime: ['#d5ff61', '#b0ff70', '#d0d9af', '#dbf2bf'],
  sunrise: ['#8a519a', '#6101c1', '#e24097', '#f3121d'],
  oceanic: ['#005377', '#00A8E8', '#FFFFFF', '#00A8E8'],
  twilight: ['#2c3e50', '#4ca1af', '#c94b4b', '#e96443'],
  forest: ['#0B486B', '#F56217', '#5BC0BE', '#6FB98F'],
  ember: ['#FF4E50', '#F9D423', '#EDE574', '#E1F5C4'],
  sunset: ['#ff7e5f', '#feb47b', '#ff9a8b', '#ff6a88'],
  midnight: ['#2c3e50', '#4ca1af', '#c94b4b', '#e96443'],
  coral: ['#ff6f61', '#d7263d', '#3f88c5', '#1b1b2f'],
  lavender: ['#c3aed6', '#a28fd0', '#8668c7', '#654ba5'],
  mint: ['#3eb489', '#3eb489', '#38ef7d', '#11998e'],
  dusk: ['#141e30', '#243b55', '#302b63', '#0f0c29'],
  aurora: ['#00c6ff', '#0072ff', '#00b09b', '#96c93d'],
  berry: ['#ff6f91', '#ff9671', '#ffc75f', '#f9f871'],
  teal: ['#008080', '#00b3b3', '#00cccc', '#33ffff'],
  sunsetBlaze: ['#FF7E5F', '#FD3A69', '#FF6A88', '#FF99AC'],
  oceanDream: ['#00B4DB', '#0083B0', '#00C6FF', '#0072FF'],
  twilightPurple: ['#5D3FD3', '#A389D4', '#C5B0E3', '#D9B3FF'],
  forestMystic: ['#1B512D', '#77B1A9', '#B5EAEA', '#E3FDFD'],
  auroraBorealis: ['#00F260', '#0575E6', '#2AF598', '#3A7BD5'],
  desertSunset: ['#FFA17F', '#00223E', '#FC4A1A', '#F7B733'],
  emeraldGlow: ['#0F2027', '#203A43', '#2C5364', '#4CA1AF'],
  rubySunrise: ['#FF512F', '#DD2476', '#FF6A88', '#FF99AC'],
} as const;

export type GradientColors = keyof typeof GradientColors;

const LandingColorSets = [
  GradientColors.oceanDream,
  GradientColors.twilightPurple,
  GradientColors.purple,
  GradientColors.midnight,
  GradientColors.forest,
];

export const getRandomColorSet = () => {
  const randomIndex = Math.floor(Math.random() * LandingColorSets.length);
  const randomColorSet = LandingColorSets[randomIndex] as MeshGradientColorsConfig;

  console.log(randomColorSet);

  return randomColorSet;
};
