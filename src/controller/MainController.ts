import { NextFunction, Request, Response } from "express"
import { Channel } from "amqplib"
import axios from "axios"
import "dotenv/config"
import { UserController } from "./UserController"
import { NotificationController } from "./NotificationController"
import { UserHasNotificationController } from "./UserHasNotificationController"
import { Notification } from "../entity/Notification"

export class MainController{

    private notificationController = new NotificationController
    private userHasNotificationController = new UserHasNotificationController
    private userController = new UserController
    // user rates expert

    // notificationAll() retorna todos los diarios alimenticios
    async notificationAll(req: Request, res: Response, next: NextFunction, channel: Channel) {
        return this.notificationController.all(req, res)  
    }

    // notificationOne() retorna el diario alimenticio con la id indicada
    async notificationOne(req: Request, res: Response, next: NextFunction, channel: Channel) {
        return this.notificationController.one(req, res)
    }
    // notificationSave() crea un diario nuevo con los datos provenientes en la request y lo retorna
    async notificationSave(req: Request, res: Response, next: NextFunction, channel: Channel) {
        const {sendIt} = req.body
        const newNotif =  await this.notificationController.create(req, res) as Notification
        if (res.statusCode<400){
            if (sendIt){
                try {
                    const userIds = await this.userController.getAllIds();
                    await this.userHasNotificationController.assignMany(userIds, newNotif.id);
                    const newDate = new Date();
                    const updatedNewNotif = await this.notificationController.updateSent(newNotif.id, newDate);
                    return updatedNewNotif; // Return the updated notification with the new date
                } catch (error) {
                    console.log(error);
                    return newNotif; // In case of an error, return the original notification
                }
            }
            return newNotif
        }
        else{
            return newNotif
        }
    }

    // notificationUpdate() modifica los datos de un diario y retorna el resultado
    async notificationUpdate(req: Request, res: Response, next: NextFunction, channel: Channel) {
        return this.notificationController.update(req, res)
    }
    // notificationRemove() elimina el diario con el id indicado en los parámetros de la uri
    async notificationRemove(req: Request, res: Response, next: NextFunction, channel: Channel){
        return this.notificationController.remove(req, res, next)
    }

    async  notificationSendAll(req:Request, res: Response, next:NextFunction, channel:Channel){
        const {id} = req.params
        const userIds = await this.userController.getAllIds();
        await this.userHasNotificationController.assignMany(userIds, id);
        const newDate = new Date();
        const updatedNewNotif = await this.notificationController.updateSent(id, newDate);
        return updatedNewNotif; // Return the updated notification with the new date
    }

    // food advice

    // userHasNotificationAll() retorna todos los diarios alimenticios
    async userHasNotificationAll(req: Request, res: Response, next: NextFunction, channel: Channel) {
        return this.userHasNotificationController.all(req, res)  
    }

    // userHasNotificationOne() retorna el diario alimenticio con la id indicada
    async userHasNotificationByUser(req: Request, res: Response, next: NextFunction, channel: Channel) {
        return this.userHasNotificationController.byUser(req, res, next)
    }
    // userHasNotificationSave() crea un diario nuevo con los datos provenientes en la request y lo retorna
    async userHasNotificationSave(req: Request, res: Response, next: NextFunction, channel: Channel) {
       return this.userHasNotificationController.create(req, res)
    }

    // userHasNotificationUpdate() modifica los datos de un diario y retorna el resultado
    async userHasNotificationUpdate(req: Request, res: Response, next: NextFunction, channel: Channel) {
        return this.userHasNotificationController.update(req, res)
    }
    // userHasNotificationRemove() elimina el diario con el id indicado en los parámetros de la uri
    async userHasNotificationRemove(req: Request, res: Response, next: NextFunction, channel: Channel){
        return this.userHasNotificationController.remove(req, res, next)
    }
    // userHasNotificationRemove() elimina el diario con el id indicado en los parámetros de la uri
    async userHasNotificationRemoveByNotif(req: Request, res: Response, next: NextFunction, channel: Channel){
        return this.userHasNotificationController.removeByNotif(req, res, next)
    }
}