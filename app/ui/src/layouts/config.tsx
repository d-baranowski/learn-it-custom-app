import type { ReactNode } from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import { paths } from 'src/paths';
import _ from 'lodash';
import HomeIcon from '@mui/icons-material/Home';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { useUserPermissions } from '~/providers/user-permissions';
import { useDevToolsEnabled } from '~/providers/dev-tools';
import { Permission, Permissions } from '@gen/permissions';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BugReportIcon from '@mui/icons-material/BugReport';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CategoryIcon from '@mui/icons-material/Category';
import ApartmentIcon from '@mui/icons-material/Apartment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaymentIcon from '@mui/icons-material/Payment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

export interface Item {
  disabled?: boolean;
  external?: boolean;
  icon?: ReactNode;
  items?: Item[];
  label?: ReactNode;
  path?: string;
  title: string;
  permission?: Permission;
  description?: string;
  /** Only rendered when ENABLE_DEV_TOOLS is on for the environment. */
  devToolsOnly?: boolean;
}

export interface Section {
  items: Item[];
  subheader?: string;
  id?: string; // Unique identifier for the section
}

export const sections: Section[] = [
  {
    items: [
      {
        title: 'Home Screen',
        path: paths.homeScreen.index(),
        icon: (
          <SvgIcon fontSize="small">
            <HomeIcon />
          </SvgIcon>
        ),
        description:
          'Overview of system sections and quick access to key features',
      },
      {
        title: 'Customer',
        path: paths.core.customer(),
        icon: (
          <SvgIcon fontSize="small">
            <PersonOutlineIcon />
          </SvgIcon>
        ),
        permission: Permissions.Customer,
        description: 'Manage customer information and profiles',
      },
      {
        title: 'Schedule',
        icon: (
          <SvgIcon fontSize="small">
            <CalendarMonthIcon />
          </SvgIcon>
        ),
        description:
          'Schedule and manage therapy sessions, calendars, and appointments',
        items: [
          {
            title: 'Therapy',
            path: paths.core.therapy(),
            permission: Permissions.Therapy,
            description: 'Manage therapy programs and treatments',
            icon: <SvgIcon fontSize="small"><PsychologyIcon /></SvgIcon>,
          },
          {
            title: 'Session',
            path: paths.core.session(),
            permission: Permissions.Session,
            description: 'View and manage individual therapy sessions',
            icon: <SvgIcon fontSize="small"><EventNoteIcon /></SvgIcon>,
          },
          {
            title: 'Session Issues',
            path: paths.core.sessionIssues(),
            description: 'Track and resolve session-related issues',
            icon: <SvgIcon fontSize="small"><WarningAmberIcon /></SvgIcon>,
          },
          {
            title: 'Therapist Calendar',
            path: paths.core.therapistCalendar(),
            description: 'View therapist schedules and availability',
            icon: <SvgIcon fontSize="small"><CalendarMonthIcon /></SvgIcon>,
          },
          {
            title: 'Room Calendar',
            path: paths.core.roomCalendar(),
            description: 'Manage room bookings and availability',
            icon: <SvgIcon fontSize="small"><MeetingRoomIcon /></SvgIcon>,
          },
        ],
      },
      {
        title: 'Therapist Management',
        icon: (
          <SvgIcon fontSize="small">
            <GroupOutlinedIcon />
          </SvgIcon>
        ),
        description:
          'Manage therapist profiles, services, schedules, and assignments',
        items: [
          {
            title: 'Therapist',
            path: paths.core.therapist(),
            permission: Permissions.Therapist,
            description: 'Manage therapist profiles and information',
            icon: <SvgIcon fontSize="small"><PersonOutlineIcon /></SvgIcon>,
          },
          {
            title: 'Therapist Service',
            path: paths.core.therapistService(),
            permission: Permissions.TherapistService,
            description: 'Assign services to therapists',
            icon: <SvgIcon fontSize="small"><MedicalServicesIcon /></SvgIcon>,
          },
          {
            title: 'Therapist Working Hours',
            path: paths.core.workingHours(),
            permission: Permissions.WorkingHours,
            description: 'Set therapist working hours and schedules',
            icon: <SvgIcon fontSize="small"><ScheduleIcon /></SvgIcon>,
          },
          {
            title: 'Therapist Absences',
            path: paths.core.absence(),
            permission: Permissions.Absence,
            description: 'Manage therapist absences and time off',
            icon: <SvgIcon fontSize="small"><EventBusyIcon /></SvgIcon>,
          },
          {
            title: 'View Availability',
            path: paths.core.workingHoursView(),
            description: 'View therapist availability across the organization',
            icon: <SvgIcon fontSize="small"><VisibilityIcon /></SvgIcon>,
          },
          {
            title: 'Therapist Customer',
            path: paths.core.therapistCustomer(),
            permission: Permissions.TherapistCustomer,
            description: 'Manage therapist-customer assignments',
            icon: <SvgIcon fontSize="small"><HandshakeIcon /></SvgIcon>,
          },
        ],
      },
      {
        title: 'Core Data',
        icon: (
          <SvgIcon fontSize="small">
            <EngineeringIcon />
          </SvgIcon>
        ),
        description:
          'Manage fundamental system data including services, offices, and rooms',
        items: [
          {
            title: 'Service',
            path: paths.core.service(),
            permission: Permissions.Service,
            description: 'Manage therapy services offered',
            icon: <SvgIcon fontSize="small"><CategoryIcon /></SvgIcon>,
          },
          {
            title: 'Office',
            path: paths.core.office(),
            permission: Permissions.Office,
            description: 'Manage office locations',
            icon: <SvgIcon fontSize="small"><ApartmentIcon /></SvgIcon>,
          },
          {
            title: 'Room',
            path: paths.core.room(),
            permission: Permissions.Room,
            description: 'Manage therapy rooms and facilities',
            icon: <SvgIcon fontSize="small"><MeetingRoomIcon /></SvgIcon>,
          },
          {
            title: 'System Settings',
            path: paths.core.systemSettings(),
            permission: Permissions.SystemSettings,
            description: 'Manage system-wide settings and configuration',
            icon: <SvgIcon fontSize="small"><SettingsIcon /></SvgIcon>,
          },
          {
            title: 'Notifications',
            path: paths.core.notification(),
            permission: Permissions.Notification,
            description: 'View dispatched notifications and send new ones',
            icon: <SvgIcon fontSize="small"><NotificationsIcon /></SvgIcon>,
          },
          {
            title: 'Notification Templates',
            path: paths.core.notificationTemplate(),
            permission: Permissions.NotificationTemplate,
            description: 'Manage notification templates and their variants',
            icon: <SvgIcon fontSize="small"><NotificationsIcon /></SvgIcon>,
          },
        ],
      },
      {
        title: 'Accounting',
        icon: (
          <SvgIcon fontSize="small">
            <AccountBalanceIcon />
          </SvgIcon>
        ),
        description:
          'Financial management including income tracking, transactions, and cashflows',
        items: [
          {
            title: 'Financial Overview',
            path: paths.core.financialOverview(),
            permission: Permissions.Transaction,
            description:
              'View monthly income, therapist earnings, and financial breakdown',
            icon: <SvgIcon fontSize="small"><BarChartIcon /></SvgIcon>,
          },
          {
            title: 'Payment Link',
            path: paths.core.paymentLink(),
            permission: Permissions.PaymentLink,
            description: 'Browse payment links without opening session detail forms',
            icon: <SvgIcon fontSize="small"><PaymentIcon /></SvgIcon>,
          },
          {
            title: 'Recurring Cashflows',
            path: paths.core.recurringCashflow(),
            permission: Permissions.RecurringCashflow,
            description: 'Manage recurring income and expenses',
            icon: <SvgIcon fontSize="small"><AutorenewIcon /></SvgIcon>,
          },
          {
            title: 'Transactions',
            path: paths.core.transaction(),
            permission: Permissions.Transaction,
            description: 'View and manage financial transactions',
            icon: <SvgIcon fontSize="small"><ReceiptIcon /></SvgIcon>,
          },
        ],
      },
      {
        title: 'User Management',
        icon: (
          <SvgIcon fontSize="small">
            <GroupOutlinedIcon />
          </SvgIcon>
        ),
        description: 'Manage system users, roles, and permissions',
        items: [
          {
            title: 'Users',
            path: paths.system.users.index(),
            permission: Permissions.User,
            description: 'Manage user accounts',
            icon: <SvgIcon fontSize="small"><PersonOutlineIcon /></SvgIcon>,
          },
          {
            title: 'Roles',
            path: paths.system.users.roles.index(),
            permission: Permissions.Role,
            description: 'Define and manage user roles',
            icon: <SvgIcon fontSize="small"><AdminPanelSettingsIcon /></SvgIcon>,
          },
          {
            title: 'User Roles',
            path: paths.system.users.userRoles.index(),
            permission: Permissions.UserRole,
            description: 'Assign roles to users',
            icon: <SvgIcon fontSize="small"><ManageAccountsIcon /></SvgIcon>,
          },
          {
            title: 'Permissions',
            path: paths.system.users.permissions.index(),
            permission: Permissions.Permission,
            description: 'Configure system permissions',
            icon: <SvgIcon fontSize="small"><VpnKeyIcon /></SvgIcon>,
          },
        ],
      },
      {
        title: 'Issues and Suggestions',
        path: paths.core.issuesAndSuggestions(),
        icon: (
          <SvgIcon fontSize="small">
            <BugReportIcon />
          </SvgIcon>
        ),
        permission: Permissions.IssuesAndSuggestions,
        description: 'Report and track issues, bugs, and feature suggestions',
      },
      {
        title: 'Dev Tools',
        // Filtered out by useSections() unless ENABLE_DEV_TOOLS is on for this
        // environment. pages/dev-tools.tsx 404s independently — hiding a nav
        // item is cosmetic, not a control.
        devToolsOnly: true,
        path: paths.devTools(),
        icon: (
          <SvgIcon fontSize="small">
            <BuildIcon />
          </SvgIcon>
        ),
        description: 'Database reset and bootstrap tools (staging only)',
      },
    ],
  },
];

export const useSections = () => {
  const { canAccess } = useUserPermissions();
  const devToolsEnabled = useDevToolsEnabled();

  function filterItems(items: Item[]): Item[] {
    return _.cloneDeep(items)
      .filter((item) => (item.devToolsOnly ? devToolsEnabled : true)) // Hide dev-only entries when the flag is off
      .filter((item) => (item.permission ? canAccess(item.permission) : true)) // Filter out items that cannot be accessed
      .map((item) => ({
        ...item,
        items: item.items ? filterItems(item.items) : undefined, // Recursively filter child items
      }))
      .filter((item) => (item.items && item.items?.length > 0) || !item.items); // Remove items with empty child items array
  }

  function filterSections(sections: Section[]): Section[] {
    return sections.map((section) => ({
      ...section,
      items: filterItems(section.items), // Filter the items in each section
    }));
  }

  let s = _.cloneDeep(sections);
  s = filterSections(s);

  return s;
};
