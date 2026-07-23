import React from 'react';
import type {NextPage} from 'next';

export const withPageAccessCheck = (Page: NextPage) => {
  const WrappedComponent = (props: any) => {
    const getLayout = Page.getLayout ?? ((page) => page);

    // TODO THIS NEEDS FIXING
    // const {canAccess, loading, ready} = useUserPermissions();
    //
    // if (Page.restrictAccess) {
    //   if (loading || !ready) {
    //     return getLayout(<div></div>);
    //   }
    //   const subject = Page.subject;
    //   if (!subject) {
    //     return getLayout(<UnauthorisedPage/>);
    //   }
    //   if (!canAccess(subject)) {
    //     return getLayout(<UnauthorisedPage/>);
    //   }
    // }

    return getLayout(<Page {...props} />);
  };

  // Set the displayName for your HOC
  WrappedComponent.displayName = `withAccessCheck(${Page.displayName || Page.name || 'Component'})`;

  return WrappedComponent;
};
