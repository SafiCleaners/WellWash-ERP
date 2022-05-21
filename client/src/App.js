var root = document.getElementById("order_reciever")

import _ from "lodash"
import header from "./components/header"
import subheader from "./components/subheader"


import landing from "./components/landing"


import Order from "./pages/order";
import order_1 from "./pages/order_step_1";
import OrderList from "./pages/orderlist";
import OrderItem from "./pages/order_item";
import thankyou from "./components/thankyou";

import users from "./pages/users";

m.mount(document.getElementById("kt_header_in"), header)
m.mount(document.getElementById("subheader"), subheader)
m.route(root, "/", {
    "/": landing,
    "/order1": order_1,
    // "/order2": Order,
    "/joblist": OrderList,
    "/joblist/:job": OrderItem,
    "/thankyou": thankyou,
    "/users": users
})