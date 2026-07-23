import React, {FC} from 'react';
import {toast} from 'react-hot-toast';
import InfoIcon from '@mui/icons-material/Info';

interface InfoToastProps {
  message: string;
}

const InfoToast: FC<InfoToastProps> = ({ message }) => {
  return (
    <div className="custom-toast">
      <InfoIcon className="info-icon" color="primary" />
      <p>{message}</p>
    </div>
  );
};

export const showInfoToast = (message: string) => {
  toast.custom((t) => (
    <InfoToast message={message} />
  ), {
    style: {
      backgroundColor: '#f44336',
      color: '#fff',
    },
  });
};
