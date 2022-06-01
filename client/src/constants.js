var client_id = "414476019901-fbo1ktmntoc7slhhr9ialqbhcflr928j.apps.googleusercontent.com";
let url = 'https://smartpaperwriters.herokuapp.com'

if ([
    "localhopst",
    "127.0.0.1"
].includes(window.location.hostname)) {
    url = 'http://localhost:8002'
}

export {
    client_id,
    url
}