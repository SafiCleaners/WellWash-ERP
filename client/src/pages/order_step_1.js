import price_calculator from "../components/calculator"
import steps from "../components/steps"
import m from "mithril"
// import Order from "./order";

const step = () => {
    return {
        view() {
            return m("div", { "class": "row d-flex h-100" },
                [
                    m(steps),

                    m("div", { "class": "col-sm-12 col-md-12 col-lg-12 card special-card2", "id": "price_calculator" }, m(price_calculator)),
                    // m(Order)
                ]
            )
        }
    }
}

export default step