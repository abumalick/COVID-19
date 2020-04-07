import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import numeral from 'numeral'
import worldBorderData from '../data/generated_geojson.json'

const MAP_DIV_NAME = 'map'

const data = [
  {
    title: 'Confirmed Cases',
    buttonId: 'confirmed_button',
    geoJsonProperty: 'COVID19_CONF',
    grades: [0, 10, 50, 100, 500, 1000, 1500, 2000, 3000],
    colors: [
      '#FFF0D0',
      '#FFEDA0',
      '#FED976',
      '#FEB24C',
      '#FD8D3C',
      '#FC4E2A',
      '#E31A1C',
      '#BD0026',
      '#800026',
    ],
  },
  {
    title: 'Confirmed Recovered',
    buttonId: 'recover_button',
    geoJsonProperty: 'COVID19_RECO',
    grades: [0, 10, 50, 100, 500, 1000],
    colors: [
      // '#ffffe5',
      // '#f7fcb9',
      '#d9f0a3',
      '#addd8e',
      '#78c679',
      '#41ab5d',
      '#238443',
      '#006837',
      '#004529',
    ],
  },
  {
    title: 'Confirmed Deaths',
    buttonId: 'deaths_button',
    geoJsonProperty: 'COVID19_DEA',
    grades: [0, 10, 50, 100, 250, 500],
    colors: [
      // '#ffffd9',
      // '#edf8b1',
      '#c7e9b4',
      '#7fcdbb',
      '#41b6c4',
      '#1d91c0',
      '#225ea8',
      '#253494',
      '#081d58',
    ],
  },
]
const STATE_CONFIRMED = 0
const STATE_DEATHS = 1
const STATE_RECOVERED = 2

let CURRENT_STATE = STATE_CONFIRMED

function getColor(d) {
  if (Number.isNaN(d)) {
    return undefined
  }
  const currentData = data[CURRENT_STATE]
  const {colors, grades} = currentData
  for (let index = grades.length - 1; index >= 0; index--) {
    if (d > grades[index]) {
      return colors[index]
    }
  }
}

function style(feature) {
  const cases = numeral(feature.properties[data[CURRENT_STATE].geoJsonProperty])
  const population = numeral(feature.properties['POP_EST'])
  const casesPerMillionPopulation = Math.round(
    cases.multiply(1000000).divide(population.value()).value(),
  )
  return {
    fillColor: getColor(casesPerMillionPopulation),
    weight: 0,
    color: 'white',
    fillOpacity: 0.5,
  }
}

const map = L.map(MAP_DIV_NAME).setView([35, 0], 2)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  detectRetina: true,
}).addTo(map)

const info = L.control({position: 'bottomright'})

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info') // create a div with a class "info"
  this.update()
  return this._div
}

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  if (!props) {
    this._div.classList.add('hidden')
    return
  }
  let innerHTML = `<h4>${props['NAME']}</h4>`
  const population = numeral(props['POP_EST'])
  innerHTML += `<b>Population Estimation</b><br />`
  innerHTML += population.format('0,0')
  ;+'<br />'
  data.forEach((item) => {
    const total = numeral(props[item.geoJsonProperty])
    innerHTML += `<br /><b>${item.title}</b><br />`
    innerHTML += total.format('0,0') + ' cases<br />'
    innerHTML +=
      total
        .multiply(1000000)
        .divide(population.value())
        .format('0,0', Math.round) + ' cases per million'
  })

  this._div.innerHTML = innerHTML
  this._div.classList.remove('hidden')
}

info.addTo(map)

function handleMouseOver(e) {
  e.target.setStyle({
    weight: 1,
  })
  info.update(e.target.feature.properties)
}

function handleMouseOut(e) {
  e.target.setStyle({
    weight: 0,
  })
  info.update()
}

function click(e) {
  info.update(e.target.feature.properties)
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: handleMouseOver,
    mouseout: handleMouseOut,
    click: click,
  })
}

const addLayer = () => {
  return L.geoJson(worldBorderData, {style, onEachFeature}).addTo(map)
}
let layer = addLayer()

let legend = L.control({position: 'topright'})

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend')
  const currentData = data[CURRENT_STATE]
  const {grades, title} = currentData
  div.innerHTML += `<h1>COVID-19</h1>`
  div.innerHTML += `<h3>${title}</h3>`
  div.innerHTML += `<div class="subtitle">Per million inhabitant</div>`
  // loop through our density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' +
      getColor(grades[i] + 1) +
      '"></i> ' +
      grades[i] +
      (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+')
  }

  return div
}

legend.addTo(map)

const redraw = () => {
  map.removeLayer(layer)
  layer = addLayer()
  map.removeLayer(legend)
  legend.addTo(map)
}

const activeButtonClass = 'switcher_div__button--active'
const titleSubject = document.querySelector('#title_subject')

data.forEach((item, index) => {
  const button = document.querySelector('#' + item.buttonId)
  button.onclick = () => {
    const prevButton = document.querySelector(
      '#' + data[CURRENT_STATE].buttonId,
    )
    prevButton.classList.remove(activeButtonClass)
    CURRENT_STATE = index
    titleSubject.innerHTML = item.title.toLowerCase()
    redraw()
    button.classList.add(activeButtonClass)
  }
})
