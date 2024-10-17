import { AppDataSource } from "../data-source"
import { NextFunction, Request, Response } from "express"
import { User } from "../entity/User"
import { v4 as uuidv4, v6 as uuidv6 } from 'uuid';
import "dotenv/config"
import axios from "axios"
import { Notification } from "../entity/Notification";

const path = require("path")
const nodeMailer = require("nodemailer")

export class NotificationController {
    private notificationRepository = AppDataSource.getRepository(Notification)

    async sendMail(email: string, subject: String, content: any){
        const transporter = nodeMailer.createTransport({
            service: "gmail",
            port: 456,
            secure: true,
            auth: {
                user: process.env.EF_MAIL,
                pass: process.env.EF_PASS
            }
        })

        const mailOptions = {
            from: `"EyesFood" <${process.env.EF_MAIL}>`,
            to: `${email}`,
            subject: subject,
            html: content
        }

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              return error
            } else { 
              return info.response
            }
        });
    }

    async all(req: Request, res:Response){
        const { n } = req.query
        const withUser = req.query.wu === "true"
        const onlyGlobal = req.query.og === "true"
        const relations = []
        if (withUser){
            relations.push("userHasNotification", "userHasNotification.user")
        }

        if (n) {
            if (typeof n !== 'string'){
                res.status(400)
                return { message: 'Parámetro inválido.' }
            }
            const notifications = await this.notificationRepository.find({
                where: {id: n},
                relations: relations,
                order: {updatedAt: "DESC"}
            })
            return notifications
        }

        if (onlyGlobal){
            const notifications = await this.notificationRepository.find({
                where: {isGlobal: true},
                relations: relations,
                order: {updatedAt: "DESC"}
            })
            return notifications
        }

        return this.notificationRepository.find({relations: relations})
    }

    async one(req: Request, res: Response) {
        const {id} = req.params
        const withUser = req.query.wu === "true"
        const relations = []
        if (withUser){
            relations.push("userHasNotification", "userHasNotification.user")
        }
        const notification = await this.notificationRepository.findOne({
            where: { id: id },
            relations: relations
        })

        if (!notification) {
            res.status(404)
            return {message:"Notificación no encontrada"}
        }
        return notification
    }

    async create(req: Request, res: Response) {
        const { title, content, isGlobal } = req.body;
        if (!title || !content){
            res.status(400)
            return {message: "Error: Datos inválidos"}
        }
        const notification = Object.assign(new Notification(), {
            title,
            content,
            isGlobal
        })

        return this.notificationRepository.save(notification)
        
    }
    async update(request: any, response: Response) {
        
        const updatedProfile = await this.notificationRepository.update(request.params.id, request.body)
        if (updatedProfile.affected===1){
            return this.notificationRepository.findOne({where: {id:request.params.id}})
            
        }
        response.status(500)
        return {message: "Error al modificar notificación"}
        
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        const id = request.params.id

        if (!id){
            response.status(400)
            return {message: "Error: id inválida"}
        }

        let notificationToRemove = await this.notificationRepository.findOneBy({ id: id })
        
        if (!notificationToRemove) {
            response.status(404)
            return {message: "Error: Notificación no encontrada"}
        }
        return this.notificationRepository.remove(notificationToRemove)
    }

    async makeNotif(title: string, content: string, isGlobal:boolean){
        return this.notificationRepository.save({title, content, isGlobal})
    }

    async updateSent(id:string, lastSentAt: Date){
        const updatedNotif = await this.notificationRepository.update(id, {lastSentAt})
        if (updatedNotif.affected===1){
            return this.notificationRepository.findOne({where: {id:id}})
        }
    }
}




