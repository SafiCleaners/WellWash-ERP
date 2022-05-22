const map = {
    oncreate: function (vnode) {
        console.log("initialize component")

        // const shopLocation = { lat: -1.1542309, lng: 36.9225647 }

        const google = window.google
        let map, infoWindow;

        var opts = opts = {
            center: new google.maps.LatLng(0, 0),
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        map = new google.maps.Map(document.getElementById("mapdiv"), opts)

        infoWindow = new google.maps.InfoWindow();

        const locationButton = document.createElement("button");

        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(
                browserHasGeolocation
                    ? "Error: The Geolocation service failed."
                    : "Error: Your browser doesn't support geolocation."
            );
            infoWindow.open(map);
        }


        locationButton.textContent = "Pan to Current Location";
        locationButton.classList.add("custom-map-control-button");
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
        // locationButton.addEventListener("click", () => {
        // Try HTML5 geolocation.



        var mapBounds = new google.maps.LatLngBounds();
        const shopLocation = { lat: -1.1688730326561672, lng: 36.83084871056846 }

        // new google.maps.Marker({
        //     position: shopLocation,
        //     map,
        //     // title: "Hello World!",
        // }))

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    console.log(pos)

                    // infoWindow.setPosition(pos);
                    // infoWindow.setContent("You");
                    // infoWindow.open(map);

                    var markerList = [shopLocation, pos]

                    // draw markers
                    markerList.map(position => {
                        new google.maps.Marker({
                            position,
                            map,
                            // title: "Hello World!",
                        });
                    })

                    // zoom out to points
                    for (var i = 0; i < markerList.length; i++) {
                        var point = new google.maps.LatLng(markerList[i].lat, markerList[i].lng)
                        mapBounds.extend(point);
                    }

                    // map.setCenter(mapBounds.getCenter());

                    console.log(markerList, mapBounds)
                    // map.setCenter(pos);
                    map.fitBounds(mapBounds);
                },
                () => {
                    handleLocationError(true, infoWindow, map.getCenter());
                }
            );
        } else {
            console.error("Browser does not support geo")
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }

        // });



        console.log(map)
    },
    view() {
        return [
            m('#mapdiv', { style: { "padding-right": "10px", width: "750px", height: "250px" } })
        ]
    }
}

export default map