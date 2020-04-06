import csv from 'csvtojson'
import {writeDataToFile, relativePathToRoot} from './utils.mjs'

const populationTotalPath = relativePathToRoot(
  './data/world_population_total/API_SP.POP.TOTL_DS2_en_csv_v2_887275.csv',
)

const getLatestPopulation = (populationItem) => {
  for (let index = 2020; index > 1960; index--) {
    const value = populationItem[index.toString()]
    if (value) return value
  }
  //   console.error(
  //     `We didn't find any population for this country ${populationItem['Country Name']} ${populationItem['Country Code']}`,
  //   )
}

export default async function getPopulationTotalsByISO() {
  const populationTotalArray = await csv().fromFile(populationTotalPath)

  const result = []
  populationTotalArray.forEach((item) => {
    const countryCode = item['Country Code']
    const latestPopulationTotal = getLatestPopulation(item)
    if (!latestPopulationTotal) {
      console.warn(
        'No population total for this country, dropping it:',
        item['Country Name'],
      )
      return
    }
    if (!countryCode) {
      console.warn(
        'No country code for this item, dropping population',
        item['Country Name'],
        latestPopulationTotal,
      )
      return
    }

    result[countryCode] = latestPopulationTotal
  })
  return result
}
