/**
 * Entity-specific autocomplete fields.
 *
 * Each one is a thin wrapper around <RpgAutocompleteFe> that pre-binds the
 * entity's Connect autocomplete RPC and any default filtering. Replaces the
 * `~/components/form/elements/{customer,therapist,service,...}-fe.tsx` files
 * one-for-one.
 *
 * They're grouped here because each is ~5 useful lines — splitting into 15
 * separate files just adds import noise.
 */

import React from 'react';
import { autocomplete as therapistAutocomplete } from '@gen/core/v1/therapist-TherapistService_connectquery';
import { autocomplete as serviceAutocomplete } from '@gen/core/v1/service-ServiceService_connectquery';
import { autocomplete as therapyAutocomplete } from '@gen/core/v1/therapy-TherapyService_connectquery';
import { autocomplete as therapistServiceAutocomplete } from '@gen/core/v1/therapist_service-TherapistServiceLinkService_connectquery';
import { autocomplete as customerAutocomplete } from '@gen/core/v1/customer-CustomerService_connectquery';
import { autocomplete as officeAutocomplete } from '@gen/core/v1/office-OfficeService_connectquery';
import { autocomplete as roomAutocomplete } from '@gen/core/v1/room-RoomService_connectquery';
import { autocomplete as teamAutocomplete } from '@gen/core/v1/team-TeamService_connectquery';
import { autocomplete as userAutocomplete } from '@gen/core/v1/user-UserService_connectquery';
import { autocomplete as roleAutocomplete } from '@gen/core/v1/role-RoleService_connectquery';
import { autocomplete as languageAutocomplete } from '@gen/core/v1/language-LanguageService_connectquery';
import { nationalityAutocomplete } from '@gen/core/v1/country-CountryService_connectquery';
import { AutocompleteRequest, OrderBy, OrderDirection, Where_Mode } from '@gen/request/v1/base_pb';
import { WhereBuilder } from '~/request';

import { RpgAutocompleteFe, RpgAutocompleteFeProps } from './rpg-autocomplete-fe';
import { DefaultAutocompleteOrder } from './types';

type EntityAutocompleteProps = Omit<RpgAutocompleteFeProps, 'query' | 'request'>;

function buildRequest(
  build: (b: WhereBuilder<any>) => void
): AutocompleteRequest {
  const wb = new WhereBuilder<any>().setMode(Where_Mode.AND);
  build(wb);
  // Default to label-ASC ordering — matches legacy behaviour and gives
  // tests a stable .contains('Adam') resolution when multiple options share
  // a substring.
  return new AutocompleteRequest({
    where: wb.build(),
    order: DefaultAutocompleteOrder,
  });
}

export const TherapistFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={therapistAutocomplete} request={request} />;
};

export const ServiceFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={serviceAutocomplete} request={request} />;
};

export const CustomerFe: React.FC<EntityAutocompleteProps> = (props) => {
  // Customers are soft-deleted via `deletedBy`; filter out tombstoned rows.
  const request = React.useMemo(
    () => buildRequest((wb) => wb.isnull('deletedBy')),
    []
  );
  return <RpgAutocompleteFe {...props} query={customerAutocomplete} request={request} />;
};

export const OfficeFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={officeAutocomplete} request={request} />;
};

export const RoomFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={roomAutocomplete} request={request} />;
};

export const TeamFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={teamAutocomplete} request={request} />;
};

export const UserFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={userAutocomplete} request={request} />;
};

export const RoleFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={roleAutocomplete} request={request} />;
};

export const LanguageFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={languageAutocomplete} request={request} />;
};

export const NationalityFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={nationalityAutocomplete} request={request} />;
};

export const TherapyFe: React.FC<EntityAutocompleteProps> = (props) => {
  const request = React.useMemo(() => buildRequest(() => {}), []);
  return <RpgAutocompleteFe {...props} query={therapyAutocomplete} request={request} />;
};

interface TherapistServiceFeProps extends EntityAutocompleteProps {
  therapistId: string | null | undefined;
}

export const TherapistServiceFe: React.FC<TherapistServiceFeProps> = ({
  therapistId,
  ...rest
}) => {
  const request = React.useMemo(() => {
    const wb = new WhereBuilder<'TherapistServiceLink'>()
      .setMode(Where_Mode.AND)
      .eq('therapistId', therapistId || '');
    return new AutocompleteRequest({
      where: wb.build(),
      order: [new OrderBy({ field: 'id', direction: OrderDirection.ASC })],
    });
  }, [therapistId]);
  return <RpgAutocompleteFe {...rest} query={therapistServiceAutocomplete} request={request} />;
};
