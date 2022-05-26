import m from "mithril"
export default () => {
    return {
        view() {
            return m("div", { "class": "p-5 text-center bg-image rounded-3", "style": { "    background-image": "url('https", "height": "400px" } },
                m("div",
                    m("div", { "class": "d-flex justify-content-center align-items-center h-100" },
                        m("div", { "class": "text-black" },
                            [
                                m("div", { "class": "d-flex flex-row justify-content-center align-items-center" }, m("img", {
                                    src: "assets/media/washer-logo.png",
                                    style: {
                                        "max-width": "30%"
                                    }
                                })),
                                m("h1", { "class": "mb-3" },
                                    "Your Order was recieved successfully"
                                ),
                                m("h4", { "class": "mb-3" },
                                    "A writer is working on it"
                                ),
                                m("h4", { "class": "mb-3" },
                                    "For further communication please write is a message on the buble below"
                                )
                            ]
                        )
                    )
                )
            )
        }
    }
}