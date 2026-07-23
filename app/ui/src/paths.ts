export const paths = {
  index: () => '/',
  wip: () => '/wip',

  auth: {
    signIn: () => '/auth/signin',
    signOut: () => '/auth/signout',
  },

  homeScreen: {
    index: () => '/home-screen',
  },

  core: {
    absence: () => '/core/absence',
    workingHours: () => '/core/working-hours',
    workingHoursView: () => '/core/working-hours-view',
    customer: () => '/core/customer',
    financialOverview: () => '/core/financial-overview',
    issuesAndSuggestions: () => '/core/issues-and-suggestions',
    office: () => '/core/office',
    paymentLink: () => '/core/payment-link',
    recurringCashflow: () => '/core/recurring-cashflow',
    room: () => '/core/room',
    roomCalendar: () => '/core/room-calendar',
    service: () => '/core/service',
    session: () => '/core/session',
    sessionIssues: () => '/core/session-issues',
    therapist: () => '/core/therapist',
    therapistCalendar: () => '/core/therapist-calendar',
    therapistCustomer: () => '/core/therapist-customer',
    therapistService: () => '/core/therapist-service',
    therapy: () => '/core/therapy',
    transaction: () => '/core/transaction',
    systemSettings: () => '/core/system-settings',
    notification: () => '/core/notification',
    notificationTemplate: () => '/core/notification-template',
  },

  system: {
    users: {
      index: () => '/users',
      changePassword: () => '/users/change-password',
      permissions: {
        index: () => '/users/permissions',
      },
      roles: {
        index: () => '/users/roles',
      },
      userRoles: {
        index: () => '/users/user_roles',
      },
    },
  },

  me: {
    index: () => '/me',
    bookmarks: () => '/me?tab=bookmarks',
    notifications: () => '/me?tab=notifications',
  },

  devTools: () => '/dev-tools',

  notAuthorized: () => '/401',
  notFound: () => '/404',
  serverError: () => '/500',
};
