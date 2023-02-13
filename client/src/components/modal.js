import m from "mithril";

const modal = {
  view(vnode) {
    return [
      m(
        "button",
        {
          class: "btn  " + vnode.attrs.btnColorClass,
          type: "button",
          "data-toggle": "modal",
          "data-target": "#" + vnode.attrs.modalName,
        },
        vnode.attrs.btnText
      ),
      m(
        "div",
        {
          class: "modal fade",
          id: "" + vnode.attrs.modalName,
          tabindex: "-1",
          role: "dialog",
          "aria-labelledby": "exampleModalLongTitle",
          "aria-hidden": "true",
        },
        m(
          "div",
          { class: "modal-dialog", role: "document" },
          m("div", { class: "modal-content" }, [
            m("div", { class: "modal-header" }, [
              m(
                "h5",
                { class: "modal-title", id: "exampleModalLongTitle" },
                vnode.attrs.title
              ),
              m(
                "button",
                {
                  class: "close",
                  type: "button",
                  "data-dismiss": "modal",
                  "aria-label": "Close",
                },
                m("span", { "aria-hidden": "true" }, m.trust("&times;"))
              ),
            ]),
            m("div", { class: "modal-body" }, vnode.children),
            m("div", { class: "modal-footer" }, [
              m(
                "button",
                {
                  class: "btn btn-secondary",
                  type: "button",
                  "data-dismiss": "modal",
                },
                "Close"
              ),
              m(
                "button",
                {
                  class: "btn btn-primary",
                  type: "button",
                  onlick() {
                    console.log("save changes was clicked internal");
                  },
                },
                vnode.attrs.footerBtnText
              ),
            ]),
          ])
        )
      ),
    ];
  },
};
export default modal;
