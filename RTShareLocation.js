var params = {};
var type = "server";
if (location.search) {
    var parts = location.search.substring(1).split('&');

    for (var i = 0; i < parts.length; i++) {
        var nv = parts[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }
}

var map;
function initialise() {
	document.getElementById('info').innerHTML = "Initializing...";
	var latlng = new google.maps.LatLng(-25.363882,131.044922);
	var myOptions = {
		zoom: 4,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		disableDefaultUI: true
	}
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
}
initialise();
// Now you can get the parameters you want like so:
var serverid = params.serverid;
if(serverid == undefined){
    console.log("serverid is undefined, assumin server");
    Server();
}else{
    console.log("serverid="+ serverid + ", assuming Client");
    Client();
}



function Server(){
	type = "server";
	document.getElementById('info').innerHTML = "Hi i'm a server!";
	//Network
	document.title = "Server";
    serverid = "PS" + Math.floor((Math.random() * 10000000000000) + 1);
    console.log(serverid);

    var img = document.getElementById("gameQRCode");
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + document.URL + "?serverid="+ serverid;
    
    var peer = new Peer(serverid, {key: 'pyvnsf5mod23mcxr'}); 

    document.getElementById('info').innerHTML = "waiting to receive location from clients...";
    //Debug
    peer.on('connection', function(conn) {
        conn.on('data', function(data){
            if(data.type == "geo"){
                //document.getElementById('info').innerHTML = "mouse: " + data.x + "," + data.y;
                positionSuccess(data.pos);
                document.getElementById('info').innerHTML = "Got new location from user!";
            }  
            //console.log(data);
        });
    });
    //Map
}

function Client(){
	type = "client";
	document.title = "Client";
    var peer = new Peer({key: 'pyvnsf5mod23mcxr'}); 

    var conn = peer.connect(serverid);
    conn.on('open', function(id){
    	document.getElementById('info').innerHTML = "Connected to server!";
        console.log('My peer ID is: ' + id);
    });

    //Not in use
    peer.on('connection', function(conn) {
        conn.on('data', function(data){
            console.log(data);
        });
    });

    //Initi Geolocation once
	prepareGeolocation();

	//Render map and send to server
    window.setInterval(function () {
    	document.getElementById('info').innerHTML = "Setting location...";
    	doGeolocation();
    }, 1000);
}





function doGeolocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(positionSuccess, positionError);
	} else {
	  	positionError(-1);
	}
}

function positionError(err) {
	var msg;
	switch(err.code) {
	  	case err.UNKNOWN_ERROR:
	    	msg = "Unable to find your location";
	    break;
	  	case err.PERMISSION_DENINED:
	    	msg = "Permission denied in finding your location";
	    break;
	  	case err.POSITION_UNAVAILABLE:
	    	msg = "Your location is currently unknown";
	    break;
	  	case err.BREAK:
	    	msg = "Attempt to find location took too long";
	    break;
	  	default:
	    	msg = "Location detection not supported in browser";
	}
	document.getElementById('info').innerHTML = msg;
}

function positionSuccess(position) {
	if( type == "client" ){ //if Client, send data to server
		document.getElementById('info').innerHTML = "Sending location!";
		data = {
		type:"geo",
		pos:position
		}
	 	conn.send(data);
	}
	
	// Centre the map on the new location
	var coords = position.coords || position.coordinate || position;
	var latLng = new google.maps.LatLng(coords.latitude, coords.longitude);

	map.setCenter(latLng);
	map.setZoom(12);

	var marker = new google.maps.Marker({
		map: map,
		position: latLng,
		title: 'Why, there you are!'
	});

	document.getElementById('info').innerHTML = 'Looking for <b>' + coords.latitude + ', ' + coords.longitude + '</b>...';

	// And reverse geocode.
	(new google.maps.Geocoder()).geocode({latLng: latLng}, function(resp) {
	  	var place = "You're around here somewhere!";
	  	if (resp[0]) {
		  	var bits = [];
		  	for (var i = 0, I = resp[0].address_components.length; i < I; ++i) {
			  	var component = resp[0].address_components[i];
			  	if (contains(component.types, 'political')) {
				  	bits.push('<b>' + component.long_name + '</b>');
				}
			}
			if (bits.length) {
				place = bits.join(' > ');
			}
			marker.setTitle(resp[0].formatted_address);
		}
		document.getElementById('info').innerHTML = place;
	});
}

function contains(array, item) {
  	for (var i = 0, I = array.length; i < I; ++i) {
	  	if (array[i] == item) return true;
	}
	return false;
}
