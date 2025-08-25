export const formatObjectAsJS = (obj: any, indent = 2): string => {
  const spaces = ' '.repeat(indent);
  const parentSpaces = ' '.repeat(Math.max(0, indent - 2));
  const entries = Object.entries(obj)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const formattedArray = `[\n${value.map((item) => `${spaces}  "${item}"`).join(',\n')}\n${spaces}]`;

        return `${spaces}${key}: ${formattedArray}`;
      }

      if (typeof value === 'object' && value !== null) {
        const nestedSpaces = ' '.repeat(indent + 2);
        const nestedEntries = Object.entries(value).map(([nestedKey, nestedValue]) => {
          if (typeof nestedValue === 'string') {
            return `${nestedSpaces}${nestedKey}: "${nestedValue}"`;
          }

          return `${nestedSpaces}${nestedKey}: ${nestedValue}`;
        });

        return `${spaces}${key}: {\n${nestedEntries.join(',\n')}\n${spaces}}`;
      }

      if (typeof value === 'string') {
        return `${spaces}${key}: "${value}"`;
      }

      return `${spaces}${key}: ${value}`;
    });

  return `{\n${entries.join(',\n')}\n${parentSpaces}}`;
};
