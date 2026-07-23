import {GridColumn} from '@gen/grids';
import React from 'react';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {CellRenderer} from '~/_lib/grid/columns/cell_renderers';
import {ITranslatedString} from '@gen/interface';
import {useRouter} from 'next/router';

export function translatedStringArrayColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: 'translatedStringArray',
    header: col.header,
    visible: col.visible,
    enableSorting: false
  };
}

interface Props {
  value: ITranslatedString[] | null | undefined;
}

const TranslatedStringArrayCell: React.FunctionComponent<Props> = function TranslatedStringArrayCell({ value }) {
  const router = useRouter();
  const { locale } = router;

  if (!value) {
    return (<span>No Value</span>);
  }

  try {
    // Parse the JSON array of TranslatedStrings
    const translatedStrings: ITranslatedString[] = value;

    if (!Array.isArray(translatedStrings) || translatedStrings.length === 0) {
      return (<span>No Value</span>);
    }

    // Map each TranslatedString to the appropriate locale text
    const displayTexts = translatedStrings.map((ts) => {
      let displayText = ts.en || ''; // Default to English

      if (locale === 'pl' && ts.pl) {
        displayText = ts.pl;
      } else if (locale === 'en' && ts.en) {
        displayText = ts.en;
      } else if (locale === 'vi' && ts.en) {
        displayText = ts.en;
      }

      return displayText;
    }).filter(text => text); // Filter out empty strings

    if (displayTexts.length === 0) {
      return (<span>No Value</span>);
    }

    return (<span>{displayTexts.join(', ')}</span>);
  } catch (e) {
    console.error('Failed to parse translatedStringArray:', e);
    return (<span>Error</span>);
  }
};

export const translatedStringArrayCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function TranslatedStringArrayColumnCell({cell}) {
    const value = cell.getValue<ITranslatedString[]>();
    return (
      <TranslatedStringArrayCell value={value} />
    );
  };
