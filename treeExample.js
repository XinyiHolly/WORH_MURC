
		var gs = {
			wfs: 'https://web.archive.org/web/20150827104356/http://lab.georepublic.info/geoserver/grp/wfs',
			ows: 'https://web.archive.org/web/20150827104356/http://lab.georepublic.info/geoserver/grp/ows'
		};
		
		// Configure map
		var map, user;
		var markers = [];
		
		var poiIcon = L.Icon.extend({
		    options: {
		        iconSize: [22,32],
		        iconAnchor: [-20,0],
		        shadowUrl: 'icons/poi_shadow.png',
		        shadowSize: [22,13],
		        shadowAnchor: [-31,-19],
		        popupAnchor: [32,-2]
		    }
		});

		var blackIcon = new poiIcon({iconUrl:'icons/poi_black.png'});
		var redIcon   = new poiIcon({iconUrl:'icons/poi_red.png'});
		var treeIcon  = new poiIcon({iconUrl:'icons/tree_green.png',shadowUrl:'icons/tree_shadow.png'});
		
		// Mapquest layer
		var mapquest = new L.TileLayer('https://web.archive.org/web/20150827104356/http://otile/{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
			maxZoom: 18, 
			attribution: "©<a href='https://web.archive.org/web/20150827104356/http://openstreetmap.org/' target='_blank'>OpenStreetMap</a> contributors, Tiles Courtesy of <a href='https://web.archive.org/web/20150827104356/http://open.mapquest.com/' target='_blank'>MapQuest</a>", 
			subdomains: ['1','2','3','4']
		});
		
		// Init application
		$(document).ready(function() {
		
			// Assign points to users
			$.get('https://web.archive.org/web/20150827104356/http://api.hostip.info/get_json.php',function(json){
				user = json;

				// Load user points
				loadPoints();
			});
		
			map = new L.Map('map', {
				center: new L.LatLng(34.68, 135.18), 
				zoom: 16,
				layers: [mapquest],
				zoomControl: true
			});
		
			// Drag & Drop
			$(".drag").draggable({
				//helper: 'clone',
				containment: 'map',
				start: function(evt, ui) {
					$('#box').fadeTo('fast', 0.6, function() {});
				},
				stop: function(evt, ui) {
					$('#box').fadeTo('fast', 1.0, function() {});
					
					var options = {
						pid: guid(),
						type: ui.helper.attr('type'),
						icon: eval(ui.helper.attr('type') + 'Icon'),
						draggable: true
					};
					
					insertPoint(
						map.containerPointToLatLng([ui.offset.left, ui.offset.top]),
						options
					);
				}
			});			
		});

		// GET points
		function loadPoints() {

			var maxFeatures = 50;
			var params = '?service=WFS&version=1.1.0&request=GetFeature&typeName=grp:points'
							+ '&outputFormat=json&sortBy=created+D&maxFeatures=' + maxFeatures
							+ '&filter=<PropertyIsEqualTo><PropertyName>ip</PropertyName><Literal>' 
							+ user.ip + '</Literal></PropertyIsEqualTo>';

			$.get(gs.ows + params, function(json){

				// Remove all markers
				for(i=0;i<markers.length;i++) {
					map.removeLayer(markers[i]);
					markers.splice(i, 1);
				}
			
				// Add markers
				for(i=0;i<json.features.length;i++) {
				
					var ftr = json.features[i];

					var options = {
						pid: ftr.properties.pid,
						type: ftr.properties['class'],
						icon: eval(ftr.properties['class'] + 'Icon'),
						draggable: true
					};
					
					var point = L.marker([ftr.geometry.coordinates[0],ftr.geometry.coordinates[1]],options).addTo(map);
					point.bindPopup(
						'<a onClick="deletePoint(\'' + point.options.pid 
							+ '\');" href="#">Remove Me!</a>',
						{
							closeButton: false
						}
					);

					point.on('dragend', function(evt){
						updatePoint(point);
					});
			
					markers.push(point);
				}
			});
		}
		
		// INSERT point
		function insertPoint(position,options) {

			var point = L.marker(position,options).addTo(map);
			point.bindPopup(
				'<a onClick="deletePoint(\'' + point.options.pid 
					+ '\');" href="#">Remove Me!</a>',
				{
					closeButton: false
				}
			);

			point.on('dragend', function(evt){
				updatePoint(point);
			});
			
			markers.push(point);
		
			var postData = 
				'<wfs:Transaction\n'
			  + '  service="WFS"\n'
			  + '  version="1.1.0"\n'
			  + '  xmlns:grp="https://web.archive.org/web/20150827104356/http://lab.georepublic.info/"\n'
			  + '  xmlns:wfs="https://web.archive.org/web/20150827104356/http://www.opengis.net/wfs"\n'
			  + '  xmlns:gml="https://web.archive.org/web/20150827104356/http://www.opengis.net/gml"\n'
			  + '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
			  + '  xsi:schemaLocation="https://web.archive.org/web/20150827104356/http://www.opengis.net/wfs\n'
			  + '                      http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd\n'
			  + '                      http://lab.georepublic.info/geoserver/grp/wfs/DescribeFeatureType?typename=grp:points">\n'
			  + '  <wfs:Insert>\n'
			  + '    <grp:points>\n'
			  + '      <grp:pid>' + point.options.pid + '</grp:pid>\n'
			  + '      <grp:class>' + point.options.type + '</grp:class>\n'
			  + '      <grp:ip>' + user.ip + '</grp:ip>\n'
			  + '      <grp:the_geom>\n'
			  + '        <gml:Point srsDimension="2" srsName="urn:x-ogc:def:crs:EPSG:4326">\n'
			  + '          <gml:coordinates decimal="." cs="," ts=" ">' + point.getLatLng().lat + ',' + point.getLatLng().lng + '</gml:coordinates>\n'
			  + '        </gml:Point>\n'
			  + '      </grp:the_geom>\n'
			  + '    </grp:points>\n'
			  + '  </wfs:Insert>\n'
			  + '</wfs:Transaction>';
			
			$.ajax({
				type: "POST",
				url: gs.wfs,
				dataType: "xml",
				contentType: "text/xml",
				data: postData,
				//TODO: Error handling
				success: function(xml) {	
					//TODO: User feedback
				}
			});
		}

		// UPDATE point
		function updatePoint(point) {

			var postData = 
				'<wfs:Transaction\n'
			  + '  service="WFS"\n'
			  + '  version="1.1.0"\n'
			  + '  xmlns:grp="https://web.archive.org/web/20150827104356/http://lab.georepublic.info/"\n'
			  + '  xmlns:wfs="https://web.archive.org/web/20150827104356/http://www.opengis.net/wfs"\n'
			  + '  xmlns:ogc="https://web.archive.org/web/20150827104356/http://www.opengis.net/ogc"\n'
			  + '  xmlns:gml="https://web.archive.org/web/20150827104356/http://www.opengis.net/gml"\n'
			  + '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
			  + '  xsi:schemaLocation="https://web.archive.org/web/20150827104356/http://www.opengis.net/wfs\n'
			  + '                      http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd">\n'
			  + '  <wfs:Update typeName="grp:points">\n'
			  + '    <wfs:Property>\n'
			  + '      <wfs:Name>the_geom</wfs:Name>\n'
			  + '      <wfs:Value>\n'
			  + '        <gml:Point srsDimension="2" srsName="urn:x-ogc:def:crs:EPSG:4326">\n'
			  + '          <gml:coordinates decimal="." cs="," ts=" ">' + point.getLatLng().lat + ',' + point.getLatLng().lng + '</gml:coordinates>\n'
			  + '        </gml:Point>\n'
			  + '      </wfs:Value>\n'
			  + '    </wfs:Property>\n'
			  + '    <ogc:Filter>\n'
			  + '      <PropertyIsEqualTo>\n'
			  + '        <PropertyName>pid</PropertyName>\n'
			  + '        <Literal>' + point.options.pid + '</Literal>\n'
			  + '      </PropertyIsEqualTo>\n'
			  + '    </ogc:Filter>\n'
			  + '  </wfs:Update>\n'
			  + '</wfs:Transaction>';
			
			$.ajax({
				type: "POST",
				url: gs.wfs,
				dataType: "xml",
				contentType: "text/xml",
				data: postData,
				//TODO: Error handling
				success: function(xml) {	
					//TODO: User feedback
				}
			});
		}

		// DELETE point
		function deletePoint(pid) {
		
			for(i=0;i<markers.length;i++) {
				if(markers[i].options.pid === pid) {
					map.removeLayer(markers[i]);
					markers.splice(i, 1);
				}
			}
			
			var postData = 
				'<wfs:Transaction\n'
			  + '  service="WFS"\n'
			  + '  version="1.1.0"\n'
			  + '  xmlns:grp="https://web.archive.org/web/20150827104356/http://lab.georepublic.info/"\n'
			  + '  xmlns:wfs="https://web.archive.org/web/20150827104356/http://www.opengis.net/wfs"\n'
			  + '  xmlns:ogc="https://web.archive.org/web/20150827104356/http://www.opengis.net/ogc"\n'
			  + '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
			  + '  xsi:schemaLocation="https://web.archive.org/web/20150827104356/http://www.opengis.net/wfs\n'
			  + '                      http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd">\n'
			  + '  <wfs:Delete typeName="grp:points">\n'
			  + '    <ogc:Filter>\n'
			  + '      <PropertyIsEqualTo>\n'
			  + '        <PropertyName>pid</PropertyName>\n'
			  + '        <Literal>' + pid + '</Literal>\n'
			  + '      </PropertyIsEqualTo>\n'
			  + '    </ogc:Filter>\n'
			  + '  </wfs:Delete>\n'
			  + '</wfs:Transaction>';
			  
			$.ajax({
				type: "POST",
				url: gs.wfs,
				dataType: "xml",
				contentType: "text/xml",
				data: postData,
				//TODO: Error handling
				success: function(xml) {	
					//TODO: User feedback
				}
			});
		}

		// Create a GUID
		function S4() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		}
		function guid() {
			return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		}
	