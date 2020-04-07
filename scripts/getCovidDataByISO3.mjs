import csv from 'csvtojson'
import {relativePathToRoot} from './utils.mjs'
import numeral from 'numeral'

// Table that contains the country names and ISO3
const lookUpTablePath = relativePathToRoot(
  './csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv',
)

let ISO3ByRegionCache

const iso3Correction = {
  Sudan: 'SSD',
  'Korea, South': 'KOR',
}

const COUNTRIES_MERGE_REGIONS = ['Canada', 'Australia', 'China']

async function getISO3ByRegion() {
  if (ISO3ByRegionCache) return ISO3ByRegionCache
  const lookUpArray = await csv().fromFile(lookUpTablePath)
  ISO3ByRegionCache = {}
  lookUpArray.forEach(({iso2, iso3, Combined_Key, Country_Region, ...rest}) => {
    let correctCountry
    if (COUNTRIES_MERGE_REGIONS.includes(Country_Region)) {
      correctCountry = Country_Region
    } else {
      correctCountry = Combined_Key.split(',')[0] // Fix for countries that depends on european countries
    }

    if (!iso3) {
      return
    }
    if (iso3Correction[correctCountry]) {
      iso3 = iso3Correction[correctCountry]
    }
    if (ISO3ByRegionCache[correctCountry]) return // We already have this country

    ISO3ByRegionCache[correctCountry] = iso3
  })
  // Malawi is missing in lookUp Table
  if (!ISO3ByRegionCache['Malawi']) {
    ISO3ByRegionCache['Malawi'] = 'MWI'
  }
  return Object.assign(ISO3ByRegionCache, iso3Correction)
}

function getLatestDate(item) {
  const keys = Object.keys(item)
  const latestKey = keys[keys.length - 1]
  return latestKey
}

export default async function getCovidDataByISO3(filePath) {
  const ISO3ByRegion = await getISO3ByRegion()
  const timeSeriesArray = await csv().fromFile(relativePathToRoot(filePath))
  const covidDataByISO3 = {}
  const latestDate = getLatestDate(timeSeriesArray[0])
  timeSeriesArray.forEach((item) => {
    const state = item['Province/State']
    const country = item['Country/Region']
    let numberOfCase = item[latestDate]
    let iso3
    if (COUNTRIES_MERGE_REGIONS.includes(country)) {
      iso3 = ISO3ByRegion[country]
      if (covidDataByISO3[iso3]) return
      numberOfCase = timeSeriesArray
        .reduce((acc, _item) => {
          if (_item['Country/Region'] === country) acc.add(_item[latestDate])
          return acc
        }, numeral(0))
        .format('0')
    } else {
      iso3 = ISO3ByRegion[state] || ISO3ByRegion[country]
    }
    if (!iso3) {
      console.warn(
        'No ISO3 for this country, dropping the cases:',
        country,
        numberOfCase,
      )
      return
    }
    covidDataByISO3[iso3] = numberOfCase
  })
  return covidDataByISO3
}
