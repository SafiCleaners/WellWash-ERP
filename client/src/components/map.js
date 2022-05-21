const map = {
    oncreate: function (vnode) {
        console.log("initialize component")

        const google = window.google

        var opts = opts = {
            center: new google.maps.LatLng(0, 0),
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        var map = new google.maps.Map(document.getElementById("mapdiv"), opts)

        console.log(map)
    },
    view() {
        return m('#mapdiv', { width: "500px", height: "500px" })
    }
}

export default map