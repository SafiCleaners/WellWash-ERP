const image =
    "https://safi-washers.netlify.app/assets/media/washer-logo-map-size.png";


const map = {
    oncreate: function (vnode) {
        console.log("initialize component")

        const shopLocation = { lat: -1.1542309, lng: 36.9225647 }

        const google = window.google
        let map, infoWindow;

        var opts = opts = {
            center: new google.maps.LatLng(0, 0),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        map = new google.maps.Map(document.getElementById("mapdiv"), opts)

        infoWindow = new google.maps.InfoWindow();

        const locationButton = document.createElement("button");

        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(shopLocation);
            // infoWindow.setContent(
            //     browserHasGeolocation
            //         ? "Error: The Geolocation service failed."
            //         : "Error: Your browser doesn't support geolocation."
            // );
            // infoWindow.open(map);

            const imageList = [
                shopLocation
            ]

            // draw markers
            // imageList.map(position => {
            //     new google.maps.Marker({
            //         position,
            //         map,
            //         // title: "Hello World!",
            //         icon: image
            //     });
            // })

            // draw markers
            // imageList.map(position => {
            //     new google.maps.Marker({
            //         position,
            //         map,
            //     });
            // })

            // draw cicle around shop
            // Add circle overlay and bind to marker
            var circle = new google.maps.Circle({
                map: map,
                radius: (16093 / 5),    // 10 miles in metres
                fillColor: '#66B4ED'
            });
            circle.bindTo('center', new google.maps.Marker({
                position: shopLocation,
                map,
                title: "Safi washers...",
                icon: image
            }), 'position');

            map.setCenter(shopLocation);
        }


        locationButton.textContent = "Pan to Current Location";
        locationButton.classList.add("custom-map-control-button");
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
        // locationButton.addEventListener("click", () => {
        // Try HTML5 geolocation.



        var mapBounds = new google.maps.LatLngBounds();
        // const shopLocation = { lat: -1.1688730326561672, lng: 36.83084871056846 }

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

                    var markerList = [
                        pos
                    ]


                    const imageList = [
                        shopLocation
                    ]

                    // calculate distance between them
                    var rad = function (x) {
                        return x * Math.PI / 180;
                    };

                    var getDistance = function (p1, p2) {
                        var R = 6378137; // Earth’s mean radius in meter
                        var dLat = rad(p2.lat - p1.lat);
                        var dLong = rad(p2.lng - p1.lng);
                        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
                            Math.sin(dLong / 2) * Math.sin(dLong / 2);
                        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        var d = R * c;
                        return d; // returns the distance in meter
                    };

                    const distance = getDistance(shopLocation, pos)
                    console.log({ distance })

                    vnode.state.distanceOfUserFromShop = distance

                    // draw markers
                    // imageList.map(position => {
                    //     new google.maps.Marker({
                    //         position,
                    //         map,
                    //         // title: "Hello World!",
                    //         icon: image
                    //     });
                    // })

                    // draw markers
                    markerList.map(position => {
                        new google.maps.Marker({
                            position,
                            map,
                            title: "You are here...",
                        });
                    })


                    var allPoints = [...markerList, ...imageList]

                    // zoom out to points
                    for (var i = 0; i < allPoints.length; i++) {
                        var point = new google.maps.LatLng(allPoints[i].lat, allPoints[i].lng)
                        mapBounds.extend(point);
                    }

                    // draw cicle around shop
                    // Add circle overlay and bind to marker
                    var circle = new google.maps.Circle({
                        map: map,
                        radius: (16093 / 5),    // 10 miles in metres
                        fillColor: '#66B4ED'
                    });
                    circle.bindTo('center', new google.maps.Marker({
                        position: shopLocation,
                        map,
                        title: "Safi washers...",
                        icon: image
                    }), 'position');

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
    view(vnode) {
        return m("div", { style: { "padding": "10px" } }, [
            m('#mapdiv', { style: { height: "250px" } }),
            // vnode.state.distanceOfUserFromShop && vnode.state.distanceOfUserFromShop > (16093 / 5) 
            //     ? m("h3"," you seem to be too far away from us. we dont service deliveries that far")
            //     : `You seem to be close by. Free delivery and pickup is available ${Math.floor(Number(vnode.state.distanceOfUserFromShop))} meters`
        ])
    }
}

export default map