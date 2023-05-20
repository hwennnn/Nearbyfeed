export interface Place {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    building: string;
    house_number: string;
    road: string;
    suburb: string;
    city: string;
    county: string;
    'ISO3166-2-lvl6': string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: string[];
}
