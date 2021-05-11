var antennas = [];
var currentAntennaId = 0;
var coordPrecision = 5;
var tot_freq = 10;
var anteena_seq = [];
var Overlap_mat = new Array(antennas.length);
var circleDrawn;
var map = L.map('map').setView([47.642371, 6.851110], 15);
var newMarker;
L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=dcQ5cdX7CXVu82p2BXzD').addTo(map);
var sidebar = L.control.sidebar('sidebar').addTo(map);
map.addControl(sidebar);

map.on('click', function(e) {
  addMarker(e);
});

function addMarker(e) {
  sidebar.close();
  newMarker = new L.marker(e.latlng).on('click', showForm).addTo(map);
}


function showForm(e) {
  var antenna = antennas.find(o => o.lat.toFixed(coordPrecision) == e.latlng.lat.toFixed(coordPrecision) && o.lng.toFixed(coordPrecision) == e.latlng.lng.toFixed(coordPrecision));
  if (!(typeof antenna === 'undefined')) {
    currentAntennaId = antennas.indexOf(antenna);
    fill(antenna);
  } else {
    var antenna = new Antenna(e.latlng);
    antenna.marker = newMarker;
    antennas.push(new Antenna(e.latlng));
    document.getElementById("value-lat").textContent = e.latlng.lat.toFixed(coordPrecision);
    document.getElementById("value-lon").textContent = e.latlng.lng.toFixed(coordPrecision);
    document.getElementById("input-rad").value = '';
    document.getElementById("input-freq").value = '';
    document.getElementById("input-type").value = '';
    currentAntennaId = antennas.length - 1;
  }
  sidebar.open('home');
}

function fill(antenna) {
  document.getElementById("value-lat").textContent = antenna.lat;
  document.getElementById("value-lon").textContent = antenna.lng;
  document.getElementById("input-type").value = antenna.type;
  document.getElementById("input-freq").value = antenna.freq_num;
  document.getElementById("input-rad").value = antenna.radius;
}

function read() {
  antennas[currentAntennaId].type = document.getElementById("input-type").value;
  antennas[currentAntennaId].freq_num = parseInt(document.getElementById("input-freq").value, 10);
  if(antennas[currentAntennaId].circle != null){
    removePrevCoverage(antennas[currentAntennaId]);
  }
  antennas[currentAntennaId].radius = parseInt(document.getElementById("input-rad").value, 10);
  showCoverage(antennas[currentAntennaId]);
}

function showCoverage(antenna) {
  antenna.circle = L.circle([antenna.lat, antenna.lng], {
    color: 'blue',
    fillColor: '#0022FF',
    fillOpacity: 0.25,
    radius: antenna.radius
  }).addTo(map);
}

function addAntenna() {
  read();
  console.log("add");
}

function removePrevCoverage(antenna){
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
  if (antennas.length == 0) {
    alert("No antennas present");
  } else {
    createTable();
  }
}
function assignFreq(){

}

function checkOverlap(){
  var dist = 0;
  var rad_tot = 0;
  var arrText='';
  for (var i = 0; i < antennas.length; i++) {
    Overlap_mat[i] = new Array(antennas.length);
  }

// Loop to initialize 2D array elements.
  for (var i = 0; i < antennas.length; i++) {
      for (var j = 0; j < antennas.length; j++) {
        dist = getDistanceFromLatLonInKm(antennas[i].lat, antennas[i].lng, antennas[j].lat, antennas[j].lng);;
        rad_tot = (antennas[i].radius + antennas[j].radius)/1000;
        if(dist < rad_tot){
          Overlap_mat[i][j] = 1;
        }
        else{
          Overlap_mat[i][j] = 0;
        }
      }
  }
  console.log("Overlap Matrix: ");
  for (i=0; i < Overlap_mat.length; i++) {
    for (j = 0; j < Overlap_mat[i].length; j++) {
      arrText+=Overlap_mat[i][j]+' ';
    }
    console.log(arrText);
    arrText='';
 }
assignFreq();
}

function createTable() {
  var num_super = 1;
  var num_rows = 3;
  var num_cols = 3;
  var sum_dist = [];
  var sum_sort = [];
  var sum;
  var dist = 0;
  var tbody = '';
  var output = '';
  var colStart = num_cols / num_super;
  for (var i = 0; i < num_super; i++) {
    var theader = '<div><table border="1">\n';
    for (var u = 0; u < antennas.length; u++) {
      sum = 0;
      tbody += '<tr>';
      for (var j = 0; j < antennas.length; j++) {
        tbody += '<td>';
        dist = getDistanceFromLatLonInKm(antennas[u].lat, antennas[u].lng, antennas[j].lat, antennas[j].lng);;
        tbody += dist;
        //console.log("Dist between: " + u + ", " + j + " = " + dist + '\n');
        tbody += '</td>'
        sum += dist;
      }
      sum_dist[u] = sum;
      //console.log("sum of distance from anteena: " + u + ", is: " + sum_dist[u]);
      tbody += '</tr>\n';
    }
    var tfooter = '</table></div>';
    document.getElementById('res_table').innerHTML = theader + tbody + tfooter;
  }
  sum_sort = sum_dist.slice();
  sum_sort.sort((a, b) => a - b)
  console.log(sum_sort);
  for (var k = 0; k < antennas.length; k++) {
    anteena_seq.push(sum_dist.indexOf(sum_sort[k]));
  }
  console.log(anteena_seq);
  checkOverlap();
}



class Antenna {
  constructor(latlng) {
    this.lat = latlng.lat;
    this.lng = latlng.lng;
    this.type = "undefined"
    this.radius = 0
    this.freq_num = 0
    this.circle = null;
    this.marker = null;
  }
};
