import {WhereOperator} from '@gen/request/v1/base_pb';
import {
  IconEndsWith,
  IconSearch,
  IconStartsWith,
  IconEquals,
  IconNotEqual,
  IconGreaterThan,
  IconGreaterThanEqual,
  IconLessThan,
  IconLessThanEqual,
  IconList,
  IconBetween,
  IconBan,
  IconNull
} from '~/icons/fortawesome';
import React, {FC, useState} from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {useTranslation} from 'next-i18next';

interface NumberFilterProps {
  operator: WhereOperator,
  operators?: WhereOperator[],
  onOperatorChange: (operator: WhereOperator) => void,
}

const FilterAdornment: FC<NumberFilterProps> = (props) => {
  const {
    operator = WhereOperator.EQ,
    operators = [
      WhereOperator.EQ,
    ],
    onOperatorChange,
  } = props;

  const { t } = useTranslation('common');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOperatorIconClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleOperatorMenuClose = () => {
    setAnchorEl(null);
  };

  const renderOperatorIcon = () => {
    switch (operator) {
      case WhereOperator.EQ:
        return <IconEquals />;
      
      case WhereOperator.NEQ:
        return <IconNotEqual />;
      
      case WhereOperator.GT:
        return <IconGreaterThan />;
      
      case WhereOperator.GTE:
        return <IconGreaterThanEqual />;
      
      case WhereOperator.LT:
        return <IconLessThan />;
      
      case WhereOperator.LTE:
        return <IconLessThanEqual />;
      
      case WhereOperator.VAL_IN_COL:
      case WhereOperator.VAL_NIN_COL:
        return <IconList />;
      
      case WhereOperator.BETWEEN:
      case WhereOperator.NBETWEEN:
        return <IconBetween />;
      
      case WhereOperator.ISNULL:
      case WhereOperator.NOTNULL:
        return <IconNull />;
      
      case WhereOperator.STARTSWITH:
      case WhereOperator.ISTARTSWITH:
      case WhereOperator.NSTARTSWITH:
      case WhereOperator.NISTARTSWITH:
        return <IconStartsWith />;

      case WhereOperator.ENDSWITH:
      case WhereOperator.IENDSWITH:
      case WhereOperator.NENDSWITH:
      case WhereOperator.NIENDSWITH:
        return <IconEndsWith />;
      
      case WhereOperator.LIKE:
      case WhereOperator.NLIKE:
      case WhereOperator.ILIKE:
      case WhereOperator.NILIKE:
        return <IconSearch />;

      default:
        return <><IconSearch /></>;
    }
  };

  const renderOperatorLabel = (operator: WhereOperator) => {
    switch (operator) {
      case WhereOperator.EQ:
        return <><IconEquals style={{marginRight: '8px'}} /> {t('Equal')}</>;
      case WhereOperator.NEQ:
        return <><IconNotEqual style={{marginRight: '8px'}} /> {t('Not Equal')}</>;
      case WhereOperator.GT:
        return <><IconGreaterThan style={{marginRight: '8px'}} /> {t('Greater Than')}</>;
      case WhereOperator.GTE:
        return <><IconGreaterThanEqual style={{marginRight: '8px'}} /> {t('Greater Than or Equal')}</>;
      case WhereOperator.LT:
        return <><IconLessThan style={{marginRight: '8px'}} /> {t('Less Than')}</>;
      case WhereOperator.LTE:
        return <><IconLessThanEqual style={{marginRight: '8px'}} /> {t('Less Than or Equal')}</>;
      case WhereOperator.VAL_IN_COL:
        return <><IconList style={{marginRight: '8px'}} /> {t('In')}</>;
      case WhereOperator.VAL_NIN_COL:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Not In')}</>;
      case WhereOperator.LIKE:
        return <><IconSearch style={{marginRight: '8px'}} /> {t('Like')}</>;
      case WhereOperator.NLIKE:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Not Like')}</>;
      case WhereOperator.ILIKE:
        return <><IconSearch style={{marginRight: '8px'}} /> {t('Insensitive Like')}</>;
      case WhereOperator.NILIKE:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Insensitive Not Like')}</>;
      case WhereOperator.BETWEEN:
        return <><IconBetween style={{marginRight: '8px'}} /> {t('Between')}</>;
      case WhereOperator.NBETWEEN:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Not Between')}</>;
      case WhereOperator.ISNULL:
        return <><IconNull style={{marginRight: '8px'}} /> {t('Is Null')}</>;
      case WhereOperator.NOTNULL:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Is Not Null')}</>;
      case WhereOperator.STARTSWITH:
        return <><IconStartsWith style={{marginRight: '8px'}} /> {t('Starts With')}</>;
      case WhereOperator.NSTARTSWITH:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Not Starts With')}</>;
      case WhereOperator.ENDSWITH:
        return <><IconEndsWith style={{marginRight: '8px'}} /> {t('Ends With')}</>;
      case WhereOperator.NENDSWITH:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Not Ends With')}</>;
      case WhereOperator.ISTARTSWITH:
        return <><IconStartsWith style={{marginRight: '8px'}} /> {t('Insensitive Starts With')}</>;
      case WhereOperator.NISTARTSWITH:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Insensitive Not Starts With')}</>;
      case WhereOperator.IENDSWITH:
        return <><IconEndsWith style={{marginRight: '8px'}} /> {t('Insensitive Ends With')}</>;
      case WhereOperator.NIENDSWITH:
        return <><IconBan style={{marginRight: '8px'}} /> {t('Insensitive Not Ends With')}</>;
      default:
        return <><IconSearch style={{marginRight: '8px'}} /> {t('Search')}</>;
    }
  };

  const handleOperatorChange = (operator: WhereOperator) => {
    onOperatorChange(operator);
    handleOperatorMenuClose();
  };

  return (
    <InputAdornment position="start">
      <Tooltip title={t('Filter Operator')}>
        <IconButton
          aria-label={t('Filter operators')}
          onClick={handleOperatorIconClick}
          sx={{
            p: 0,
          }}
        >
            {renderOperatorIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleOperatorMenuClose}
      >
        {operators.map((op) => (
          <MenuItem
            key={op}
            onClick={() => handleOperatorChange(op)}
            selected={op === operator}
          >
            {renderOperatorLabel(op)}
          </MenuItem>
        ))}
      </Menu>
    </InputAdornment>
  );
};

export default FilterAdornment;
