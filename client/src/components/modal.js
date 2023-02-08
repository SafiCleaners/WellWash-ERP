import m from "mithril";

const modal = {
  oncreate() {
    const $ = window.$;

    const modalNumber = Math.random().toString().split(".")[1];

    function show() {
      $("#" + modalNumber).modal({
        show: true,
        backdrop: "static",
        keyboard: false,
      });
    }

    function hide() {
      $("#" + modalNumber).modal("hide");
    }
  },
  view() {
    return m(
      "button",
      {
        class: "btn btn-secondary",
        onclick() {
          show();
        },
      },
      [
        "Show",
        m({ class: "modal" }, [
          m(
            "button",
            {
              onclick() {
                console.table("clicked")
                hide();
              },
            },
            "close"
          ),
        ]),
      ]
    );
  },
};
export default modal;
