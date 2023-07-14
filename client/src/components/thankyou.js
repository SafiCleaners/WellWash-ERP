import m from "mithril"

const thankyou = () => {
    return {
        oninit(vnode) {

            const order = vnode.attrs.order;
            const jobUrl = order.jobUrl;
            console.log("vnode attributes:", vnode.attrs);
            console.log("order:", order);

            setTimeout(() => {
               
                console.log("Redirecting to /thankyou");
                const encodedjobUrl = encodeURIComponent(jobUrl);
                const whatsappLink = "https://api.whatsapp.com/send?phone=+254701173735&text=Hello! Can you help me with my laundry? Order URL: ";
                window.location.href = whatsappLink + encodedjobUrl;
            }, 5000);
        },

        view(vnode) {
            const order = vnode.attrs.order;
            const orderUrl = order.orderUrl;

            // Access and use the order data as needed
            console.log(order);
            var {
                pickupDay,
                dropOffDay,
                pickupTime,
                dropOffTime,
                appartmentName,
                houseNumber,
                moreDetails,
                curtains,
                blankets,
                duvets,
                generalKgs,
                mpesaPhoneNumber,
                phone,
                mpesaConfirmationCode,
                clientName
            } = vnode.state
            // console.log("pickupDay:", pickupDay);

            // console.table({
            //     pickupDay,
            //     dropOffDay,
            //     pickupTime,
            //     dropOffTime,
            //     appartmentName,
            //     houseNumber,
            //     moreDetails,
            //     curtains,
            //     blankets,
            //     duvets,
            //     generalKgs,
            //     mpesaPhoneNumber,
            //     phone,
            //     mpesaConfirmationCode,
            //     name
            // })

            return m("div", { "class": "card-body" },

                m("form",
                    [
                        m("div", { "class": "form-group row" },
                            [
                                m("div", { "class": "bs-stepper" },
                                    [
                                        m("div", { "class": "bs-stepper-header", "role": "tablist" },
                                            [
                                                m("div", { "class": "step", "data-target": "#logins-part" },
                                                    m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                                        [
                                                            m("span", { "class": "bs-stepper-circle" },
                                                                "#"
                                                            ),
                                                            m("span", { "class": "bs-stepper-label" },
                                                                "Your order was received successfully"
                                                            )
                                                        ]
                                                    )
                                                )]
                                        )]
                                ),
                            ]
                        ),
                        m("div", { "class": "p-5 text-center bg-image rounded-3", "style": { "    background-image": "url('https", "height": "400px" } },
                            m("div",
                                m("div", { "class": "d-flex justify-content-center align-items-center h-200" },
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
                                                "Our Team is working on it"
                                            ),
                                            m("h4", { "class": "mb-3" },
                                                "For further tracking please check the details on the table on the first page."
                                            ),
                                            m("h5", { "class": "mb-3" },
                                                "Make sure to sign in with google and talk to us on whatsapp"
                                            ),
                                            m("h1", [
                                                m("a", { href: "https://api.whatsapp.com/send?phone=+254701173735" }, "Thank you for your order!")
                                            ]),

                                        ]
                                    )
                                )
                            )
                        )


                        // order ends here 
                    ]
                )
            )
        },
    }

}

export default thankyou;