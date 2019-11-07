// Global Variables
var map;
var maxAttributeValue;
var minAttributeValue;
var latLng;
var addresses = [];
var arbitraryVals = [];
var otherVals = [];
var markers = L.layerGroup();
var csvTableCreated = false;
var resultsTableCreated = false;
var uploadedCsvData = [];
var addressColumnHeader = "";

// Global object to hold MURC class definitions
var murcDefs = {
    // Class definitions for MURC value
    "1a":"≥100 miles from a population center; <2,500 residents or <250 residents per square mile",
    "1b":"≥100 miles from a population center; 2,500-9,999 residents and >250 residents per square mile",
    "2a":"75-99 miles from a population center; <2,500 residents or <250 residents per square mile",
    "2b":"75-99 miles from a population center; 2,500-9,999 residents and >250 residents per square mile",
    "2c":"75-99 miles from a population center; 10,000-49,999 residents and >250 residents per square mile",
    "3a":"50-74 miles from a population center; <2,500 residents or <250 residents per square mile",
    "3b":"50-74 miles from a population center; 2,500-9,999 residents and >250 residents per square mile",
    "3c":"50-74 miles from a population center; 10,000-49,999 residents and >250 residents per square mile",
    "4a":"25-49 miles from a population center; <2,500 residents or <250 residents per square mile",
    "4b":"25-49 miles from a population center; 2,500-9,999 residents and >250 residents per square mile",
    "4c":"25-49 miles from a population center; 10,000-49,999 residents and >250 residents per square mile",
    "5a":"<25 miles from a population center; <2,500 residents or <250 residents per square mile",
    "5b":"<25 miles from a population center; 2,500-9,999 residents and >250 residents per square mile",
    "5c":"<25 miles from a population center; 10,000-49,999 residents and >250 residents per square mile",
    "6":"≥50,000 residents",
    // Class definitions for 3-class MURC
    "R":"Rural: ≥25 miles from a population center and ≤9,999 residents",
    "SU":"Small Urban: ≥25 miles from a population center and ≥10,000 residents or <25 miles from a population center and ≤9,999 residents",
    "U":"Urban: <25 miles from a population center and ≥10,000 residents"
}

// Global object to count each time a MURC class is geocoded
var classCounter = {
    // Class definitions for MURC value
    "1a":0,
    "1b":0,
    "2a":0,
    "2b":0,
    "2c":0,
    "3a":0,
    "3b":0,
    "3c":0,
    "4a":0,
    "4b":0,
    "4c":0,
    "5a":0,
    "5b":0,
    "5c":0,
    "6":0,
    // Class definitions for 3-class MURC
    "R":0,
    "SU":0,
    "U":0
}

// Placeholder for topojson layer on loadin
var topoLayer;


