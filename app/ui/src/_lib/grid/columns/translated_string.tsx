import {GridColumn} from "@gen/grids";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import {ITranslatedString} from "@gen/interface";
import {useRouter} from 'next/router';

export function translatedStringColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "translatedString",
    header: col.header,
    visible: col.visible,
    enableSorting: false
  };
}

export const translatedStringCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function TranslatedStringColumnCell({cell}) {
    const value = cell.getValue<ITranslatedString>();

    return (
      <TranslatedStringCell value={value} />
    );
  }

interface Props {
  value: ITranslatedString;
}

const TranslatedStringCell: React.FunctionComponent<Props> = function TranslatedStringCell({ value }) {
  const router = useRouter();
  const { locale } = router;

  if (!value) {
    return (<span>No Value</span>);
  }

  // Map locales to TranslatedString fields
  // TranslatedString only has 'en' and 'pl' fields based on the proto definition
  // For 'vi' (Vietnamese), we'll default to English
  let displayText = value.en || ''; // Default to English

  if (locale === 'pl' && value.pl) {
    displayText = value.pl;
  } else if (locale === 'en' && value.en) {
    displayText = value.en;
  }
  // For 'vi' or any other locale, we already defaulted to English above

  return (<span>{displayText}</span>);
}
