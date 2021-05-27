//Global vars and constants:
const COORD_PRECISION = 5;
const FREQ_PER_ANT = 6;
const EPS = 0.000001;

var currentAntennaId = 0;

var totFreq = 60;

var antennas = [];
var OverlapCoff = [];
var OverlapMat = [];
var inf_res = [];

var firstAntennaSel = document.getElementById("first_antenna");
var secondAntennaSel = document.getElementById("second_antenna");

//input fields
var inpId = document.getElementById("id-antenna");
var inpLat = document.getElementById("value-lat");
var inpLng = document.getElementById("value-lon");
var inpFreq = document.getElementById("input-freq");
var inpTotalFreq = document.getElementById("input-tot-freq");
var inpRadius = document.getElementById("input-rad");
var inpColor = document.getElementById("color");

//Initializing the map, sidebar and buttons..etc
const map = L.map('map').setView([47.642371, 6.851110], 15);
L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=dcQ5cdX7CXVu82p2BXzD').addTo(map);

var sidebar = L.control.sidebar('sidebar').addTo(map);
map.addControl(sidebar);

const search = new GeoSearch.GeoSearchControl({
  provider: new GeoSearch.OpenStreetMapProvider(),
});
map.addControl(search);

var antennaIcon = L.icon({
  iconUrl: '../img/antenna.png',
  iconSize: [60, 60], // size of the icon
  iconAnchor: [30, 60], // point of the icon which will correspond to marker's location
  popupAnchor: [60, 60] // point from which the popup should open relative to the iconAnchor
});
//toggle button to show and hide assigned frequencies
var toggle = L.easyButton({
  states: [{
    stateName: 'add-markers',
    icon: 'fa-map-marker',
    title: 'add random markers',
    onClick: function(control) {
      sidebar.close();
      showFrequencies();
      control.state('remove-markers');
    }
  }, {
    icon: 'fa-undo',
    stateName: 'remove-markers',
    onClick: function(control) {
      hidePopup();
      control.state('add-markers');
    },
    title: 'remove markers'
  }]
});
toggle.addTo(map);

//click on map to add an antenna
map.on('click', function(e) {
  showForm(e);
});


function addPopup(antenna) {
  var html = `<div class="wrap">` +
    `<div class="form-result">` +
    `ID = ` + antenna.id + `<br>` +
    `Frequencies :`;
  for (var i = 0; i < antenna.res.length; i++) {
    html += `F` + antenna.res[i] + `, `;
  }
  if (antenna.res.length > 0) {
    html = html.substr(0, html.length - 2);
  }
  if (antenna.res.length == FREQ_PER_ANT - 1) {
    html += '\n';
  }
  html += `</div>` +
    `</div>`
  antenna.popup = L.popup()
    .setLatLng([antenna.lat, antenna.lng])
    .setContent(html)
    .addTo(map)
    .openOn(map);
}


function showForm(e) {
  sidebar.close();
  hidePopup();
  toggle.state('add-markers');
  var antenna = antennas.find(o => o.lat.toFixed(COORD_PRECISION) == e.latlng.lat.toFixed(COORD_PRECISION) && o.lng.toFixed(COORD_PRECISION) == e.latlng.lng.toFixed(COORD_PRECISION));
  if (!(typeof antenna === 'undefined')) {
    sidebar.open('home');
    currentAntennaId = antennas.indexOf(antenna);
    antenna.id = currentAntennaId;
    fill(antenna);
  } else {
    var antenna = new Antenna(e.latlng);

    currentAntennaId = antennas.length;
    antenna.id = antennas.length;

    firstAntennaSel.options[firstAntennaSel.options.length] = new Option(currentAntennaId, currentAntennaId);
    secondAntennaSel.options[secondAntennaSel.options.length] = new Option(currentAntennaId, currentAntennaId);
    antenna.marker = new L.marker(e.latlng, {
      icon: antennaIcon,
      contextmenu: true
    }).on('click', showForm).addTo(map);
    antennas.push(antenna);
  }
}

function fill(antenna) {
  inpId.textContent = antenna.id;
  inpLat.textContent = antenna.lat;
  inpLng.textContent = antenna.lng;
  inpFreq.value = antenna.freq_num;
  inpRadius.value = antenna.radius;
  inpColor.value = antenna.color;
}

function checkInputFields() {
  var isValid = true;
  if (inpRadius.value == '' || parseInt(inpRadius.value, 10) < 0) {
    inpRadius.setCustomValidity("Please enter a non-negative number");
    inpRadius.reportValidity();
    isValid = false;
  }
  if (inpFreq.value == '' || parseInt(inpFreq.value, 10) < 1 || parseInt(inpFreq.value, 10) > FREQ_PER_ANT) {
    inpFreq.setCustomValidity("Please enter a number in [1, 6]");
    inpFreq.reportValidity();
    isValid = false;
  }

  if (inpTotalFreq.value == '' || parseInt(inpTotalFreq.value, 10) < 60) {
    inpTotalFreq.setCustomValidity("Please enter a number >= 60");
    inpTotalFreq.reportValidity();
    isValid = false;
  }
  return isValid;
}