function createmap() {

    // Update which title is used based on window width on load-in
    if ($(window).width() < 875) {
        $('.navbar-brand-title')[0].innerHTML = "MURC";
        $('.the-actual-brand')[0].innerHTML = '<img id="logo" src="images/WI_ORH_Logo_Outline_Small.png" width="auto" height="40" alt="">';
    }

    // Create window event listener to switch to appropriate title based on window width on window resize
    window.addEventListener("resize", (function() {
        if ($(window).width() < 875) {
            $('.navbar-brand-title')[0].innerHTML = "MURC";
            $('.the-actual-brand')[0].innerHTML = '<img id="logo" src="images/WI_ORH_Logo_Outline_Small.png" width="auto" height="40" alt="">';
        } else if ($(window).width() >= 875) {
            $('.navbar-brand-title')[0].innerHTML = "Municipal Urban-Rural Classification";
            $('.the-actual-brand')[0].innerHTML = '<img id="logo" src="images/WI_ORH_Logo_Outline.png" width="auto" height="40" alt="">';
        }
    }))

    /********** Create listener for clicking the "x" on an info link's content (E.g. Help, About, Contact, etc) *********/
    $('#infoModal .fa-times').on('click', function (e) {
        $('#infoModal').fadeOut(500);
        $('#modalBkgd').fadeOut(500);
    });

    /*********  Map definition: *********/

    // Set bounds for map (WI)
    bounds = L.latLngBounds(
        L.latLng(51.5, -82),
        L.latLng(38, -97.5)
    );

    // Create map object
    map = L.map('map', {
        //center: bounds.getCenter(),
        center: [44.75, -89.75],
        zoom: 7,
        minZoom: 7,
        maxZoom: 18,
        maxBounds: bounds
    });


    /*********  Basemap layer(s) definition: *********/

    //Stamen-toner basemap

    // The stamen toner lite version
    var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
    });


    // The stamen toner basemap without the labels
    var Stamen_TonerBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
        opacity: 0.3
    });

    // The stamen toner lines (roads)
    var Stamen_TonerLines = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
        // We add the labels to the shadow pane to ensure they are above the overlayPane of the MURC layer, but below the popup pane
        pane: 'shadowPane',
        opacity: 0.3
    });

    // The stamen toner labels
    var Stamen_TonerLabels = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
        // We add the labels to the shadow pane to ensure they are above the overlayPane of the MURC layer, but below the popup pane
        pane: 'shadowPane'
    });

    // A big white rectangle that we can use to mask the background
    var bigRectangle = {
        "type": "Feature",
        "properties": {
            "name": "Big Rectangle"
            // "pane": "shadowPane"
            // "style": {
            //     weight: 2,
            //     color: "#999",
            //     opacity: 1,
            //     fillColor: "#B0DE5C",
            //     fillOpacity: 0.8
            // }
            // "pane": "shadowPane"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [60,-70],
                [30,-69.99],
                [29.99,-109.99],
                [59.99,-109.99],
                [60,-70]
            ]]
        }
    }
    var bigRectangleStyle = {
        "weight": 2,
        "color": "#ffffff",
        "opacity": 1,
        "fillColor": "#fffff0",
        "fillOpacity": 0.65
        // "pane": "tilePane"
    }

    // L.latLng(60, -70),
    // L.latLng(30, -110)

    // Add stamen toner tiles to the map
    Stamen_TonerLite.addTo(map);
    // L.geoJSON(bigRectangle, {style: bigRectangleStyle}).addTo(map);
    // Stamen_TonerBackground.addTo(map);
    // Stamen_TonerLines.addTo(map);
    Stamen_TonerLabels.addTo(map);
    

    /*********  Load MURC data onto map: *********/

    // Attempt to bring in topojson; https://blog.webkid.io/maps-with-leaflet-and-topojson/
    // This overwrites the original geojson functionality to work with a topojson file
    L.TopoJSON = L.GeoJSON.extend({
        addData: function (jsonData) {
            if (jsonData.type === 'Topology') {
                for (key in jsonData.objects) {
                    geojson = topojson.feature(jsonData, jsonData.objects[key]);
                    L.GeoJSON.prototype.addData.call(this, geojson);
                }
            }
            else {
                L.GeoJSON.prototype.addData.call(this, jsonData);
            }
        }
    });
    // Copyright (c) 2013 Ryan Clark

    // Placeholder for topojson layer on loadin
    topoLayer = new L.TopoJSON();

    // Use AJAX to retrieve topo data for layer
    $.getJSON('lib/geoData/MURC_Dec2016_revised_Unprojected_Simplified_30_Percent.topojson')
        // When data retrieved, call addTopoData to add data to map
        .done(addTopoData);

    // Function to add topojson data to map
    function addTopoData(topoData) {
        // Add data to the layer
        topoLayer.addData(topoData);
        // Add layer to the map
        topoLayer.addTo(map);

        // Color each layer according to attribute value
        // And add some event listeners to each layer
        topoLayer.eachLayer(handleLayer);

        createLegend();
        // Create a legend for the map if the screen size is large enough
        if ($(window).width() < 768) {
            $('.legend-control-container').hide();
        }
        // Create window event listener to switch legend on/off depending on window width
        window.addEventListener("resize", (function() {
            if ($(window).width() < 768) {
                $('.legend-control-container').hide();
            } else if ($(window).width() >= 768) {
                $('.legend-control-container').show();
            }
        }))

    }



    /*********  Implement address input: *********/

    // Add on-click event to address input submit button
    // $('#addressInput-form').submit(function(){
    $("#addressSubmit").on("click", function () {

        // Prevent default form behavior
        event.preventDefault();

        // Reset latLng
        latLng = undefined;

        // Retrieve address from input
        var address = $('#addressInput')[0].value;

        // Show loading screen while geocoding takes place
        $('#loading-div').fadeIn(500);


        // For batch, we geocode after hitting calculate MURC, but for a single address it seems
        // better to geocode now and make sure we have a valid address

        // Geocode address
        // Code snippet from: https://gist.github.com/rufuspollock/4994760

        // we are using MapQuest's Nominatim service
        var geocode = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + address;

        // use jQuery to call the API and get the JSON results
        $.getJSON(geocode, function (data) {


            // Check that the results are not empty
            if (data.length) {
                // Check that there is a result within WI
                for (i = 0; i < data.length; i++) {
                    console.log(data[i]);
                    var name = Papa.parse(data[i].display_name).data[0];
                    console.log(name);
                    if (name.length > 3 && name[(name.length - 3)].trim() == "Wisconsin") {
                        // If within Wisconsin, save the lat and lng of the address
                        latLng = L.latLng(data[i].lat, data[i].lon);
                        // Save the full geocoded address
                        console.log(data[i].display_name);
                        address = data[i].display_name;
                        // Add the coordinates to the address
                        address += " <br>Latitude: " + data[i].lat + " <br>Longitude" + data[i].lon;
                        break;
                    }
                }
            }

            // Check that latLng is not undefined (we found an address in WI)
            if (latLng != undefined) {
                // Remove address not found message
                $('#addressNotFound').fadeOut(500);

                // Add location marker to marker layer group
                var marker = L.marker(latLng);
                console.log(address);
                marker.address = address;
                markers.addLayer(marker);

                // Add marker to map
                markers.addTo(map);

                // According to client request, instead of having calc murc button appear, immediately calculate the murc value instead
                // calcMurcSingle();
                $('#startOverButt').fadeIn(500);

                // Fade in table div
                $('#resultsTable').fadeIn(500);

                // Append the header row to thead in preperation for the data
                $('#resultsTable thead').append("<tr><th>Address</th><th>Latitude</th><th>Longitude</th><th>MURC <i id='murcInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification'></i> </th><th>MURC def <i id='murcDefInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Definition of the Municipal Urban-Rural Classification'></i> </th><th>MURC3 <i id='murc3Info' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification 3-Class Version'></i> </th><th>MURC3 def <i id='murc3DefInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Definition of the Municipal Urban-Rural Classification 3-Class Version'></i> </th></tr>");

                // Enable tooltips
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip()
                })

                // Create variable to track number of successful geocodes
                var succGeo = 0;

                // Fade out the singleAddressSelection-div
                $('#singleAddressSelection-div').fadeOut(500);

                
                // The lat and lng of the marker
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;

                // Check if the marker is in a topoLayer polygon
                var res = leafletPip.pointInLayer(marker.getLatLng(), topoLayer);

                // If result has a length value, then the point was in one of the polygons
                if (res.length) {
                    // Add popup content using the MURC values
                    var popupContent = "<b>Address:</b><br>" + address + "<br><br><b>MURC:</b><br>" + res[0].feature.properties.MURC_Class + ": " + murcDefs[res[0].feature.properties.MURC_Class] + "<br><br><b>MURC 3-Class Version:</b><br>" + murcDefs[res[0].feature.properties.MURC_3clas];
                    var popup = L.popup({
                        autoPan: false
                    }).setContent(popupContent);
                    marker.bindPopup(popup);

                    // Create a table row entry with the MURC value
                    var tableRow = "<tr><td>" + address.split("Latitude")[0].trim() + "</td><td>" + lat + "</td><td>" + lng + "</td><td>" + res[0].feature.properties.MURC_Class + "</td><td>" +  murcDefs[res[0].feature.properties.MURC_Class] + "</td><td>" + res[0].feature.properties.MURC_3clas + "</td><td>" + murcDefs[res[0].feature.properties.MURC_3clas] + "</td></tr>"
                    // Add it to the results table
                    $('#resultsTable tbody').append(tableRow);

                    // Increment successful geo
                    succGeo++;

                    // Increment the class counter
                    classCounter[res[0].feature.properties.MURC_Class]++;
                    classCounter[res[0].feature.properties.MURC_3clas]++;

                } else {
                    // If in WI, but not within our MURC polygons, remove the marker
                    map.removeLayer(marker);
                }
                

                // Finish creating the data table view
                var table = $('#resultsTable').DataTable({
                    // "scrollY": "100%",
                    // "scrollX": "100%",
                    //destroy: true,
                    dom: 'Bfrtip',
                    buttons: [
                        { extend: 'csvHtml5', title: 'MURC Report' }, { extend: 'excelHtml5', title: 'MURC Report' }, { extend: 'pdfHtml5', title: 'MURC Report' }
                    ]
                });
                resultsTableCreated = true;

                // Check if we should print success or failure(if we geocoded anything)
                if (succGeo == 0) {
                    $('#success')[0].innerHTML = 'Failure';
                } else {
                    $('#success')[0].innerHTML = 'Success!';
                }

                // Update the number of successful geocodes in the results-content (this is actually the number of records we successfully found MURC values for)
                $('#numGeoCoded')[0].innerHTML = succGeo + ' out of 1 addresses found';

                // Snag the buttons made by DataTables and put them in the sidebar instead
                $('.dt-buttons').appendTo('#results-content');

                // Check if there was only a single address geocoded (i.e., only one marker on the map)
                if(succGeo == 1){
                    // If only a single address was reverse geocoded, print overview information for that point
                    console.log(marker.getPopup().getContent());
                    $('#resultsOverview')[0].innerHTML = marker.getPopup().getContent();
                }else{
                    // If the geocode was unsuccessful, do not print anything
                    $('#resultsOverview')[0].innerHTML = "";
                }

                // Remove the loading screen
                $('#loading-div').fadeOut(500);

                // Switch to results view
                $('#content').fadeOut(500);
                $('#results-content').fadeIn(500);
                // set map view
                // Reset table/map toggle
                if($('#tableButtLabel').hasClass('active')){
                    $('#tableButtLabel').removeClass('active');
                    $('#mapButtLabel').addClass('active');
                }
                //$('#table-div').fadeIn(500);
                $('#resultsTable').fadeIn(500);

            } else {
                // If it is empty, have a message pop up instead
                $('#loading-div').fadeOut(500);
                $('#addressNotFound').fadeIn(500);
            }

        }); // End getJSON

    });

    /*********  Implement drag and drop location marker: *********/

    // Add drag events
    $(".dragMarker").draggable({
        containment: 'map',
        start: function (evt, ui) {

        },
        stop: function (evt, ui) {

            // INSERT Point on drag end
            var options = {
                draggable: true
            };

            // This seems to be the actual offset of the marker from the top
            markerTopOffset = (ui.offset.top + ($('#dragMarker').height()));

            // This seems to be the actual offset of the marker from the left
            markerLeftOffset = (ui.offset.left + ($('#dragMarker').width() / 2))

            // Only create the marker if the our marker is within the map
            if ((markerLeftOffset > $('#map').offset().left) && (markerTopOffset > $('#map').offset().top)) {

                // Create a new map marker at the spot of the dragged marker
                var marker = L.marker(map.containerPointToLatLng([(markerLeftOffset - $('#map').offset().left), (markerTopOffset - $('#map').offset().top)]));

                // Add marker to map
                markers.addLayer(marker);
                markers.addTo(map);

                // Fade in single address selection div to block out csv selection
                $('#singleAddressSelection-div').fadeIn(500);
            }

            // Reset the position of the dragged marker
            $("#dragMarker").position({
                my: "center",
                at: "center",
                of: "#dragMarker-container"
            });

            if(markers.getLayers().length > 0){

                var marker = markers.getLayers()[0];
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;

                // According to client request, instead of having calc murc button appear, immediately calculate the murc value instead
                // calcMurcSingle();
                $('#startOverButt').fadeIn(500);

                // Show loading screen while geocoding takes place
                $('#loading-div').fadeIn(500);

                // Fade in table div
                //$('#table-div').fadeIn(500);
                $('#resultsTable').fadeIn(500);

                // Append the header row to thead in preperation for the data
                $('#resultsTable thead').append("<tr><th>Address</th><th>Latitude</th><th>Longitude</th><th>MURC <i id='murcInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification'></i> </th><th>MURC def <i id='murcDefInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Definition of the Municipal Urban-Rural Classification'></i> </th><th>MURC3 <i id='murc3Info' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification 3-Class Version'></i> </th><th>MURC3 def <i id='murc3DefInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Definition of the Municipal Urban-Rural Classification 3-Class Version'></i> </th></tr>");

                // Enable tooltips
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip()
                })

                // Create variables to track number of successful geocodes and track marker properties
                var succGeo = 0;

                // Fade out the singleAddressSelection-div
                $('#singleAddressSelection-div').fadeOut(500);

                // Create the reverse geocode url using lat and lng
                var reverseGeocodeURL = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;

                // Use jQuery to call the API and get the JSON results
                $.getJSON(reverseGeocodeURL, function (data) {

                    // Check that the results are not empty
                    if (data.display_name) {
                        // Set address to the reverse geocoded address
                        address = data.display_name;
                        // Check that the resulting address is within WI
                        var name = Papa.parse(address);
                        for (i = 0; i < name.data[0].length; i++) {
                            if (name.data[0][i].trim() == "Wisconsin") {
                                // Set inWI to true if marker is within WI
                                inWI = true;
                                break;
                            }
                        }
                        // If in Wisconsin
                        if (inWI) {

                            // Check if the marker is in a topoLayer polygon
                            var res = leafletPip.pointInLayer(marker.getLatLng(), topoLayer);

                            // If result has a length value, then the point was in one of the polygons
                            if (res.length) {
                                // Add the coordinates to the address
                                address += "<br>Latitude: " + lat + "<br>Longitude: " + lng;
                                // Add popup content using the MURC values
                                var popupContent = "<b>Address:</b><br>" + address + "<br><br><b>MURC:</b><br>" + res[0].feature.properties.MURC_Class + ": " + murcDefs[res[0].feature.properties.MURC_Class] + "<br><br><b>MURC 3-Class Version:</b><br>" + murcDefs[res[0].feature.properties.MURC_3clas];
                                var popup = L.popup({
                                    autoPan: false
                                }).setContent(popupContent);
                                marker.bindPopup(popup);

                                // Create a table row entry with the MURC value
                                var tableRow = "<tr><td>" + address.split("Latitude")[0].trim() + "</td><td>" + lat + "</td><td>" + lng + "</td><td>" + res[0].feature.properties.MURC_Class + "</td><td>" +  murcDefs[res[0].feature.properties.MURC_Class] + "</td><td>" + res[0].feature.properties.MURC_3clas + "</td><td>" + murcDefs[res[0].feature.properties.MURC_3clas] + "</td></tr>"
                                // Add it to the results table
                                $('#resultsTable tbody').append(tableRow);

                                // Increment successful geo
                                succGeo++;

                                // Increment the class counter
                                classCounter[res[0].feature.properties.MURC_Class]++;
                                classCounter[res[0].feature.properties.MURC_3clas]++;

                            } else {
                                // If in WI, but not within our MURC polygons, remove the marker
                                map.removeLayer(marker);
                            }
                        } else {
                            // If not in WI, remove the marker
                            map.removeLayer(marker);
                        }
                    }

                }).done(function () {
                    // Once we finish the reverse geocoding for this address

                    // Finish creating the data table view
                    var table = $('#resultsTable').DataTable({
                        // "scrollY": "100%",
                        // "scrollX": "100%",
                        //destroy: true,
                        dom: 'Bfrtip',
                        buttons: [
                            { extend: 'csvHtml5', title: 'MURC Report' }, { extend: 'excelHtml5', title: 'MURC Report' }, { extend: 'pdfHtml5', title: 'MURC Report' }
                        ]
                    });
                    resultsTableCreated = true;

                    // Check if we should print success or failure(if we geocoded anything)
                    if (succGeo == 0) {
                        $('#success')[0].innerHTML = 'Failure';
                    } else {
                        $('#success')[0].innerHTML = 'Success!';
                    }

                    // Update the number of successful geocodes in the results-content (this is actually the number of records we successfully found MURC values for)
                    $('#numGeoCoded')[0].innerHTML = succGeo + ' out of 1 addresses found';

                    // Snag the buttons made by DataTables and put them in the sidebar instead
                    $('.dt-buttons').appendTo('#results-content');

                    // Check if there was only a single address geocoded (i.e., only one marker on the map)
                    if(succGeo == 1){
                        // Print overview information for that point
                        console.log(marker.getPopup().getContent());
                        $('#resultsOverview')[0].innerHTML = marker.getPopup().getContent();
                    }else{
                        $('#resultsOverview')[0].innerHTML = "";
                    }

                    // Remove the loading screen
                    $('#loading-div').fadeOut(500);

                    // Switch to results view
                    $('#content').fadeOut(500);
                    $('#results-content').fadeIn(500);
                    // set map view
                    // Reset table/map toggle
                    if($('#tableButtLabel').hasClass('active')){
                        $('#tableButtLabel').removeClass('active');
                        $('#mapButtLabel').addClass('active');
                    }
                    //$('#table-div').fadeIn(500);
                    $('#resultsTable').fadeIn(500);

                });
            }

        }
    });

    /*********  Implement file picker to read csv: *********/

    // File picker
    $(".custom-file-input").on("change", function () {

        // If the value is changed to an empty one
        if ($(this).val() == "") {

            // Clear any pre-existing csvTable
            if (csvTableCreated) {
                $('#csvTable').DataTable().destroy();
                csvTableCreated = false;
            }
            $('#csvTable')[0].innerHTML = "<thead></thead><tbody></tbody>";

            // Reset the views to map
            $('#csvLoaded-div').fadeOut(500);
            $('#murcButton-container-csv').fadeOut(500);
            $('#csvTable').fadeOut(500);
            $('#table-div').fadeOut(500);
            $('#fileSelection-div').fadeOut(500);

        } else {

            // Fade in non-csv selection features blocker
            $('#fileSelection-div').fadeIn(500);

            // Remove calc button
            $('#murcButton-container-single').fadeOut(500);

            // Clear any pre-existing csvTable
            if (csvTableCreated) {
                $('#csvTable').DataTable().destroy();
                csvTableCreated = false;
            }
            $('#csvTable')[0].innerHTML = "<thead></thead><tbody></tbody>";

            // Clear previously saved CSV data
            uploadedCsvData = [];
            addressColumnHeader = "";

            // Clear addresses and values
            addresses = [];
            arbitraryVals = [];
            otherVals = [];

            // Remove content to our column selection text div
            $('#csvLoaded-div').text("CSV Loaded!"+"<br>"+"Please click on an example address in the table.");

            // Fade in start over button
            $('#startOverButt').fadeIn(500);

            // Fade out the calculate MURC button
            $('#murcButton-container-csv').fadeOut(500);

            // Bring csvTable into view
            $('#csvTable').fadeIn(500);

            // Add the following code if you want the name of the file appear on select
            var fileName = $(this).val().split("\\").pop();
            $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
            // Access the file
            var file = this.files[0];
            var headerRead = false;
            // Use papaparse to parse it
            Papa.parse(file, {
                // Stream in a worker thread to keep page reactive?
                worker: true,
                // Specify a step callback to receive the results row-by-row?
                step: function (row) {
                    // Create a row for the table
                    var tableRow = "<tr>"
                    for (i = 0; i < row.data[0].length; i++) {
                        // If headerRead is false, aka this is the first row and therefore the header row
                        if (headerRead == false) {
                            // Create a table header entry
                            tableRow += "<th>" + row.data[0][i] + "</th>"
                            // Create an entry in uploadedCsvData
                            uploadedCsvData.push([row.data[0][i]]);
                        // Else, if it's a normal row
                        } else {
                            // Create a table data entry
                            tableRow += "<td>" + row.data[0][i] + "</td>"
                            // Update the entry in uploadedCsvData
                            uploadedCsvData[i].push(row.data[0][i]);
                        }
                    }
                    tableRow += "</tr>"
                    // Append the row to the table
                    if (tableRow != "<tr><td></td></tr>") {
                        // If headerRead is false, aka this is the first row and therefore the header row
                        if (headerRead == false) {
                            // Append to the thead of the table
                            $('#csvTable thead').append(tableRow);
                            // Set headerRead to true, as we've now finished reading the header row
                            headerRead = true;
                        // Else, if it's a normal row
                        } else {
                            // Append to the tbody of the table
                            $('#csvTable tbody').append(tableRow);
                        }
                    }
                },
                complete: function () {

                    
                    var table = $('#csvTable').DataTable({
                        // "scrollY": "100%"
                        // "scrollX": "100%"
                    });
                    csvTableCreated = true;

                    $('#table-div').fadeIn(1000);

                    $('#csvLoaded-div').fadeIn(500);

                    // Add in event listeners for the columns
                    // TODO: Add listeners/highlighting for header as well?
                    $('#csvTable tbody')
                        // On td click
                        .on('click', 'td', function () {

                            // Retrieve index of column of clicked td
                            var colIdx = table.cell(this).index().column;

                            // Remove highlight from all tds
                            $(table.cells().nodes()).removeClass('highlight');
                            // Highlight tds of column
                            $(table.column(colIdx).nodes()).addClass('highlight');

                            // Clear any previously selected/stored info
                            addresses = [];
                            arbitraryVals = [];
                            otherVals = [];       

                            // Save name of column header that contains addresses
                            addressColumnHeader = $(table.column(colIdx).header())[0].innerHTML;


                            // Save reference to column that contains addresses
                            for (i = 0; i < uploadedCsvData.length; i++){
                                if(uploadedCsvData[i][0] == addressColumnHeader){
                                    addresses = uploadedCsvData[i];
                                }
                            }

                            // TODO: delete
                            // Retrieve data from selected column, save to addresses
                            // var column = $(table.column(colIdx).nodes());

                            // for (i = 0; i < column.length; i++) {
                            //     addresses.push(column[i].innerHTML);
                            // }

                            // Add content to our column selection text div
                            $('#csvLoaded-div').text(addressColumnHeader + " field selected");

                            // Fade in the calculate MURC button
                            $('#murcButton-container-csv').fadeIn(500);
                            $('#startOverButt').fadeIn(500);
                        })
                }
            })
        }
    });

    /*********  Implement calculate MURC for csv addresses *********/

    // When the batch address calculate MURC button is clicked
    $('#calcMurcButtCSV').on("click", function () {

        // Fade out non-csv selection features blocker
        $('#fileSelection-div').fadeOut(500);

        // Remove csv table
        $('#csvTable').fadeOut(500);
        $('#resultsTable').fadeIn(500);
        $('#table-div').fadeOut(500);


        if (csvTableCreated) {
            // Clear csv table
            $('#csvTable').DataTable().destroy();
            csvTableCreated = false;
        }
        $('#csvTable')[0].innerHTML = "<thead></thead><tbody></tbody>";


        // Show loading screen while geocoding takes place
        $('#loading-div').fadeIn(500);

        // Create variable to track number of successful geocodes
        var succGeo = 0;

        var addressIndex = 1;
        var numAddresses = addresses.length;


        // Append the header row to thead to prepare for results
        // Again, we don't know the names of the columns, so the header will need to be constructed dynamically
        var headerRow = "<tr>";
        for (i = 0; i < uploadedCsvData.length; i++){
            headerRow += "<th>"+uploadedCsvData[i][0]+"</th>"
        }
        headerRow += "<th>Geocoded Address</th><th>Latitude</th><th>Longitude</th><th>MURC <i id='murcInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification'></i> </th><th>MURC def <i id='murcDefInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification Definition'></i> </th><th>MURC3 <i id='murc3Info' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification 3-Class Version'></i> </th><th>MURC3 def <i id='murc3DefInfo' class='fas fa-info-circle' data-toggle='tooltip' data-placement='top' title='Municipal Urban-Rural Classification 3-Class Version Definition'></i> </th></tr>";
        $('#resultsTable thead').append(headerRow);

        // Enable tooltips
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        // Use recursion to geocode all addresses (this implementation only calls to geocode the next address after completing the current address)
        geoCode(addressIndex, numAddresses, succGeo);

        if($('#tableButtLabel').hasClass('active')){
            $('#tableButtLabel').removeClass('active');
            $('#mapButtLabel').addClass('active');
        }

        $('#csvLoaded-div').fadeOut(500);

    });


    /*********  Add event listeners for results-content buttons: *********/

    // Event listener to show table on click
    $('#tableButt').on("change", function () {
        $('#table-div').fadeIn(500);
    });

    // Event listener to show map on click
    $('#mapButt').on("change", function () {
        $('#table-div').fadeOut(500);
    });

    // Event listener for start over button to reset everything
    $('.startOverButt').on("click", function () {

        // Remove location markers from map
        map.removeLayer(markers);

        // Clear markers layer group
        markers.clearLayers();

        // Reset table/map toggle
        if($('#tableButtLabel').hasClass('active')){
            $('#tableButtLabel').removeClass('active');
            $('#mapButtLabel').addClass('active');
        }

        // Clear results table

        if (resultsTableCreated) {
            $('#resultsTable').DataTable().destroy();
            resultsTableCreated = false;
        }
        $('#resultsTable')[0].innerHTML = "<thead></thead><tbody></tbody>";

        // Clear any pre-existing csvTable
        if (csvTableCreated) {
            $('#csvTable').DataTable().destroy();
            csvTableCreated = false;
        }
        $('#csvTable')[0].innerHTML = "<thead></thead><tbody></tbody>";

        // Clear address input
        $('#addressInput')[0].value = "";

        // Clear column selection div
        $('#csvLoaded-div').text("");

        // Clear numGeoCoded div
        $('#numGeoCoded')[0].innerHTML = "";

        // Clear percent Geocoded
        $('#percentGeocoded')[0].innerHTML = "0% Complete";

        // Clear file input
        $(".custom-file-input")[0].value = "";
        $(".custom-file-label").html("Choose file");

        // Clear uploaded csv content
        uploadedCsvData = {};
        addressColumnHeader = "";

        // Clear classCounter
        classCounter = {
            // Class definitions for MURC value
            "1a":0,
            "1b":0,
            "2a":0,
            "2b":0,
            "2c":0,
            "3a":0,
            "3b":0,
            "3c":0,
            "4a":0,
            "4b":0,
            "4c":0,
            "5a":0,
            "5b":0,
            "5c":0,
            "6":0,
            // Class definitions for 3-class MURC
            "R":0,
            "SU":0,
            "U":0
        }

        // Clear resultsOverview
        // $('#resultsOverview')[0].innerHTML = "No Summary Available";

        // Reset views
        $('#resultsTable').fadeOut(500);
        $('#csvTable').fadeOut(500);
        $('#table-div').fadeOut(500);
        $('#results-content').fadeOut(500);
        $('#addressNotFound').fadeOut(500);
        $('#murcButton-container-single').fadeOut(500);
        $('#murcButton-container-csv').fadeOut(500);
        $('#loading-div').fadeOut(500);
        $('#fileSelection-div').fadeOut(500);
        $('#csvLoaded-div').fadeOut(500);
        $('#columnSelected-div').fadeOut(500);
        $('#singleAddressSelection-div').fadeOut(500);
        $('#startOverButt').fadeOut(500);


        $('#content').fadeIn(500);


        // Reset variables
        addresses = [];
        latLng = undefined;

    });



    /***************************  MOBILE CONTENT: ***************************/



    /*********  Add event listeners for mobile content: *********/

    // Add on-click event for the menu collapse buttpm
    $('#menuCollapse-mobile').on("click", function () {
        $('#mobile-content-container').removeClass("show");
    });


    // Add on-click event to address input submit button
    $("#addressSubmit-mobile").on("click", function () {

        // Reset latLng
        latLng = undefined;

        // Retrieve adrress from input
        var address = $('#addressInput-mobile')[0].value;


        // For batch, we geocode after hitting calculate MURC, but for a single address it seems
        // better to geocode now and make sure we have a valid address

        // Geocode address
        // Code snippet from: https://gist.github.com/rufuspollock/4994760

        // we are using MapQuest's Nominatim service
        var geocode = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + address;

        // use jQuery to call the API and get the JSON results
        $.getJSON(geocode, function (data) {

            // Check that the results are not empty
            if (data.length) {
                // Check that there is a result within WI
                for (i = 0; i < data.length; i++) {
                    var name = Papa.parse(data[i].display_name).data[0];
                    if (name[(name.length - 3)].trim() == "Wisconsin") {
                        latLng = L.latLng(data[i].lat, data[i].lon);
                        addresses.push(data[i].display_name + "<br>Latitude: " + data[i].lat + "<br>Longitude: " + data[i].lon);
                        break;
                    }
                }
            }

            // Check that latLng is not undefined
            if (latLng != undefined) {
                // Remove address not found message
                $('#addressNotFound-mobile').fadeOut(500);
                // Have calculate MURC button appear
                $('#murcButton-container-single-mobile').fadeIn(500);


                // Add location marker to marker layer group
                singleAddressMarker = L.marker(latLng);
                markers.addLayer(singleAddressMarker);

                // Add markers in layer group to map (just one in this case)
                markers.addTo(map);

                // Pan map to added marker so it's visible above the expanded menu
                map.panTo([(latLng.lat - 1), latLng.lng]);

            } else {
                // Remove calculate MURC button
                $('#murcButton-container-single-mobile').fadeOut(500);
                // If it is empty, have a message pop up instead
                $('#addressNotFound-mobile').fadeIn(500);
            }

        });

    });

    // When the single address calculate MURC button is clicked
    $('#calcMurcButtSingle-mobile').on("click", function () {

        // Fade out previous contents
        $('#address-container-mobile').fadeOut(500);
        $('#murcButton-container-single-mobile').fadeOut(500);


        // Check if in topoLayer polygon
        var res = leafletPip.pointInLayer(latLng, topoLayer);
        // If result has a length value, then the point was in one of the polygons
        if (res.length) {
            // Add popup content to marker
            var popupContent = "<b>Address:</b> " + addresses[0] + "<br><br><b>MURC:</b><br>" + res[0].feature.properties.MURC_Class + ": " + murcDefs[res[0].feature.properties.MURC_Class] + "<br><br><b>MURC 3-Class Version:</b><br>" + murcDefs[res[0].feature.properties.MURC_3clas];
            var popup = L.popup({
                autoPan: false
            }).setContent(popupContent);
            singleAddressMarker.bindPopup(popup);
            $('#geocodeResults-mobile')[0].innerHTML = '<b>Address:</b><br>' + addresses[0] + '<br><b>MURC Value:</b> ' + res[0].feature.properties.MURC_Class + '<br><b>MURC3 Value:</b> ' + res[0].feature.properties.MURC_3clas;
        } else {
            console.log('no succ');
        }

        // Fade in results
        $('#geocodeResults-mobile').fadeIn(500);
        $('#startOverButt-mobile').fadeIn(500);


    });

    $('#startOverButt-mobile').on("click", function () {

        // Fade in previous contents
        $('#address-container-mobile').fadeIn(500);

        // Remove location markers from map
        map.removeLayer(markers);

        // Clear markers layer group
        markers.clearLayers();

        // Clear results
        $('#geocodeResults-mobile')[0].innerHTML = "";

        // Clear address input
        $('#addressInput-mobile')[0].value = "";

        // Fade out results
        $('#geocodeResults-mobile').fadeOut(500);
        $('#startOverButt-mobile').fadeOut(500);
        $('#murcButton-container-single-mobile').fadeOut(500);
        $('#addressNotFound-mobile').fadeOut(500);

    });


} // End createMap()


