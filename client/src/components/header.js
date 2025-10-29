import { url, operationTimes } from "../constants";
import { client_id } from "../constants";
import m from "mithril";
import axios from "axios";
import google_login from "./google_login";
import { DateRangePicker } from "./daterangepicker";

const onDatePickerChange = (datePicked) => {
    // localStorage.setItem("businessDate", datePicked)
    m.redraw();
};

// --- Navigation items defined as data to keep the view clean ---
const navItems = {
    create: { href: "/", icon: "fa-plus", text: "Create" },
    public: [
        { href: "/discounts", icon: "fa-money", text: "Get Discounts" },
        { href: "/about", icon: "fa-building", text: "About Us" },
        { href: "/guarantees", icon: "fa-book", text: "Guarantees" },
        { href: "/services", icon: "fa-bars", text: "Services" },
        { href: "/FAQ", icon: "fa-comment", text: "FAQ" },
    ],
    authenticated: [
        { href: "/dash", icon: "fa-area-chart", text: "Dashboard", isRouteLink: false },
        { href: "/j", icon: "fa-bath", text: "Queue", isRouteLink: false },
        { href: "/users", icon: "fa-users", text: "Users" },
        { href: "/brands", icon: "fa-microchip", text: "Brands" },
        { href: "/stores", icon: "fa-street-view", text: "Stores" },
        { href: "/pricing", icon: "fa-credit-card", text: "Pricing" },
        { href: "/clients", icon: "fa-users", text: "Clients" },
    ]
};

// --- Main Header Component ---
const header = {
    oninit(vnode) {
        vnode.state.stores = [];
        vnode.state.loading = true;
        const options = {
            method: 'GET',
            url: url + "/stores",
            headers: { 'Content-Type': 'application/json', 'authorization': localStorage.getItem('token') },
        };

        axios.request(options)
            .then(response => { vnode.state.stores = response.data; })
            .catch(error => { console.error(error); })
            .finally(() => {
                vnode.state.loading = false;
                m.redraw();
            });
    },

    view(vnode) {
        const { stores = [] } = vnode.state;
        const authToken = localStorage.getItem('authToken');
        const brand = localStorage.getItem('brand');
        const storeId = localStorage.getItem('storeId');
        const filteredStores = stores.filter(store => store.brand == brand);

        // --- Helper functions to keep the view logic clean ---
        const createNavLink = ({ href, icon, text, isRouteLink = true }) => {
            const linkTag = isRouteLink ? m.route.Link : "a";
            const isActive = window.location.pathname.includes(href) && href !== "/";
            const isHomeActive = href === "/" && window.location.pathname === "/";

            return m("li.menu-item" + (isActive || isHomeActive ? ".menu-item-active" : ""),
                m(linkTag, { class: "menu-link", href }, [
                    m(`span.svg-icon.svg-icon-xl.menu-icon`, m(`i.fa.${icon}`)),
                    m("span.menu-text", text),
                    m("span.menu-desc")
                ])
            );
        };

        const handleStoreSelect = (e, selectedStoreId) => {
            e.preventDefault();
            const params = new URLSearchParams(window.location.search);
            if (selectedStoreId) {
                localStorage.setItem('storeId', selectedStoreId);
                params.set('storeId', selectedStoreId);
            } else {
                localStorage.removeItem('storeId');
                params.delete('storeId');
            }
            const query = params.toString();
            window.history.replaceState({}, '', `${window.location.pathname}${query ? '?' + query : ''}`);
            m.redraw();
        };

        const handleSignOut = () => {
            localStorage.clear();
            const signOutPromise = window.gapi?.auth2 ? window.gapi.auth2.getAuthInstance().signOut() : Promise.resolve();
            signOutPromise.finally(() => window.location.reload());
        };

        // --- Main Render Function ---
        return m(".header.header-fixed#kt_header",
            m(".container", [
                // Navigation Menu
                m(".header-menu-wrapper.header-menu-wrapper-left#kt_header_menu_wrapper", { style: "margin:10px; border-radius:10px;" },
                    m(".header-menu.header-menu-left.header-menu-mobile.header-menu-layout-default#kt_header_menu",
                        m("ul.menu-nav", [
                            createNavLink(navItems.create),
                            ...(authToken ? navItems.authenticated : navItems.public).map(createNavLink)
                        ])
                    )
                ),
                // Topbar with controls and user menu
                m(".topbar",
                    authToken ? [
                        // Store Dropdown
                        m(".topbar-item.mr-2[data-toggle=dropdown]", [
                             m("button.btn.btn-md.btn-secondary.dropdown-toggle[type=button][data-toggle=dropdown]",
                                !storeId ? "All Stores" : (stores.find(s => s._id == storeId)?.title || "All Stores")
                            ),
                            console.log(filteredStores),
                            m(".dropdown-menu", [
                                m("a.dropdown-item", { onclick: e => handleStoreSelect(e, null) }, "All Stores"),
                                ...filteredStores.map(store =>
                                    m("a.dropdown-item", { onclick: e => handleStoreSelect(e, store._id) }, store.title)
                                )
                            ])
                        ]),

                        // Date Range Picker
                        m(".topbar-item.mr-3",
                            m(DateRangePicker, {
                                class: "btn btn-md btn-secondary dropdown-toggle",
                                placeholder: "Select Business Day",
                                onChange: onDatePickerChange
                            })
                        ),

                        // -- NEW: Redesigned User Profile Dropdown --
                        m(".topbar-item[data-toggle=dropdown]", [
                            // Dropdown Trigger: Just the user avatar
                            m("button.btn.btn-icon.btn-icon-mobile.w-auto.btn-clean.d-flex.align-items-center.btn-lg.px-2[data-toggle=dropdown]",
                                m("span.symbol.symbol-35.symbol-light-success",
                                    m("img", {
                                        src: localStorage.getItem('imageUrl'),
                                        style: { borderRadius: "50%" }
                                    })
                                )
                            ),
                            // Dropdown Menu Content
                            m(".dropdown-menu.dropdown-menu-md.dropdown-menu-right.p-0", [
                                // Dropdown Header
                                m(".d-flex.align-items-center.p-4", [
                                    m(".symbol.symbol-45.symbol-light-primary.mr-3",
                                         m("img", {
                                            src: localStorage.getItem('imageUrl'),
                                            style: { borderRadius: "50%" }
                                        })
                                    ),
                                    m("div", [
                                        m("div.font-weight-bold.text-dark-75", localStorage.getItem('name')),
                                        m("div.text-muted.font-size-sm", localStorage.getItem('email'))
                                    ])
                                ]),
                                m(".dropdown-divider"),
                                // Dropdown Menu Items
                                m(".navi.navi-spacer-y-5",
                                    m("a.navi-item", { onclick: handleSignOut },
                                        m(".navi-link", [
                                            m(".navi-icon.mr-2", m("i.fa.fa-power-off")),
                                            m("span.navi-text", "Sign Out")
                                        ])
                                    )
                                )
                            ])
                        ])
                    ] :
                    // Login Button for unauthenticated users
                    m("div", { style: { margin: "auto" } }, m(google_login))
                )
            ])
        );
    }
};

export default header;