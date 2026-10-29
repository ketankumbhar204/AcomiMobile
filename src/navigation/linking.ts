import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Enquiry links and the generic app-open page.
 * Meal-poll https://app.acomi.in URLs are handled by mealPollLink.ts so this
 * config does not claim the rest of the website.
 * Example: acomi://enquiries/{enquiryId}
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['acomi://', 'https://www.acomi.in/open', 'https://acomi.in/open'],
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