/***************************  FUNCTION DEFINITIONS: ***************************/


// Function to find the min and max values of an attribute
// TODO: Alter to find min and max MURC attribute values
// function findMinMax(layer) {
//     if (maxAttributeValue === undefined) {
//         maxAttributeValue = layer.feature.properties.FEAT_ID;
//     } else if (layer.feature.properties.FEAT_ID > maxAttributeValue) {
//         maxAttributeValue = layer.feature.properties.FEAT_ID;
//     }

//     if (minAttributeValue === undefined) {
//         minAttributeValue = layer.feature.properties.FEAT_ID;
//     } else if (layer.feature.properties.FEAT_ID < minAttributeValue) {
//         minAttributeValue = layer.feature.properties.FEAT_ID;
//     }
// }

// A function to return the correct color fill for the choropleth map based on the passed in value
function getColor(d) {
    return d == "1a" ? '#bac4e4' :
        d == "1b" ? '#005b85' :
            d == "2a" ? '#a9d593' :
                d == "2b" ? '#58aa47' :
                    d == "2c" ? '#456e42' :
                        d == "3a" ? '#fffbcb' :
                            d == "3b" ? '#fff200' :
                                d == "3c" ? '#ecd517' :
                                    d == "4a" ? '#ffd48e' :
                                        d == "4b" ? '#fcb216' :
                                            d == "4c" ? '#b37c34' :
                                                d == "5a" ? '#fbc763' :
                                                    d == "5b" ? '#db2128' :
                                                        d == "5c" ? '#8e3035' :
                                                            d == "6" ? '#ffffff' :
                                                                '#000000';
}

