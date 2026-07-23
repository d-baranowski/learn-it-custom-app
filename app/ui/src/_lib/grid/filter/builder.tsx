import { GridFilter } from '@gen/grids';
import { ReactElement } from 'react';
import { enumKeys, enums } from '@gen/enums';
import { capitalCase } from 'change-case';
import {
  AutocompleteFilter,
  AutocompleteFilterProps,
} from '~/_lib/grid/filter/autocomplete-filter';
import { DateTimeFilterProps } from '~/_lib/grid/filter/datetime-filter';
import { DateFilterProps } from '~/_lib/grid/filter/date-filter';
import DateRangeFilter, {
  DateRangeFilterProps,
} from '~/_lib/grid/filter/date-range-filter';
// TODO find a better way to do this
import { autocomplete as userAutocomplete } from '@gen/core/v1/user-UserService_connectquery';
import { autocomplete as countryAutocomplete } from '@gen/core/v1/country-CountryService_connectquery';
import { autocomplete as customerAutocomplete } from '@gen/core/v1/customer-CustomerService_connectquery';
import { autocomplete as roleAutocomplete } from '@gen/core/v1/role-RoleService_connectquery';
import { autocomplete as teamAutocomplete } from '@gen/core/v1/team-TeamService_connectquery';
import { autocomplete as languageAutocomplete } from '@gen/core/v1/language-LanguageService_connectquery';
import { autocomplete as therapistAutocomplete } from '@gen/core/v1/therapist-TherapistService_connectquery';
import { autocomplete as serviceAutocomplete } from '@gen/core/v1/service-ServiceService_connectquery';
import { autocomplete as roomAutocomplete } from '@gen/core/v1/room-RoomService_connectquery';
import { autocomplete as therapyAutocomplete } from '@gen/core/v1/therapy-TherapyService_connectquery';
import { autocomplete as officeAutocomplete } from '@gen/core/v1/office-OfficeService_connectquery';
// TODO find a better way to do this
import { WhereBuilder } from '~/request';
import {
  AutocompleteRequest,
  Where_Mode,
  WhereOperator,
} from '@gen/request/v1/base_pb';
import BareGridItem from '~/components/bare-grid-item';
import Box from '@mui/material/Box';
import EnumFilter from './enum-filter';
import BooleanFilter from '~/_lib/grid/filter/boolean-filter';
import NumberFilter from '~/_lib/grid/filter/number-filter';
import TextFilter from '~/_lib/grid/filter/text-filter';
import DateFilter from '~/_lib/grid/filter/date-filter';
import DateTimeFilter from '~/_lib/grid/filter/datetime-filter';

type FilterBuilderResult = Record<
  string,
  FilterGroup & { elements: ReactElement[] }
>;

export function filterBuilder(
  filters: GridFilter[],
  t: (key: string) => string,
  quick: boolean = false
): FilterBuilderResult {
  const result: FilterBuilderResult = {};

  for (const filter of filters) {
    let label = getFilterLabel(filter, quick);

    let Container = getFilterContainer({ filter, quick });

    const g: FilterGroup = getFilterGroup(filter);
    if (!result[g.id]) {
      result[g.id] = { ...g, elements: [] };
    }

    if (filter.enum) {
      const enumKey = filter.type.endsWith('[]')
        ? (filter.type.slice(0, -2) as enumKeys)
        : (filter.type as enumKeys);

      if (enumKey in enums) {
        result[g.id].elements.push(
          <Container>
            <EnumFilter id={filter.id} label={t(label)} enumKey={enumKey} />
          </Container>
        );
      } else {
        console.error(`invalid enum type: ${filter.type}`);
      }
      continue;
    }

    if (filter.id in dateTimeFilters) {
      const dateTimeProps = dateTimeFilters[filter.id];
      result[g.id].elements.push(
        <Container>
          <DateTimeFilter {...dateTimeProps} label={t(dateTimeProps.label)} />
        </Container>
      );
      continue;
    }

    if (filter.id in autocompleteFilters) {
      const autoProps = autocompleteFilters[filter.id];

      result[g.id].elements.push(
        <Container>
          <AutocompleteFilter {...autoProps} />
        </Container>
      );

      continue;
    }

    if (filter.id in dateRangeFilters) {
      const rangeProps = dateRangeFilters[filter.id];
      result[g.id].elements.push(
        <Container>
          <DateRangeFilter {...rangeProps} label={t(rangeProps.label)} />
        </Container>
      );
      continue;
    }

    if (filter.id in dateFiltersWithAdjustment) {
      const dateFilterProps = dateFiltersWithAdjustment[filter.id];
      result[g.id].elements.push(
        <Container>
          <DateFilter {...dateFilterProps} label={t(dateFilterProps.label)} />
        </Container>
      );
      continue;
    }

    if (filter.type in colTypes) {
      const FilterComponent = colTypes[filter.type];
      result[g.id].elements.push(
        <Container>
          <FilterComponent key={filter.id} id={filter.id} label={t(label)} />
        </Container>
      );
    }
  }

  return result;
}

