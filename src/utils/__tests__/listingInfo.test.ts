import { listingInfoFlags, listingMealInfoFlags } from '../listingInfo';

describe('listingInfoFlags', () => {
  it('marks contact, address, map, rent, amenities and food when present', () => {
    expect(
      listingInfoFlags({
        hasContact: true,
        address: 'Hinjewadi Rajiv Gandhi Infotech Park',
        mapUrl: 'https://maps.google.com/?q=Hinjewadi',
        startingPrice: 8000,
        amenityCodes: ['WIFI', 'FOOD_INCLUDED'],
        foodIncludedInRent: true,
      }),
    ).toEqual({
      contact: true,
      address: true,
      map: true,
      rent: true,
      amenities: true,
      food: true,
    });
  });

  it('does not treat coordinates as map availability', () => {
    expect(
      listingInfoFlags({
        hasContact: true,
        addressLine: 'Aundh Road, Pune',
        mapUrl: '',
        startingPrice: null,
        amenityCodes: [],
      }),
    ).toEqual({
      contact: true,
      address: true,
      map: false,
      rent: false,
      amenities: false,
      food: false,
    });
  });

  it('treats missing contacts and zero rent as unavailable information', () => {
    expect(
      listingInfoFlags({
        hasContact: false,
        address: 'Balewadi High Street',
        mapUrl: undefined,
        startingPrice: 0,
        amenityCodes: ['FOOD_INCLUDED'],
        foodIncludedInRent: false,
      }),
    ).toEqual({
      contact: false,
      address: true,
      map: false,
      rent: false,
      amenities: false,
      food: true,
    });
  });

  it('uses addressLine when address is empty', () => {
    expect(
      listingInfoFlags({
        hasContact: true,
        address: '',
        addressLine: 'Kothrud, Pune',
      }).address,
    ).toBe(true);
  });

  it('treats mess monthly and meal prices as price information', () => {
    expect(
      listingInfoFlags({
        hasContact: false,
        addressLine: 'Devi Chowk, Hinjawadi 411057',
        monthlyPrice: 3500,
        mealPrice: 90,
      }).rent,
    ).toBe(true);
  });

  it('shows meal extras only when those fields exist', () => {
    expect(
      listingMealInfoFlags({
        hasContact: true,
        addressLine: 'Devi Chowk, Hinjawadi 411057',
        mapUrl: '',
        mealPrice: 90,
        mealsServed: ['LUNCH'],
        foodType: 'Vegetarian',
        subscription: 'Monthly',
      }),
    ).toEqual({
      contact: true,
      address: true,
      map: false,
      rent: true,
      amenities: false,
      food: false,
      menu: true,
      mealTiming: false,
      foodType: true,
      subscription: true,
    });
  });
});
