const map = {
    oncreate: function (vnode) {
        console.log("initialize component")

        const google = window.google
        let map, infoWindow;

        var opts = opts = {
            center: new google.maps.LatLng(0, 0),
            zoom: 4,
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
        locationButton.addEventListener("click", () => {
            // Try HTML5 geolocation.
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };

                        infoWindow.setPosition(pos);
                        infoWindow.setContent("Location found.");
                        infoWindow.open(map);
                        map.setCenter(pos);
                    },
                    () => {
                        handleLocationError(true, infoWindow, map.getCenter());
                    }
                );
            } else {
                // Browser doesn't support Geolocation
                handleLocationError(false, infoWindow, map.getCenter());
            }
        });



        console.log(map)
    },
    view() {
        return [
            m('#mapdiv', { style: { "padding-right": "10px", width: "750px", height: "250px" } })
        ]
    }
}

export default map