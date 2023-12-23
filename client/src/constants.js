var client_id = "345449971495-4lncidafh4k98fqnr16a5bp76nmgveha.apps.googleusercontent.com";
// "345449971495-h5hr0g4bs8tiq2u0kk4dl1icofavq4bg.apps.googleusercontent.com";
let url = "https://seal-app-elywd.ondigitalocean.app";

if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  url = "http://localhost:8002";
}

const operationTimes = [
  "7am - 8am",
  "8am - 9am",
  "10am - 11am",
  "12am - 1pm",
  "1pm - 2pm",
  "3pm - 4pm",
  "5pm - 6pm",
  "7pm - 8pm"
]

const unitTypes = [
  "Piece(s)",
  "Kilogram(s)",
]

export { client_id, url, operationTimes, unitTypes };