// A function called on each layer; sets style, popup, and event listeners
function handleLayer(layer) {

    // Calculate fill color using attribute
    // TODO: change to MURC attribute
    var fillColor = getColor(layer.feature.properties.MURC_Class);

    // Set the style of each layer
    layer.setStyle({
        fillColor: fillColor,
        fillOpacity: .7,
        color: '#555',
        weight: 1,
        opacity: .5
    });

    // Set popup for each layer
    var popupContent = "<br><br><b>MURC:</b><br>" + layer.feature.properties.MURC_Class + ": " + murcDefs[layer.feature.properties.MURC_Class] + "<br><br><b>MURC 3-Class Version:</b><br>" + murcDefs[layer.feature.properties.MURC_3clas];
    var popup = L.popup({
        autoPan: false
    })
        .setContent(popupContent);
    layer.bindPopup(popup);

    // Create event listeners for hover
    layer.on({
        click: clickLayer,
        mouseout: leaveLayer
    });
}

// Called on layer click
function clickLayer() {
    // Outline and open popup on click
    this.openPopup();
    this.bringToFront();
    this.setStyle({
        weight: 2,
        opacity: 1
    });
}

// Called on layer mouseout
function leaveLayer() {
    // Revert to original style on mouseout and close popup
    this.closePopup();
    this.bringToBack();
    this.setStyle({
        weight: 1,
        opacity: .5
    });
}