function read() {
  if (!checkInputFields()) return;
  antennas[currentAntennaId].freq_num = parseInt(inpFreq.value, 10);
  totFreq = parseInt(inpTotalFreq.value, 10);
  antennas[currentAntennaId].radius = parseInt(inpRadius.value, 10);
  antennas[currentAntennaId].color = inpColor.value;
  if (antennas[currentAntennaId].circle != null)
    removePrevCoverage(antennas[currentAntennaId]);
  showCoverage(antennas[currentAntennaId]);
}

function showCoverage(antenna) {
  antenna.circle = L.circle([antenna.lat, antenna.lng], {
    fillColor: antenna.color,
    fillOpacity: 0.25,
    radius: antenna.radius
  }).addTo(map);
}

function showFrequencies() {
  for (var i = 0; i < antennas.length; ++i) {
    if (antennas[i].popup == null)
      addPopup(antennas[i]);
    else
      antennas[i].popup.openOn(map);
  }
}

function initAntennas() {
  var i, a1 = firstAntennaSel.options.length - 1,
    a2 = secondAntennaSel.options.length - 1;;
  for (i = a1; i >= 0; i--) {
    firstAntennaSel.remove(i);
  }

  for (i = a2; i >= 0; i--) {
    secondAntennaSel.remove(i);
  }

  for (i = 0; i < antennas.length; i++) {
    antennas[i].id = i;
    firstAntennaSel.options[i] = new Option(i, i);
    secondAntennaSel.options[i] = new Option(i, i);

  }
}

function deleteAntenna() {
  if (currentAntennaId >= 0 && antennas.length > 0) {
    if (antennas[currentAntennaId].marker != null) {
      map.removeLayer(antennas[currentAntennaId].marker);
    }
    if (antennas[currentAntennaId].circle != null) {
      map.removeLayer(antennas[currentAntennaId].circle);
    }
    if (antennas[currentAntennaId].popup != null) {
      map.closePopup(antennas[currentAntennaId].popup);
    }
    antennas.splice(currentAntennaId, 1);
    initAntennas();
    currentAntennaId--;
  }
}

//get Interfeance between two antennas

var antenna1 = document.getElementById("first_antenna");
var antenna2 = document.getElementById("second_antenna");
var result = document.getElementById("res_interference");

function getInf() {
  var ant1 = antenna1.value;
  var ant2 = antenna2.value;
  if (typeof inf_res[ant1][ant2] === 'undefined')
    result.innerHTML = 'There is no interference';
  else
    result.innerHTML = inf_res[ant1][ant2];
}

function hidePopup() {
  map.closePopup();
  for (var i = 0; i < antennas.length; ++i) {
    if (antennas[i].popup != null) {
      map.closePopup(antennas[i].popup);
      antennas[i].popup = null;
    }
  }
}

function addAntenna() {
  read();
}

