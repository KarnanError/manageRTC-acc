declare module 'react-country-state-city' {
  export function GetCountries(): Promise<any>;
  export function GetState(countryId: number | string): Promise<any>;
}
