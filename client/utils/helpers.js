const getStatusTitle = (status) => {
    if (status === "LEAD") return "In Progress Leads";
    if (status === "COLLECTED") return "Collected";
    if (status === "PROCESSING") return "Processing";
    if (status === "QUALITY_CHECK") return "Quality Check";
    if (status === "DISPATCHED") return "Dispatched";
    if (status === "DELIVERED") return "Delivered";
    if (status === "PICK_UP") return "Jobs Available For Pickup";
    if (status === "WASH_QUEUE") return "Jobs Not Processed Yet (In Queue For Wash)";
    if (status === "FOLD_QUEUE") return "Jobs Not Folded Yet (In Queue For Fold)";
    if (status === "DELIVERY_QUEUE") return "Jobs Not Delivered Yet (In Queue For Delivery)";
    if (status === "COMPLETED") return "Jobs Successfully Completed (SUCCESS!)";
    if (status === "PAID") return "Jobs With Confirmed Payment";
    if (status === "BLOCKED") return "Blocked Jobs";
    return "N/A";
}

export { getStatusTitle };