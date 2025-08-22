export const genRandomColors = () => {
  const colors: string[] = [];

  for (let i = 0; i < 4; i++) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Конвертируем в hex формат
    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    colors.push(hexColor);
  }

  return colors;
};
