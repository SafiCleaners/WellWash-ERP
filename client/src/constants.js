var client_id =
  "345449971495-4lncidafh4k98fqnr16a5bp76nmgveha.apps.googleusercontent.com";
  // "345449971495-h5hr0g4bs8tiq2u0kk4dl1icofavq4bg.apps.googleusercontent.com";
  let url = "https:/wellwash.herokuapp.com";

if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  url = "http://localhost:8002";
}

export { client_id, url };
