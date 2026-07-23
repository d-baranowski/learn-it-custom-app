import React, {memo} from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import styles from './breadcrumb.module.css';
import {Breadcrumb, useBreadcrumbs} from '~/providers/breadcrumbs';
import Link from '@mui/material/Link';
import {useTranslation} from 'next-i18next';

interface BreadcrumbsPortalProps {
  id?: string;
}

const BreadcrumbsRenderer: React.FC<BreadcrumbsPortalProps> = () => {
  const { t } = useTranslation('common');
  const { breadcrumbs } = useBreadcrumbs();
  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" className={styles.breadcrumb}>
        {breadcrumbs.map((bc) => {
          return renderBreadcrumb(bc, t);
        })}
      </Breadcrumbs>
    </>
  );
};

const renderBreadcrumb = (bc: Breadcrumb, t: (p: string) => string) => {
  const { label, href, icon: Icon, id } = bc;
  return (
    <div id={id} key={id}>
      {href ? (
        <Link href={href} sx={{ display: 'flex', alignItems: 'center' }}>
          {Icon ? <Icon sx={{ mr: 0.5 }} fontSize="inherit" /> : null}
          {t(label)}
        </Link>
      ) : (
        <>
          {Icon ? <Icon sx={{ mr: 0.5 }} fontSize="inherit" /> : null}
          {t(label)}
        </>
      )}
    </div>
  );
};

export default memo(BreadcrumbsRenderer);