// A function to create a legend for the map
function createLegend() {
    // Create legend as a leaflet control extension
    var LegendControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
            var container = L.DomUtil.create('div', 'legend-control-container');
            L.DomEvent.disableClickPropagation(container);
            var legendTitle = '<div class="legend-title"><h3 class="title-content">Legend</h3></div>';
            $(container).append(legendTitle);

            var legendClickMe = L.DomUtil.create('div', 'legendClickMe');
            legendClickMe.innerHTML += "Click to show";
            $(container).append(legendClickMe);


            var legendContent = L.DomUtil.create('div', 'legendContent');

            var a = "<2,500 residents or <250 residents per square mile";
            var b = "2,500-9,999 residents and >250 residents per square mile"
            var c = "10,000-49,999 residents and >250 residents per square mile"   

            legendContent.innerHTML += "<b>≥100 miles from a population center</b><br>";
            legendContent.innerHTML += '<i style="background:' + getColor("1a") + '"></i> ' + "1a: " + a + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("1b") + '"></i> ' + "1b: " + b + "<br>";
            // legendContent.innerHTML += "<br>";

            legendContent.innerHTML += "<b>57-99 miles from a population center</b><br>";
            legendContent.innerHTML += '<i style="background:' + getColor("2a") + '"></i> ' + "2a: " + a + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("2b") + '"></i> ' + "2b: " + b + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("2c") + '"></i> ' + "2c: " + c + "<br>";
            // legendContent.innerHTML += "<br>";

            legendContent.innerHTML += "<b>50-74 miles from a population center</b><br>";
            legendContent.innerHTML += '<i style="background:' + getColor("3a") + '"></i> ' + "3a: " + a + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("3b") + '"></i> ' + "3b: " + b + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("3c") + '"></i> ' + "3c: " + c + "<br>";
            // legendContent.innerHTML += "<br>";

            legendContent.innerHTML += "<b>25-49 miles from a population center</b><br>";
            legendContent.innerHTML += '<i style="background:' + getColor("4a") + '"></i> ' + "4a: " + a + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("4b") + '"></i> ' + "4b: " + b + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("4c") + '"></i> ' + "4c: " + c + "<br>";
            // legendContent.innerHTML += "<br>";

            legendContent.innerHTML += "<b><25 miles from a population center</b><br>";
            legendContent.innerHTML += '<i style="background:' + getColor("5a") + '"></i> ' + "5a: " + a + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("5b") + '"></i> ' + "5b: " + b + "<br>";
            legendContent.innerHTML += '<i style="background:' + getColor("5c") + '"></i> ' + "5c: " + c + "<br>";
            legendContent.innerHTML += "<br>";

            legendContent.innerHTML += '<i style="background:' + getColor("6") + '"></i> 6: ≥50,000 residents<br>';
            // legendContent.innerHTML += "<br>";

            $(container).append(legendContent);

            return container;
        }
    });
    map.addControl(new LegendControl());

    // Add click event listener to show/hide legend
    $('.legend-control-container').on('click', function (e) {
        // Show menu if hidden
        if ($('.legendContent')[0].style.display == "" || $('.legendContent')[0].style.display == "none") {
            $('.legendContent').fadeIn(50);
            $('.legendClickMe')[0].innerHTML = 'Click to hide';
            $('.title-content').remove();
            $('.legendClickMe')[0].style.textAlign = 'right';
            $('.legendClickMe')[0].style.marginTop = '15px';
            $('.legendClickMe')[0].style.marginRight = '15px';
            $('.legendClickMe')[0].style.textDecoration = 'underline';
            $('.legendClickMe')[0].style.textDecorationColor = 'blue';
        // Hide menu if visible
        }else{
            $('.legendContent').fadeOut(50);
            $('.legendClickMe')[0].innerHTML = 'Click to show';
            var legendTitle = '<h3 class="title-content">Legend</h3>';
            $('.legend-title').append(legendTitle);
            $('.legendClickMe')[0].style.textAlign = 'center';
            $('.legendClickMe')[0].style.margin = '5px';
            $('.legendClickMe')[0].style.marginBottom = '10px';
            $('.legendClickMe')[0].style.textDecoration = 'none';
            $('.legendClickMe')[0].style.textDecorationColor = 'black';
        }

    })

}


