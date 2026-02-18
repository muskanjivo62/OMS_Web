import { api } from './api';

export interface CreateUserData{
    name : String,
    username :String,
    password :String,
    email? :String,
    phone? :String,
    role :String,
    company?:number |null;
    main_group?:number[];
    state?:number[];
}

export const userService={
    createUser : async (data : CreateUserData)=>{
        return await api.post('/auth/users/create/',data);
    }
}