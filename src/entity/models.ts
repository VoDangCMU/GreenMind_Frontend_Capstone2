import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

@Entity('models')
export class Models {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'text'})
    ocean!: string;

    @Column({type: 'text'})
    behavior!: string;

    @Column({type: 'text'})
    age!: string;

    @Column({type: 'text'})
    location!: string;

    @Column({type: 'text'})
    gender!: string;

    @Column({type: 'text'})
    keywords!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}
