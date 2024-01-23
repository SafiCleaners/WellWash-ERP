var client_id = "857253574802-n690pf89nhrda0n6sf686ndaqagjfsc2.apps.googleusercontent.com";
// "345449971495-h5hr0g4bs8tiq2u0kk4dl1icofavq4bg.apps.googleusercontent.com";
let url = "https://seal-app-elywd.ondigitalocean.app";

if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  url = "http://localhost:8002";
}

const operationTimes = [
  "7am - 8am",
  "8am - 9am",
  "10am - 11am",
  "12am - 1pm",
  "1pm - 2pm",
  "3pm - 4pm",
  "5pm - 6pm",
  "7pm - 8pm"
]

const unitTypes = [
  "Piece(s)",
  "Kilogram(s)",
]

const clientSources = [
  "Marketting posters",
  "Passers-by",
]

const statusTypes = [
  { key: "In Progress Leads", value: "LEAD" },
  { key: "Collected", value: "COLLECTED" },
  { key: "Processing", value: "PROCESSING" },
  { key: "Quality Check", value: "QUALITY_CHECK" },
  { key: "Dispatched", value: "DISPATCHED" },
  { key: "Delivered", value: "DELIVERED" },
  { key: "Jobs Available For Pickup", value: "PICK_UP" },
  { key: "Jobs Not Processed Yet (In Queue For Wash)", value: "WASH_QUEUE" },
  { key: "Jobs Not Folded Yet (In Queue For Fold)", value: "FOLD_QUEUE" },
  { key: "Jobs Not Delivered Yet (In Queue For Delivery)", value: "DELIVERY_QUEUE" },
  { key: "Jobs Successfully Completed (SUCCESS!)", value: "COMPLETED" },
  { key: "Jobs With Confirmed Payment", value: "PAID" },
  { key: "Blocked Jobs", value: "BLOCKED" },
]

export { client_id, url, operationTimes, unitTypes, clientSources, statusTypes };
