import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {User} from "../entity/user";


const  CHECKIN_TABLE_NAME = 'checkins';

@Entity(CHECKIN_TABLE_NAME)
export class Checkins {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    user!: User;

    @Column({type: 'decimal', precision: 10, scale: 7})
    latitude!: number;

    @Column({type: 'decimal', precision: 10, scale: 7})
    longitude!: number;

    @Column({type: 'text'})
    location!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}