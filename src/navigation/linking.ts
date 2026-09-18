import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Custom URI scheme deep links (no HTTPS App Links yet).
 * Example: acomi://enquiries/{enquiryId}
 * Opens Main → MyEnquiries with optional enquiryId highlight (same as FCM path).
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['acomi://'],
  config: {
    screens: {
      Main: {
        screens: {
          MyEnquiries: {
            path: 'enquiries/:enquiryId?',
            parse: {
              enquiryId: (value: string) => value,
            },
          },
        },
      },
      Auth: '*',
      Admin: '*',
    },
  },
};
