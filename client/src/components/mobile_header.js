import {
    url,
    operationTimes
} from "../constants"
import {
    client_id
} from "../constants"
import m from "mithril"
import axios from "axios"
import google_login from "./google_login"

import { DateRangePicker } from "./daterangepicker";

const onDatePickerChange = (datePicked) => {
    localStorage.setItem("businessDate", datePicked)
    m.redraw()
}

const header = {
    oncreate(vnode) {
        vnode.state.stores = []
        if (!localStorage.getItem("businessDate")) {
            localStorage.setItem("businessDate", new Date().toISOString().split('T')[0])
        }

        const options = {
            method: 'GET', url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.stores = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    view(vnode) {
        return [
            m("a", { "href": "index.html" },
                m("img", { "class": "max-h-30px", "alt": "Logo", "src": "assets/media/exported-wellwash-new.png" })
            ),
            m("div", { "class": "d-flex align-items-center" },
                m("div", { "class": "d-flex align-items-center" },
                    m("button", { "class": "btn p-0 rounded-0 ml-4", "id": "kt_header_mobile_toggle" },
                        m("span", { "class": "svg-icon svg-icon-xxl" },
                            m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                    [
                                        m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                        m("rect", { "fill": "#000000", "x": "4", "y": "4", "width": "7", "height": "7", "rx": "1.5" }),
                                        m("path", { "d": "M5.5,13 L9.5,13 C10.3284271,13 11,13.6715729 11,14.5 L11,18.5 C11,19.3284271 10.3284271,20 9.5,20 L5.5,20 C4.67157288,20 4,19.3284271 4,18.5 L4,14.5 C4,13.6715729 4.67157288,13 5.5,13 Z M14.5,4 L18.5,4 C19.3284271,4 20,4.67157288 20,5.5 L20,9.5 C20,10.3284271 19.3284271,11 18.5,11 L14.5,11 C13.6715729,11 13,10.3284271 13,9.5 L13,5.5 C13,4.67157288 13.6715729,4 14.5,4 Z M14.5,13 L18.5,13 C19.3284271,13 20,13.6715729 20,14.5 L20,18.5 C20,19.3284271 19.3284271,20 18.5,20 L14.5,20 C13.6715729,20 13,19.3284271 13,18.5 L13,14.5 C13,13.6715729 13.6715729,13 14.5,13 Z", "fill": "#000000", "opacity": "0.3" })
                                    ]
                                )
                            )
                        )
                    )
                )
            ),
        ]
    }
}

export default header