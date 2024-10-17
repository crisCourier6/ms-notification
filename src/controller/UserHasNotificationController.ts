import { AppDataSource } from "../data-source"
import { NextFunction, Request, Response } from "express"
import { UserHasNotification } from "../entity/UserHasNotification"
import axios from "axios"

export class UserHasNotificationController {

    private userHasNotificationRepository = AppDataSource.getRepository(UserHasNotification)

    async all(req:Request, res: Response) {
        const { u, n } = req.query
        const withUser = req.query.wu === "true"
        const withNotification = req.query.wn === "true"
        const relations = []
        if (withUser){
            relations.push("user")
        }
        if (withNotification){
            relations.push("notification")
        }

        if (u && n) {
            if (typeof u !== 'string' || typeof n !== 'string'){
                res.status(400)
                return { message: 'Parámetro inválido.' }
            }
            const userHasNotifications = await this.userHasNotificationRepository.find({
                where: {userId: u, notificationId: n},
                relations: relations
            })
            return userHasNotifications
        } else if (u) {
            if (typeof u !== 'string'){
                res.status(400)
                return { message: 'Parámetro inválido.' }
            }
            const userHasNotifications = await this.userHasNotificationRepository.find({
                where: {userId: u},
                relations: relations
            })
            return userHasNotifications
        } else if (n) {
            if (typeof n !== 'string'){
                res.status(400)
                return { message: 'Parámetro inválido.' }
            }
            const userHasNotifications = await this.userHasNotificationRepository.find({
                where: {notificationId: n},
                relations: relations
            })
            return userHasNotifications
        }
        return this.userHasNotificationRepository.find({relations: relations})
    }

    async byUser(request: Request, response: Response, next: NextFunction) {
        const {id} = request.params
        const withUser = request.query.wu === "true"
        const withNotification = request.query.wn === "true"
        const count = request.query.c === "true"
        if (!id){
            response.status(400)
            return {message: "Error: id inválida"}
        }
        const relations = []

        if (count){
            const rowCount = await this.userHasNotificationRepository.count({where: {userId: id, seen: false}})
            return {count: rowCount}
        }

        if (withUser){
            relations.push("user")
        }

        if (withNotification){
            relations.push("notification")
        }

        const userHasNotification = await this.userHasNotificationRepository.find({
            where: { userId: id },
            relations: relations,
            order: {updatedAt: "DESC"}
        })

        if (!userHasNotification) {
            response.status(404)
            return {message: "Error: registro no existe"}
        }
        return userHasNotification
    }

    async create(request: Request, response: Response) {
        const { userId, notificationId } = request.body;
       
           
        const newUserHasNotification = Object.assign(new UserHasNotification(), {
            userId,
            notificationId,
            seen: false
        })

        const savedUserHasNotification = await this.userHasNotificationRepository.save(newUserHasNotification)
        return this.userHasNotificationRepository.findOne({where: {userId:userId, notificationId: notificationId}, relations: ["user", "notification"]})
        
    }
    async update(req: Request, res:Response) {
        const {id} = req.params
        if (!id){
            res.status(400)
            return {message: "Error: id inválida"}
        }
        const { notificationId, seen } = req.body;
        const updatedUserHasNotification = await this.userHasNotificationRepository.update({userId: id, notificationId: notificationId}, {seen})
        if (updatedUserHasNotification.affected === 1){
            return this.userHasNotificationRepository.findOne({
                where: {userId: id, notificationId: notificationId},
                relations: [
                    "user",
                    "notification"
                ]
            })
        }
        res.status(500)
        return {message: "Error al actualizar perfil de tienda"}

        
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        const {userId, notificationId} = request.params

        if (!userId || !notificationId){
            response.status(400)
            return {message: "Error: id inválida"}
        }

        let userHasNotificationToRemove = await this.userHasNotificationRepository.findOneBy({ userId:userId, notificationId:notificationId })
        
        if (!userHasNotificationToRemove) {
            response.status(404)
            return {message: "Error: Registro no encontrado"}
        }
        return this.userHasNotificationRepository.remove(userHasNotificationToRemove)
    }

    async removeByNotif(request: Request, response: Response, next: NextFunction) {
        const {id} = request.params

        if (!id){
            response.status(400)
            return {message: "Error: id inválida"}
        }

        const deleteResult = await this.userHasNotificationRepository.delete({ notificationId: id });
        if (deleteResult.affected > 0) {
            response.status(200)
            return {message: "Notificaciones eliminadas correctamente"}
        } 
        else {
            response.status(404)
            return {message: "No se encontraron notificaciones para eliminar" }
        }

    }

    async assign(userId:string, notificationId:string){
        return this.userHasNotificationRepository.save({userId, notificationId, seen: false})
    }

    async assignMany(users:string[], notificationId:string){
        return Promise.all(users.map(userId => this.assign(userId, notificationId)))
    }
}