const autocompleteFilters: Record<string, AutocompleteFilterProps> = {
  userId: {
    id: 'userId',
    label: 'User',
    query: userAutocomplete,
  },
  countryId: {
    id: 'countryId',
    label: 'Country',
    query: countryAutocomplete,
  },
  roleId: {
    id: 'roleId',
    label: 'Role',
    query: roleAutocomplete,
  },
  teamId: {
    id: 'teamId',
    label: 'Team',
    query: teamAutocomplete,
  },
  createdBy: {
    id: 'createdBy',
    label: 'Created By',
    query: userAutocomplete,
  },
  updatedBy: {
    id: 'updatedBy',
    label: 'Updated By',
    query: userAutocomplete,
  },
  deletedBy: {
    id: 'deletedBy',
    label: 'Deleted By',
    query: userAutocomplete,
  },
  languageId: {
    id: 'languageId',
    label: 'Language',
    query: languageAutocomplete,
  },
  languageIds: {
    id: 'languageIds',
    label: 'Language',
    query: languageAutocomplete,
  },
  therapistId: {
    id: 'therapistId',
    label: 'Therapist',
    query: therapistAutocomplete,
  },
  serviceId: {
    id: 'serviceId',
    label: 'Service',
    query: serviceAutocomplete,
  },
  roomId: {
    id: 'roomId',
    label: 'Room',
    query: roomAutocomplete,
  },
  therapyId: {
    id: 'therapyId',
    label: 'Therapy',
    query: therapyAutocomplete,
  },
  officeId: {
    id: 'officeId',
    label: 'Office',
    query: officeAutocomplete,
  },
  customerIds: {
    id: 'customerIds',
    label: 'Customers',
    query: customerAutocomplete,
    // customerIds is a repeated/array column. Backend's array WHERE path
    // turns EQ into `value = ANY(column)`, i.e. "row's customerIds contains
    // this customer id" — exactly the filter semantics we want.
  },
};

const dateTimeFilters: Record<string, DateTimeFilterProps> = {
  createdAt: {
    id: 'createdAt',
    label: 'Created At',
  },
  updatedAt: {
    id: 'updatedAt',
    label: 'Updated At',
  },
  deletedAt: {
    id: 'deletedAt',
    label: 'Deleted At',
  },
};

const dateRangeFilters: Record<string, DateRangeFilterProps> = {
  date: {
    id: 'date',
    label: 'Date',
  },
};

const dateFiltersWithAdjustment: Record<string, DateFilterProps> = {
  startDate: {
    id: 'startDate',
    label: 'Start Date',
    timeAdjustment: 'start',
    defaultOperator: WhereOperator.GTE,
  },
  endDate: {
    id: 'endDate',
    label: 'End Date',
    timeAdjustment: 'end',
    defaultOperator: WhereOperator.LTE,
  },
};

const colTypes: Record<string, any> = {
  boolean: BooleanFilter,
  bigint: NumberFilter,
  number: NumberFilter,
  string: TextFilter,
  ITranslatedString: TextFilter,
  date: DateFilter,
  datetime: DateTimeFilter,
};

type FilterGroup = { id: string; title: string; priority: number };