// A recursive function to geocode and find the MURC value of each address in WI
function geoCode(addressIndex, numAddresses, succGeo) {

    var succ = false;

    // Reset latLng
    latLng = undefined;

    var address = addresses[addressIndex];

    // we are using MapQuest's Nominatim service
    var geocode = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + address;

    // use jQuery to call the API and get the JSON results
    $.getJSON(geocode, function (data) {

        // Check that the results are not empty
        if (data.length) {
            console.log(data);
            // Check that there is a result within WI, and take the first valid result
            for (i = 0; i < data.length; i++) {
                var name = Papa.parse(data[i].display_name).data[0];
                if (name[(name.length - 3)].trim() == "Wisconsin") {
                    latLng = L.latLng(data[i].lat, data[i].lon);
                    // Replace address with the full address that resulted from geocoding
                    address = data[i].display_name;
                    // Add the coordinates to the address
                    address += "<br>Latitude: " + data[i].lat + "<br>Longitude: " + data[i].lon;
                    break;
                }
            }
        }

        // Check that latLng is not undefined
        if (latLng != undefined) {

            // Check if in topoLayer polygon
            var res = leafletPip.pointInLayer(latLng, topoLayer);
            // If result has a length value, then the point was in one of the polygons
            if (res.length) {
                // Create a table row entry
                var tableRow = "<tr>";
                // Add in the values from the uploaded CSV
                for(i = 0; i < uploadedCsvData.length; i++){
                    tableRow += "<td>" + uploadedCsvData[i][addressIndex] + "</td>";
                }
                // Add in the geocoded address and MURC values and definitions
                tableRow += "<td>" + address.split("Latitude")[0] + "</td><td>" + latLng.lat + "</td><td>" + latLng.lng + "</td><td>" + res[0].feature.properties.MURC_Class + "</td><td>" +  murcDefs[res[0].feature.properties.MURC_Class] + "</td><td>" + res[0].feature.properties.MURC_3clas + "</td><td>" + murcDefs[res[0].feature.properties.MURC_3clas] + "</td></tr>";
                // Add it to the results table
                $('#resultsTable tbody').append(tableRow);

                // Add location marker to marker layer group
                var marker = L.marker(latLng);
                markers.addLayer(marker);
                var popupContent = "<b>Address:</b><br>" + address + "<br><br><b>MURC:</b><br>" + res[0].feature.properties.MURC_Class + ": "+murcDefs[res[0].feature.properties.MURC_Class]+"<br><br><b>MURC 3-Class Version:</b><br>" + murcDefs[res[0].feature.properties.MURC_3clas];
                var popup = L.popup({
                    autoPan: false
                }).setContent(popupContent);
                marker.bindPopup(popup);

                // Increment succGeo for number of successful geocodes
                succGeo++;

                // Increment the class counter
                classCounter[res[0].feature.properties.MURC_Class]++;
                classCounter[res[0].feature.properties.MURC_3clas]++;
            }
        }

    }).done(function () {
        // Once we finish the geocoding for this address

        // Check if this was the last address
        if (addressIndex == (numAddresses - 1)) {

            // If it was, finish creating the data table view
            var table = $('#resultsTable').DataTable({
                // "scrollY": "100%",
                // "scrollX": "100%",
                dom: 'Bfrtip',
                buttons: [
                    { extend: 'csvHtml5', title: 'MURC Report' }, { extend: 'excelHtml5', title: 'MURC Report' }, { extend: 'pdfHtml5', title: 'MURC Report' }
                ]
            });
            resultsTableCreated = true;

            // Check if we should print success or failure(if we geocoded anything)
            if (succGeo == 0) {
                $('#success')[0].innerHTML = 'Failure';
            } else {
                $('#success')[0].innerHTML = 'Success!';
            }

            // Add the markers to the map
            markers.addTo(map);

            // Update the number of successful geocodes in the results-content
            $('#numGeoCoded')[0].innerHTML = succGeo + ' out of ' + (numAddresses-1) + ' addresses found';

            // Snag the buttons made by DataTables and put them in the sidebar instead
            $('.dt-buttons').appendTo('#results-content');

            // Check if there was only a single address geocoded (i.e., only one marker on the map)
            if(succGeo == 1){
                // If only a single address was reverse geocoded, print overview information for that point
                $('#resultsOverview')[0].innerHTML = markers.getLayers()[0].getPopup().getContent();
            }else{
                $('#resultsOverview')[0].innerHTML = "";
            }

            // Remove the loading screen
            $('#loading-div').fadeOut(500);

            // Switch to results view
            $('#content').fadeOut(500);
            $('#results-content').fadeIn(500);
            $('#resultsTable').fadeIn(500);

        } else {
            // If this was not the last address

            // Increment addressIndex
            addressIndex++;

            var percentComplete = Math.round(((addressIndex-1) / (numAddresses-1)) * 100);

            // Update our precentage on the loading div
            $('#percentGeocoded')[0].innerHTML = percentComplete + '% Complete'

            // Call geocode on the next address
            geoCode(addressIndex, numAddresses, succGeo);
        }
    });
} // End geoCode()

$(document).ready(createmap);