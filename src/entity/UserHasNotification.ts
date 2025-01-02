import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn, UpdateDateColumn } from "typeorm"
import { User } from "./User"
import { Notification } from "./Notification"

@Entity()
export class UserHasNotification {

    @PrimaryColumn()
    userId: string

    @PrimaryColumn()
    notificationId: string

    @Column()
    seen: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @ManyToOne(()=>User, user => user.userHasNotification, {onDelete: "CASCADE"})
    @JoinColumn({name: "userId"})
    user: User

    @ManyToOne(()=>Notification, notification => notification.userHasNotification, {onDelete: "CASCADE"})
    @JoinColumn({name: "notificationId"})
    notification: User

}