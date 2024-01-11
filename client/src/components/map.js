import m from "mithril";

const image =
  "https://wellwash.netlify.app/assets/media/washer-logo-map-size.png";

const map = {
  oncreate: function (vnode) {
    console.log("initialize component");

    const shopLocations = [
      { lat: -1.1542309, lng: 36.9225647 },
      { lat: -1.11794, lng: 37.00889 },
      { lat: -1.13678, lng: 36.9702 },
    ];

    const google = window.google;
    let map, infoWindow;

    var opts = {
      center: new google.maps.LatLng(-1.1542309, 36.9225647),
      zoom: 12,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    map = new google.maps.Map(document.getElementById("mapdiv"), opts);

    infoWindow = new google.maps.InfoWindow();

    const locationButton = document.createElement("button");

    function handleLocationError(
      browserHasGeolocation,
      infoWindow,
      pos
    ) {
      infoWindow.setPosition(shopLocations[0]);

      // Draw markers and circles for multiple shop locations
      shopLocations.forEach((location) => {
        console.log("Adding marker for location", location);
  
        const marker = new google.maps.Marker({
          position: location,
          map: map,
          title: "WellWash...",
        });
  
        marker.setIcon({
          url: image,
          scaledSize: new google.maps.Size(50, 50),
        });
  
        const circle = new google.maps.Circle({
          map: map,
          center: new google.maps.LatLng(location.lat, location.lng),
          radius: 16093 / 5,
          fillColor: "#66B4ED",
        });
      });
  

      map.setCenter(shopLocations[0]);
    }

    locationButton.textContent = "Pan to Current Location";
    locationButton.classList.add("custom-map-control-button");

    var mapBounds = new google.maps.LatLngBounds();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          var markerList = [pos];

          // Draw markers for user location
          markerList.forEach((position) => {
            new google.maps.Marker({
              position: position,
              map: map,
              title: "You are here...",
            
            
            });
          });

          var allPoints = [...markerList, ...shopLocations];

          // Zoom out to include all points
          allPoints.forEach((point) => {
            var mapPoint = new google.maps.LatLng(point.lat, point.lng);
            mapBounds.extend(mapPoint);
          });

          // Draw circles for shop locations
          shopLocations.forEach((location) => {
            const circle = new google.maps.Circle({
              map: map,
              center: new google.maps.LatLng(location.lat, location.lng),
              radius: (16093 / 5) * 2, // 10 miles in meters
              fillColor: "#66B4ED",
            });
          });

          // Set map center and fit bounds
          map.setCenter(mapBounds.getCenter());
          map.fitBounds(mapBounds);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      console.error("Browser does not support geo");
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }

    console.log(map);
  },
  view(vnode) {
    return m("div", { style: { padding: "10px" } }, [
      m("#mapdiv", { style: { height: "500px" } }),
    ]);
  },
};

export default map;
