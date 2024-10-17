import { MainController } from "./controller/MainController"

export const Routes = [{
    method: "get",
    route: "/notification",
    controller: MainController,
    action: "notificationAll"
}, {
    method: "post",
    route: "/notification",
    controller: MainController,
    action: "notificationSave"
}, {
    method: "get",
    route: "/notification/byid/:id",
    controller: MainController,
    action: "notificationOne"
}, 
{
    method: "get",
    route: "/notification/byid/:id/sendAll",
    controller: MainController,
    action: "notificationSendAll"
},
{
    method: "patch",
    route: "/notification/byid/:id",
    controller: MainController,
    action: "notificationUpdate"
}, {
    method: "delete",
    route: "/notification/byid/:id",
    controller: MainController,
    action: "notificationRemove"
}, {
    method: "get",
    route: "/userhasnotification",
    controller: MainController,
    action: "userHasNotificationAll"
}, {
    method: "get",
    route: "/userhasnotification/byuser/:id",
    controller: MainController,
    action: "userHasNotificationByUser"
}, {
    method: "post",
    route: "/userhasnotification",
    controller: MainController,
    action: "userHasNotificationSave"
}, {
    method: "patch",
    route: "/userhasnotification/byuser/:id",
    controller: MainController,
    action: "userHasNotificationUpdate"
}, {
    method: "delete",
    route: "/userhasnotification/byuserandnotif/:userId/:notificationId",
    controller: MainController,
    action: "userHasNotificationRemove"
}, {
    method: "delete",
    route: "/userhasnotification/bynotif/:id",
    controller: MainController,
    action: "userHasNotificationRemoveByNotif"
}]