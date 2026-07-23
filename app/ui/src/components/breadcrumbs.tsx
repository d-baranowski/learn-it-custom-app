import Link from 'next/link';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import {useRouter} from 'next/router';

export default function RpgBreadcrumbs() {
  const router = useRouter();
  const pathSegments = router.asPath.split('/').filter(Boolean);



  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link href="/" passHref>
        <Typography color="text.primary" component="a">
          Home
        </Typography>
      </Link>
      {pathSegments.map((segment, index) => {
        const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLastSegment = index === pathSegments.length - 1;

        return isLastSegment ? (
          <Typography key={url} color="text.primary">
            {segment}
          </Typography>
        ) : (
          <Link href={url} passHref key={url}>
            <Typography color="text.primary" component="a">
              {segment}
            </Typography>
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

//import * as React from 'react';
// import Typography from '@mui/material/Typography';
// import Breadcrumbs from '@mui/material/Breadcrumbs';
// import Link from '@mui/material/Link';
// import HomeIcon from '@mui/icons-material/Home';
// import WhatshotIcon from '@mui/icons-material/Whatshot';
// import GrainIcon from '@mui/icons-material/Grain';
//
// function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
//   event.preventDefault();
//   console.info('You clicked a breadcrumb.');
// }
//
// export default function IconBreadcrumbs() {
//   return (
//     <div role="presentation" onClick={handleClick}>
//       <Breadcrumbs aria-label="breadcrumb">
//         <Link
//           underline="hover"
//           sx={{ display: 'flex', alignItems: 'center' }}
//           color="inherit"
//           href="/"
//         >
//           <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
//           MUI
//         </Link>
//         <Link
//           underline="hover"
//           sx={{ display: 'flex', alignItems: 'center' }}
//           color="inherit"
//           href="/material-ui/getting-started/installation/"
//         >
//           <WhatshotIcon sx={{ mr: 0.5 }} fontSize="inherit" />
//           Core
//         </Link>
//         <Typography
//           sx={{ display: 'flex', alignItems: 'center' }}
//           color="text.primary"
//         >
//           <GrainIcon sx={{ mr: 0.5 }} fontSize="inherit" />
//           Breadcrumb
//         </Typography>
//       </Breadcrumbs>
//     </div>
//   );
// }
