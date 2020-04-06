import csv from 'csvtojson'
import {writeDataToFile, relativePathToRoot} from './utils.mjs'
// import getPopulationTotalsByISO from './getPopulationTotalsByISO.mjs'
import getCovidDataByISO3 from './getCovidDataByISO3.mjs'
import countriesGeoJSON from '../data/countriesGeoJSON.json'

const confirmedTablePath =
  'csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'
const deathsTablePath =
  'csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'
const recoveredTablePath =
  'csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'

const countriesGeoISOCorrection = {
  Kosovo: 'XKS',
  France: 'FRA',
  Somaliland: 'SOM',
  'N. Cyprus': 'CYP',
  Norway: 'NOR',
  Sudan: 'SSD',
}

;(async () => {
  const confirmedDict = await getCovidDataByISO3(confirmedTablePath)
  const deathsDict = await getCovidDataByISO3(deathsTablePath)
  const recoveredDict = await getCovidDataByISO3(recoveredTablePath)
  // const populationTotals = await getPopulationTotalsByISO()
  countriesGeoJSON.features.forEach(({properties}) => {
    let iso3 = properties['ISO_A3']
    const countryName = properties['NAME']
    if (countriesGeoISOCorrection[countryName]) {
      iso3 = countriesGeoISOCorrection[countryName]
    }
    const confirmedCases = confirmedDict[iso3]
    if (confirmedCases !== undefined) {
      properties['COVID19_CONF'] = confirmedCases
    }
    const deathsCases = deathsDict[iso3]
    if (deathsCases !== undefined) {
      properties['COVID19_DEA'] = deathsCases
    }
    const recoveredCases = recoveredDict[iso3]
    if (recoveredCases !== undefined) {
      properties['COVID19_RECO'] = recoveredCases
    }
    if (
      confirmedCases === undefined ||
      deathsCases === undefined ||
      recoveredCases === undefined
    ) {
      console.warn(
        'Dropping for lack of covid data: ',
        iso3,
        countryName,
        ' ( dropping: ',
        confirmedCases === undefined ? 'confirmed,' : '',
        deathsCases === undefined ? 'deaths,' : '',
        recoveredCases === undefined ? 'recovered' : '',
        ')',
      )
    }
  })
  writeDataToFile(countriesGeoJSON, 'data/generated_geojson.json')
})().catch((e) => {
  console.error('CRASH!', e)
})
