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
L.easyButton('&#x00023', function() {
  calculateDist();
}).addTo(map);

map.on('click', function(e) {
  showForm(e);
});


function addMarker(e) {
  sidebar.close();
  hidePopup();
  newMarker = new L.marker(e.latlng, {
    contextmenu: true,
    contextmenuItems: [{
      text: 'Circle 1',
      callback: function() {
        alert("tctc");
      }
    }]
  }).on('click', showForm).addTo(map);
}

function addPopup(antenna) {
  antenna.popup = L.popup()
    .setLatLng([antenna.lat, antenna.lng])
    .setContent(`<div class="wrap">
	 <form class="main-form" action="">
	 <div class="form-group"> Assigned Frequencie:\n${antenna.frequencies.toString()} </div>
	</form>
	</div>`)
    .addTo(map)
    .openOn(map);
}


function showForm(e) {
  sidebar.close();
  hidePopup();
  var antenna = antennas.find(o => o.lat.toFixed(coordPrecision) == e.latlng.lat.toFixed(coordPrecision) && o.lng.toFixed(coordPrecision) == e.latlng.lng.toFixed(coordPrecision));
  if (!(typeof antenna === 'undefined')) {
    sidebar.open('home');
    currentAntennaId = antennas.indexOf(antenna);
    fill(antenna);
  } else {
    var antenna = new Antenna(e.latlng);
    document.getElementById("value-lat").textContent = e.latlng.lat.toFixed(coordPrecision);
    document.getElementById("value-lon").textContent = e.latlng.lng.toFixed(coordPrecision);
    currentAntennaId = antennas.length - 1;
    var icon = L.icon ({
      iconUrl: 'icon.png',
      iconSize: [50, 50],
      iconAnchor: [25, 30]
    });
    antenna.marker = L.marker(e.latlng, {icon: icon}).on('click', showForm).addTo(map);
    antennas.push(antenna);
  }
}

function fill(antenna) {
  document.getElementById("value-lat").textContent = antenna.lat;
  document.getElementById("value-lon").textContent = antenna.lng;
  if (antenna.freq_num != '')
    document.getElementById("input-freq").value = antenna.freq_num;
  document.getElementById("input-rad").value = antenna.radius;
  document.getElementById("color").value = antenna.color;
}

function checkInputFields() {
  //TODO: check if input fields are empty
}

function read() {
  antennas[currentAntennaId].freq_num = parseInt(document.getElementById("input-freq").value, 10);
  antennas[currentAntennaId].color = document.getElementById("color").value;
  if (antennas[currentAntennaId].circle != null) {
    removePrevCoverage(antennas[currentAntennaId]);
  }
  if (document.getElementById("input-rad").value != '')
    antennas[currentAntennaId].radius = parseInt(document.getElementById("input-rad").value, 10);
  else antennas[currentAntennaId].radius = 0;
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
    currentAntennaId--;
  }
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
  if (antennas.length == 0) {
    alert("No antennas present");
  } else {
    createTable();
  }
}

function assignFreq() {

}

function checkOverlap() {
  var dist = 0;
  var rad_tot = 0;
  var arrText = '';
  for (var i = 0; i < antennas.length; i++) {
    Overlap_mat[i] = new Array(antennas.length);
  }

  // Loop to initialize 2D array elements.
  for (var i = 0; i < antennas.length; i++) {
    for (var j = 0; j < antennas.length; j++) {
      dist = getDistanceFromLatLonInKm(antennas[i].lat, antennas[i].lng, antennas[j].lat, antennas[j].lng);;
      rad_tot = (antennas[i].radius + antennas[j].radius) / 1000;
      if (dist < rad_tot) {
        Overlap_mat[i][j] = 1;
      } else {
        Overlap_mat[i][j] = 0;
      }
    }
  }
  console.log("Overlap Matrix: ");
  for (i = 0; i < Overlap_mat.length; i++) {
    for (j = 0; j < Overlap_mat[i].length; j++) {
      arrText += Overlap_mat[i][j] + ' ';
    }
    console.log(arrText);
    arrText = '';
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
    this.radius = '';
    this.freq_num = '';
    this.circle = null;
    this.marker = null;
    this.frequencies = [1, 23, 22, 34] //used till real sequence will be calculated
    this.popup = null
    this.color = '#0022FF'
  }
};
