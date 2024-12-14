import * as express from "express"
import * as bodyParser from "body-parser"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { Routes } from "./routes"
import * as amqp from "amqplib/callback_api"
import { Channel } from "amqplib"
import "dotenv/config"
import { UserController } from "./controller/UserController"
import { NotificationController } from "./controller/NotificationController"
import { UserHasNotificationController } from "./controller/UserHasNotificationController"

AppDataSource.initialize().then(async () => {
    amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
        if(error0){
            throw error0
        }

        connection.createChannel(async (error1, channel)=>{
            if (error1){
                throw error1
            }

            const userController = new UserController
            const notificationController = new NotificationController
            const userHasNotificationController = new UserHasNotificationController
            
            channel.assertExchange("Notification", "topic", {durable: false})

            channel.assertExchange("Accounts", "topic", {durable: false})
            channel.assertExchange("FoodEdit", "topic", {durable: false})

            channel.assertQueue("Notification_Accounts", {durable: false})
            channel.bindQueue("Notification_Accounts", "Accounts", "user.*")

            channel.assertQueue("Notification_FoodEdit", {durable: false})
            channel.bindQueue("Notification_FoodEdit", "FoodEdit", "submission.*")
            
            // create express app
            const app = express()
            app.use(bodyParser.json())

            // register express routes from defined application routes
            Routes.forEach(route => {
                (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
                    const result = (new (route.controller as any))[route.action](req, res, next)
                    if (result instanceof Promise) {
                        result.then(result => result !== null && result !== undefined ? res.send(result) : undefined)

                    } else if (result !== null && result !== undefined) {
                        res.json(result)
                    }
                })
            })

            channel.consume("Notification_Accounts", async (msg)=>{
                let action = msg.fields.routingKey.split(".")[1]
                let entity = msg.fields.routingKey.split(".")[0]
                if (entity==="user"){
                    if (action=="create"){
                        let content = JSON.parse(msg.content.toString())
                        let trimmedContent = {...content}
                        await userController.create(trimmedContent)
                        .then(async result=>{
                            console.log(result)
                            if (result.activationToken){
                                const activationMail = `<h5>
                                    Siga el siguiente enlace para activar su cuenta de EyesFood
                                    (fecha de vencimiento: ${result.activationExpire.toLocaleDateString("es-CL", { year: 'numeric', 
                                                                                                                    month: 'long', 
                                                                                                                    day: 'numeric',
                                                                                                                    hour: "numeric",minute: "numeric" })}):
                                    </h5> 
                                    <a href="${process.env.EF_MAIN_REMOTE}/activate/${result.id}/${result.activationToken}">Activar cuenta</a>`
                                await notificationController.sendMail(result.email, "Activar cuenta EyesFood", activationMail)
                                .then(response => {
                                    console.log(response)
                                })
                                .catch(error => {
                                    console.log(error)
                                })
                            }
                        })
                        .catch(error=>console.log(error))
                    }
                    else if (action=="update"){
                        let content = JSON.parse(msg.content.toString())
                        let trimmedContent = {...content, expertProfile: undefined, storeProfile:undefined, userHasRole:undefined}
                        let oldUser = await userController.oneById(content.id)
                        if (oldUser){
                            if (oldUser.isPending){
                                if (!oldUser.isActive && content.isActive){
                                    const mailContent = `<h5> 
                                    Buenas noticias ${oldUser.name}, tu solicitud ha sido aprobada y ahora puedes iniciar sesión en EyesFood.
                                    </h5>
                                    <a href=${process.env.EF_MAIN_REMOTE}>Ir a EyesFood</a>`

                                    await notificationController.sendMail(oldUser.email, "Cuenta EyesFood activada", mailContent)
                                }
                            }
                            else if (!oldUser.isSuspended && content.isSuspended){
                                const mailContent = `<h5> 
                                    ${oldUser.name}, tu cuenta ha sido suspendida. Si quieres restaurarla, comunicate con nosotros
                                    enviando un correo a este mismo email
                                    </h5>`
                                    await notificationController.sendMail(oldUser.email, "Cuenta EyesFood suspendida", mailContent)
                            }

                            else if (oldUser.isSuspended && !content.isSuspended){
                                const mailContent = `<h5> 
                                    Buenas noticias ${oldUser.name}, tu cuenta ha sido restaurada. Puedes volver a iniciar sesión y utilizar 
                                    los servicios de EyesFood
                                    </h5>
                                    <a href=${process.env.EF_MAIN_REMOTE}>Ir a EyesFood</a>`
                                    await notificationController.sendMail(oldUser.email, "Cuenta EyesFood restaurada", mailContent)
                            }
                        }
                        console.log("i should update the user with id: ", trimmedContent)
                        await userController.update(content)
                        .then(async result=>{
                            console.log(result)
                        })
                        .catch(error=>console.log(error))
                    }
                    else if (action=="remove"){
                        let content = JSON.parse(msg.content.toString())
                        let oldUser = await userController.oneById(content)
                        if (oldUser){
                            if (oldUser.isActive){
                                const mailContent = `<h5> 
                                ${oldUser.name}, tu cuenta EyesFood ha sido eliminada.
                                </h5>`
                                await notificationController.sendMail(oldUser.email, "Cuenta EyesFood eliminada", mailContent)
                            }
                            else if (oldUser.isPending){
                                const mailContent = `<h5> 
                                ${oldUser.name}, tu solicitud ha sido rechazada. Puedes comunicarte con un administrador
                                enviando un coreo a este mismo email.
                                </h5>`
                                await notificationController.sendMail(oldUser.email, "Solicitud de cuenta EyesFood rechazada", mailContent)
                            }
                            console.log("i should delete the user with id: ", content)
                            let removedUser = await userController.remove(content)
                            console.log(removedUser)
                        }
                    }
                }
            }, {noAck: true})

            channel.consume("Notification_FoodEdit", async (msg)=>{
                let action = msg.fields.routingKey.split(".")[1]
                let entity = msg.fields.routingKey.split(".")[0]
                if (entity==="submission"){
                    if (action==="judged"){
                        let content = JSON.parse(msg.content.toString())
                        let {judgeId, userId} = content
                        if (judgeId && userId){
                            let judge = await userController.oneById(judgeId)
                            let message = ""
                            let title = ""
                            if (content.state === "accepted"){
                                title = "Aporte aceptado"
                                message = `Tu aporte de información del alimento ${content.foodName} fue aceptado por ${judge.name}.`
                            }
                            else if (content.state === "rejected"){
                                title = "Aporte rechazado"
                                message = `Tu aporte de información del alimento ${content.foodName} fue rechazado por ${judge.name} (Razón: ${content.rejectReason}).`
                            }
                            const notif = await notificationController.makeNotif(title, message, false)
                            console.log(notif)
                            if (notif){
                                await userHasNotificationController.assign(userId, notif.id)
                                .then(result => console.log(result))
                            }
                        }
                        
                    }
                }
            }, {noAck: true})
            

            // setup express app here
            // ...

            // start express server
            app.listen(process.env.PORT)

            console.log(`Express server has started on port ${process.env.PORT}. Open http://localhost:${process.env.PORT}/notification to see results`)
            
            process.on("beforeExit", ()=>{
                console.log("closing")
                connection.close()
            })
        })
    })
}).catch(error => console.log(error))

