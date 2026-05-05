import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript';
import { AutoTypeTable as FumaAutoTypeTable, type AutoTypeTableProps } from 'fumadocs-typescript/ui';

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
});

export function AutoTypeTable(props: Partial<AutoTypeTableProps>) {
  return <FumaAutoTypeTable {...props} generator={generator} />;
}
