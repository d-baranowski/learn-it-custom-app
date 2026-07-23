import type {FC} from 'react';
import {useTheme} from '@mui/material/styles';
import Image from 'next/image'
import {config} from "~/config";


export const Logo: FC = () => {
  const theme = useTheme();
  const fillColor = theme.palette.primary.main;

  return (<Image
      style={{ width: '100%', height: '100%' }}
      src={config.BRAND_LOGO}
      width={150}
      height={150}
      alt="Utro Logo"
      priority
    />

    // <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    //   <path fillRule="evenodd" clipRule="evenodd"
    //         d="M16 28.8C23.0692 28.8 28.8 23.0692 28.8 16C28.8 8.93075 23.0692 3.2 16 3.2C8.93075 3.2 3.2 8.93075 3.2 16C3.2 23.0692 8.93075 28.8 16 28.8ZM16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z"
    //         fill="#0373FF"/>
    //   <path
    //     d="M13.6 12.4016C13.6 13.948 12.3464 15.2016 10.8 15.2016C9.2536 15.2016 8 13.948 8 12.4016C8 10.8552 9.2536 9.60156 10.8 9.60156C12.3464 9.60156 13.6 10.8552 13.6 12.4016Z"
    //     fill="#20BA84"/>
    //   <path
    //     d="M24.0004 12.4016C24.0004 13.948 22.7468 15.2016 21.2004 15.2016C19.654 15.2016 18.4004 13.948 18.4004 12.4016C18.4004 10.8552 19.654 9.60156 21.2004 9.60156C22.7468 9.60156 24.0004 10.8552 24.0004 12.4016Z"
    //     fill="#20BA84"/>
    // </svg>
  );
};
