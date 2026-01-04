export class UserResponseDto {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(user: any) {
        this.id = user.id;
        this.email = user.email;
        this.role = user.role;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}


