import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { UserHasNotification } from "./UserHasNotification"

@Entity()
export class Notification {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    title: string

    @Column()
    content: string

    @Column({default: false})
    isGlobal: boolean

    @Column({default: true})
    isActive: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({nullable: true})
    lastSentAt: Date
    
    @OneToMany(() => UserHasNotification, userHasNotification => userHasNotification.notification)
    userHasNotification: UserHasNotification
}