import _ from "lodash"
import m from "mithril"
import header from "./components/header"
import subheader from "./components/subheader"


import landing from "./components/landing"


import order_step_1 from "./pages/order_step_1";
import OrderList from "./pages/orderlist";
import OrderItem from "./pages/order_item";
import OrderItemCreate from "./pages/order_item_new";
import OrderItemPrint from "./pages/order_item_print";
import thankyou from "./components/thankyou";
import refferal from "./components/refferal.js";

import users from "./pages/users";

import stores from "./pages/stores";
import pricing from "./pages/pricing";
import orders from "./pages/orders";
import tasks from "./pages/tasks";

var root = document.getElementById("order_reciever")

m.mount(document.getElementById("kt_header_in"), header)
m.mount(document.getElementById("subheader"), subheader)

m.route.prefix = ''

m.route(root, "/", {
    "/": order_step_1,
    "/j": OrderList,
    "/j/:job": OrderItem,
    "/q": OrderList,
    "/q/:job": OrderItem,
    "/q-new": OrderItemCreate,
    "/j/:job/print": OrderItemPrint,
    "/thankyou": thankyou,
    "/users": users,
    "/REFFER/:REFEERED_BY": refferal,
    "/refferal": refferal,
    "/stores": stores,
    "/pricing": pricing,
    "/orders": orders,
    "/tasks": tasks,
})