function removePrevCoverage(antenna) {
  map.removeLayer(antenna.circle);
  antenna.circle = null;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

function calculateDist() {
  var length = antennas.length;
  if (length == 0) {
    alert("No antennas present");
  } else {
    for (var i = 0; i < length; i++) {
      antennas[i].res = [];
    }
    OverlapCoff = [];
    OverlapMat = [];
    inf_res = [];
    checkOverlap();
    alert("Frequencies Allocated");
    showFrequencies();
  }
}

function calculateInt(mat) {
  var f_dist = 0;
  var tot_f_dist = 0;
  var tot_inf = 0;
  var dist = 0;
  var dist_abs = 0;
  for (var h = 0; h < antennas.length; h++) {
    inf_res[h] = new Array(antennas.length);
  }
  for (var i = 0; i < antennas.length; i++) {
    for (var j = 0; j < antennas.length; j++) {
      if (mat[i][j] == 1) {
        for (var k = 0; k < antennas[i].res.length; k++) {
          for (var l = 0; l < antennas[j].res.length; l++) {
            f_dist = antennas[i].res[k] - antennas[j].res[l];
            dist_abs += Number(Math.abs(f_dist));
            console.log(" Frequency distance: " + dist_abs + " adding " + Math.abs(f_dist))
          }
        }
        console.log(" Distance total anteena Frequncy  = " + i + "And " + j)
        console.log(dist_abs)
        dist = Number(getDistanceFromLatLonInKm(antennas[i].lat, antennas[i].lng, antennas[j].lat, antennas[j].lng));
        console.log(" Distance between anteenas  = ")
        console.log(dist)
        tot_inf = (OverlapCoff[i][j] / (EPS + dist_abs));
        console.log(" Total interference between anteenas  = ")
        console.log(tot_inf);
        inf_res[i][j] = Number(tot_inf);
        dist_abs = 0;
      }
    }
  }
}

function assignFreq(seq) {
  var used_freq = [];
  var start_num = 1;
  var frequency = 0;
  var count = 0;
  var done = false;
  var satisfied = false;
  var f_num = 0;
  for (var i = 0; i < seq.length; i++) {
    used_freq = [];
    for (var j = 0; j < OverlapMat.length; j++) {
      console.log('overlap :');
      if (OverlapMat[seq[i]][j] == 1) {
        console.log('overlap inside');
        for (var k = 0; k < antennas[j].res.length; k++) {
          if (!used_freq.includes(antennas[j].res[k])) {
            console.log(typeof antennas[j].res[k]);
            used_freq.push(antennas[j].res[k]);
            console.log('here');
          }
        }
      }
    }
    console.log('used freq = ');
    console.log(used_freq);
    done = false;
    satisfied = false;
    f_num = antennas[seq[i]].freq_num;
    count = 0;
    if (!f_num == 0) {
      while (!done) {
        frequency = start_num;
        while (frequency <= totFreq && !satisfied) {
          if (used_freq.includes(frequency)) {
            frequency += 3;
            if (frequency > totFreq) {
              if (start_num == 3)
                done = true;
              else
                start_num++;
            }
          } else {
            antennas[seq[i]].res.push(frequency);
            console.log('pushed');
            frequency += 3;
            f_num--;
            count++;
            if (f_num == 0) {
              satisfied = true;
              done = true;
            }
          }
        }
      }
    }
  }
  printResult();
}

function printResult() {
  console.log("Result :");
  for (var i = 0; i < antennas.length; i++) {
    console.log("id " + i);
    console.log(antennas[i].res);
  }
  calculateInt(OverlapMat);
  console.log('Interfereance matrix =');
  console.log(inf_res);

}

function checkOverlap() {
  var dist = 0;
  var rad_tot = 0; // total radius of between 2 antennas r1 + r2 = rad_tot
  var arrText = '';
  var s = 0;
  var sum = [];
  for (var i = 0; i < antennas.length; i++) {
    OverlapCoff[i] = new Array(antennas.length);
    OverlapMat[i] = new Array(antennas.length);

  }

  // Loop to initialize 2D array elements.
  for (var i = 0; i < antennas.length; i++) {
    for (var j = 0; j < antennas.length; j++) {
      dist = getDistanceFromLatLonInKm(antennas[i].lat, antennas[i].lng, antennas[j].lat, antennas[j].lng);
      rad_tot = (antennas[i].radius + antennas[j].radius) / 1000;
      if (dist < rad_tot) {
        if (dist == 0) {
          OverlapCoff[i][j] = 0;
          OverlapMat[i][j] = 0;
        } else {
          OverlapCoff[i][j] = parseFloat(Math.abs(rad_tot - dist).toFixed(COORD_PRECISION));
          OverlapMat[i][j] = 1;
        }

      } else {
        OverlapCoff[i][j] = 0;
        OverlapMat[i][j] = 0;
      }
    }
  }
  console.log("Overlap Coef: ");
  for (i = 0; i < OverlapCoff.length; i++) {
    for (j = 0; j < OverlapCoff[i].length; j++) {
      s += parseFloat(OverlapCoff[i][j]);
      arrText += OverlapCoff[i][j] + ' ';

    }
    sum.push(s);
    s = 0;
    console.log(arrText);
    arrText = '';
  }
  console.log("Overlap mat")

  console.log(OverlapMat)
  var sum_sort = sum.slice();
  var sum_seq = [];
  var id = 0;
  sum_sort.sort((a, b) => b - a);
  for (var k = 0; k < sum.length; k++) {
    id = sum.indexOf(sum_sort[k]);
    sum_seq.push(id);
    sum[id] = -1;
  }
  console.log('sum :');
  console.log(sum);
  console.log('sum sort :');
  console.log(sum_sort);
  console.log('sum seq :');
  console.log(sum_seq);
  assignFreq(sum_seq);
}

class Antenna {
  constructor(latlng) {
    this.id = -1
    this.lat = latlng.lat;
    this.lng = latlng.lng;
    this.radius = '';
    this.freq_num = '';
    this.circle = null;
    this.marker = null;
    this.res = [] //used till real sequence will be calculated
    this.popup = null
    this.color = '#00a8ff'
  }
};
