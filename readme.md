# setup

> You will require docker and docker-compose installed as well as be running node v16 

open three terminals from within the folder do the following on the separate terminals:

`docker-compose up`

other terminal:

`yarn dev`

then for the client on the other other terminal

```bash
cd ./client
yarn dev
```
> Incase this doesnt work:You may have forgotten to yarn install twice, on the root folder as well as ./client


# How to use the modal
Thsi should prbably be broken down into like two components or something

```js
m(
  modal,
  {
    modalName: "test",
    title: "TestModal",
    btnColorClass: "btn-danger btn-lg",
    btnText: "Login",
    footerBtnText: "Save Changes",
    onclickHandler: function (e) {
      console.log("savechnages was clicked");
    },
  },
  [m(google_login)]
)
```
- modalName:unique identifier for the modal
- title: the title text for the modal
- btnColorClass: classes that will be added the the open button for the modal
- btnText: Text for the modal open button
- footerBtnText: There is a footer button
- onclickHandler: callback function for the onclick event of the footer button

# Lessons

## 1.Google login only works on localhost:port not on 127.0.0.1:port