import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Notification } from "./entity/Notification"
import { UserHasNotification } from "./entity/UserHasNotification"
import "dotenv/config"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User, Notification, UserHasNotification],
    migrations: [],
    subscribers: [],
})