// !! TODO this should become a proto annotation instead TODO !!
function getFilterGroup(filter: GridFilter): FilterGroup {
  const { id } = filter;

  // Therapy-flavoured buckets. Placed first so they win over the generic
  // 'description'/'meta-data' rules below for fields that exist in multiple
  // entities (e.g. displayName).
  if (id === 'therapistId' || id === 'serviceId' || id === 'roomId') {
    return { id: 'configuration', title: 'Configuration', priority: 14 };
  }
  if (id === 'customerIds') {
    return { id: 'participants', title: 'Participants', priority: 13 };
  }
  if (id === 'displayName') {
    return { id: 'description', title: 'Description', priority: 12 };
  }
  if (
    !![
      'startDate',
      'endDate',
      'therapyDayOfWeeks',
      'therapyDaysFirstDaySort',
      'therapyDaysSequenceSort',
    ].find((s) => s === id)
  ) {
    return { id: 'schedule', title: 'Schedule', priority: 11 };
  }
  if (id === 'sessionPrice' || id === 'sessionDuration') {
    return { id: 'pricing', title: 'Pricing', priority: 10 };
  }
  if (id === 'sessionsGeneratedAt' || id === 'sessionsGeneratedTill') {
    return { id: 'generated-sessions', title: 'Generated Sessions', priority: 9 };
  }

  if (
    !![
      'name',
      'code',
      'description',
      'email',
      'fullName',
      'ethnicityId',
      'phoneNumber',
      'gender',
    ].find((s) => s === id)
  ) {
    return { id: 'description', title: 'Description', priority: 12 };
  }

  if (
    !![
      'positionId',
      'factoryId',
      'departmentId',
      'parentDepartmentId',
      'shiftId',
      'jobStatus',
      'availableAnnualDayOffs',
    ].find((s) => s === id)
  ) {
    return { id: 'job', title: 'Job', priority: 11 };
  }

  if (id.startsWith('identificationCard')) {
    return {
      id: 'identification-card',
      title: 'Identification Card',
      priority: 10,
    };
  }

  if (id.startsWith('socialInsurance') || id === 'isInSocialInsurance') {
    return { id: 'social-insurance', title: 'Social Insurance', priority: 9 };
  }

  if (id.startsWith('bank')) {
    return { id: 'bank', title: 'Bank', priority: 8 };
  }

  if (id.startsWith('residence')) {
    return { id: 'residence', title: 'Residence', priority: 8 };
  }

  if (id.startsWith('birth')) {
    return { id: 'birth', title: 'Birth', priority: 8 };
  }

  if (id.startsWith('medical') || id === 'healthInsuranceNumber') {
    return { id: 'mediacal', title: 'Medical', priority: 8 };
  }

  if (
    !![
      'contributionRatePercentage',
      'createdBy',
      'updatedAt',
      'updatedBy',
      'deletedAt',
      'deletedBy',
    ].find((s) => s === id)
  ) {
    return { id: 'meta-data', title: 'Meta Data', priority: 0 };
  }

  if (
    !![
      'createdAt',
      'createdBy',
      'updatedAt',
      'updatedBy',
      'deletedAt',
      'deletedBy',
    ].find((s) => s === id)
  ) {
    return { id: 'meta-data', title: 'Meta Data', priority: 0 };
  }

  return { id: 'other', title: 'Other', priority: 1 };
}

const DefaultFilterContainerWidths: Record<
  string,
  { width: string; xs: number }
> = {
  // If necessary provide global overrides here keyed by the field name
  // eg: mcc: { width: "300px", xs: 4 },
  date: { width: '400px', xs: 6 },
  startDate: { width: '250px', xs: 6 },
  endDate: { width: '250px', xs: 6 },
};

function getFilterContainer(props: { filter: GridFilter; quick?: boolean }) {
  const { filter, quick } = props;
  let width: string = '200px';
  let xs = 6;

  const projectDefault = DefaultFilterContainerWidths[filter.id];
  if (projectDefault) {
    xs = projectDefault.xs;
    width = projectDefault.width;
  }

  if (filter.modalXs) {
    xs = filter.modalXs;
  }

  if (filter.quickWidthPx) {
    width = `${filter.quickWidthPx}px`;
  }

  if (props.quick) {
    return function QuickFilterWrapper(props: React.PropsWithChildren) {
      return <Box sx={{ width: width }}>{props.children}</Box>;
    };
  }

  return function FilterWrapper(props: React.PropsWithChildren) {
    return <BareGridItem xs={xs}>{props.children}</BareGridItem>;
  };
}

export function getFilterLabel(filter: GridFilter, quick: boolean) {
  let id = filter.id;
  if (id.endsWith('ID')) {
    id = id.slice(0, -2); // Remove the last two characters
  } else if (id.endsWith('Id')) {
    id = id.slice(0, -'Id'.length).trim(); // Remove the 'Id' suffix and trim whitespace
  }
  let label = capitalCase(id);
  if (quick && !!filter.quickLabel) {
    label = filter.quickLabel;
  } else if (!!filter.formLabel) {
    label = filter.formLabel;
  }
  return label;
}
