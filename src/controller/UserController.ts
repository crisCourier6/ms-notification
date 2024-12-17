import { AppDataSource } from "../data-source"
import { NextFunction, Request, Response } from "express"
import { User } from "../entity/User";
import { v4 as uuidv4, v6 as uuidv6 } from 'uuid';
import "dotenv/config"
import axios from "axios"

export class UserController {

    private userRepository = AppDataSource.getRepository(User)

    async create(req: any) {
        const createdUser = await this.userRepository.save(req)
        return this.userRepository.findOne({where: {id: createdUser.id}})
    }
    async update(req: any) {
        const {id, storeProfile, expertProfile, userHasRole, lostPass, ...user } = req
        if (!id) {
            return "id inválida"
        }
       return this.userRepository.update(id, user)
    }
    async remove(id:string) {
        let userToRemove = await this.userRepository.findOne({where: {id: id}})
        if (userToRemove){
            return this.userRepository.remove(userToRemove)
        }
        else{
            return "el usuario no existe"
        }
        
    }
    async oneById(id:string ) {
        return this.userRepository.findOne({
            where: { id: id },
        })
    }

    async getAllIds(){
        const users = await this.userRepository.find({
            select: ["id"]
        })
        return users.map(user => user.id)
    }

}